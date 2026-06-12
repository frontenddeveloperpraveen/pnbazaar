"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import { trackEvent } from "../lib/tracker";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  
  const pathnameRef = useRef(pathname);
  const startTimeRef = useRef(Date.now());

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

  if (isAdmin) {
    return (
      <>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <CartDrawer />
      <main style={{ marginTop: "110px", minHeight: "calc(100vh - 110px - 380px)", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

