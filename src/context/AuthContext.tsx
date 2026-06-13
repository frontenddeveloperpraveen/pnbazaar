"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  initialized: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

function decodeToken(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded.email) return { email: decoded.email, name: decoded.name || decoded.email.split("@")[0] };
    return null;
  } catch {
    return null;
  }
}

const GOOGLE_CLIENT_ID = "1025360315399-rpl33br5haa520mp35gj9m1cvifp72rn.apps.googleusercontent.com";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const oneTapShown = useRef(false);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("orders_auth_token", data.token);
        setToken(data.token);
        setUser({ email: data.email, name: data.name });
      }
    } catch (e) {
      console.error("Google auth error:", e);
    }
  }, []);

  const login = useCallback((newToken: string) => {
    localStorage.setItem("orders_auth_token", newToken);
    setToken(newToken);
    const u = decodeToken(newToken);
    if (u) setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("orders_auth_token");
    setToken(null);
    setUser(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem("orders_auth_token");
    if (stored) {
      const u = decodeToken(stored);
      if (u) {
        setToken(stored);
        setUser(u);
      }
    }
    setInitialized(true);
  }, []);

  // Google One Tap initialization and prompt
  useEffect(() => {
    if (user || !initialized || oneTapShown.current) return;
    oneTapShown.current = true;

    const initOneTap = () => {
      if (typeof window.google === "undefined") {
        console.log("[OneTap] window.google is undefined");
        return;
      }
      if (typeof window.google.accounts === "undefined") {
        console.log("[OneTap] window.google.accounts is undefined");
        return;
      }
      if (typeof window.google.accounts.id === "undefined") {
        console.log("[OneTap] window.google.accounts.id is undefined");
        return;
      }
      console.log("[OneTap] Initializing with client_id:", GOOGLE_CLIENT_ID);
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            console.log("[OneTap] Callback received:", response);
            if (response.credential) handleGoogleCredential(response.credential);
          },
          auto_select: true,
          cancel_on_tap_outside: false,
        });
        console.log("[OneTap] Calling prompt()");
        window.google.accounts.id.prompt((notification: any) => {
          console.log("[OneTap] Prompt notification:", notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log("[OneTap] Not displayed reason:", notification.getNotDisplayedReason());
            console.log("[OneTap] Skipped reason:", notification.getSkippedReason());
          }
        });
      } catch (e) {
        console.error("[OneTap] Init error:", e);
      }
    };

    if (typeof window.google !== "undefined" && typeof window.google.accounts !== "undefined") {
      initOneTap();
    } else {
      console.log("[OneTap] Loading GIS script...");
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("[OneTap] GIS script loaded");
        initOneTap();
      };
      script.onerror = () => console.error("[OneTap] Failed to load GIS script");
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [initialized, user, handleGoogleCredential]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}
