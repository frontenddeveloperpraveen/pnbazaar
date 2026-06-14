"use client";

import React, { useEffect, useRef, Suspense, Component } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import { trackEvent } from "../lib/tracker";
import { AuthProvider } from "../context/AuthContext";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("Page crash caught by ErrorBoundary:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <h2 style={{ marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>An unexpected error occurred on this page.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }} style={{ padding: "10px 24px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isCheckout = pathname?.startsWith("/checkout");
  
  const pathnameRef = useRef(pathname);
  const startTimeRef = useRef(Date.now());
  const isFirstRender = useRef(true);

  const [showLoader, setShowLoader] = React.useState(true);
  const [isFadingOut, setIsFadingOut] = React.useState(false);

  // Initial mount loader
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1200);

    const removeTimer = setTimeout(() => {
      setShowLoader(false);
    }, 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Route transition loader
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsFadingOut(false);
    setShowLoader(true);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 600);

    const removeTimer = setTimeout(() => {
      setShowLoader(false);
    }, 1200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [pathname]);

  // Track page view and handle dwell time tracking on tab switch or close
  useEffect(() => {
    if (pathname && !isAdmin) {
      trackEvent("pageview", pathname);
    }
  }, [pathname, isAdmin]);

  useEffect(() => {
    if (isAdmin) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (duration > 0 && pathnameRef.current) {
          trackEvent("dwell", pathnameRef.current, "", duration);
        }
      } else {
        startTimeRef.current = Date.now();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAdmin]);

  // Track dwell time on path transition
  useEffect(() => {
    if (isAdmin) return;

    const prevPath = pathnameRef.current;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    if (prevPath && duration > 0) {
      trackEvent("dwell", prevPath, "", duration);
    }

    pathnameRef.current = pathname;
    startTimeRef.current = Date.now();
  }, [pathname, isAdmin]);

  const loaderOverlay = showLoader && (
    <div className={`logo-loader-overlay ${isFadingOut ? "fade-out" : ""}`}>
      <div className="logo-loader-content">
        <img
          src="/logo.png"
          alt="PN Bazaar Logo"
          className="logo-loader-img"
        />
        <div className="logo-loader-bar" />
      </div>
    </div>
  );

  return (
    <AuthProvider>
      {isAdmin ? (
        <>
          {loaderOverlay}
          <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </>
      ) : (
        <>
          {loaderOverlay}
          <Suspense fallback={<div style={{ height: "110px" }} />}>
            <Header />
          </Suspense>
          <CartDrawer />
          <main className="main-content" style={{ marginTop: isCheckout ? "0" : "110px", minHeight: isCheckout ? "100vh" : "calc(100vh - 110px - 380px)", display: "flex", flexDirection: "column" }}>
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          {!isCheckout && <Footer />}
        </>
      )}
    </AuthProvider>
  );
}

