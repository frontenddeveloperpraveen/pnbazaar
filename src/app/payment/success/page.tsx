"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../../context/CartContext";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") || "—";
  const method = searchParams.get("method") || "ONLINE";
  const isCOD = method === "COD";
  const { clearCart } = useCart();
  const clearedRef = React.useRef(false);

  const [secondsLeft, setSecondsLeft] = useState<number>(15);

  useEffect(() => {
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/orders");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
      fontFamily: "var(--font-sans, Inter, sans-serif)",
      padding: "20px"
    }}>
      <div style={{
        background: "#ffffff",
        padding: "48px 40px 40px",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        textAlign: "center",
        maxWidth: "440px",
        width: "100%",
        animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Thumbs Up Icon */}
        <div style={{
          width: "88px",
          height: "88px",
          margin: "0 auto 20px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(16,185,129,0.2)"
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: "thumbsUpBounce 0.6s ease 0.3s both" }}>
            <path d="M7 22V11M2 13v7a2 2 0 0 0 2 2h12.4a2 2 0 0 0 1.94-1.57l1.6-7A2 2 0 0 0 18 9h-5V4a2 2 0 0 0-2-2 1 1 0 0 0-.87.52L7 11v11z" />
          </svg>
        </div>

        <h1 style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#111827",
          marginBottom: "8px",
          letterSpacing: "-0.5px"
        }}>
          {isCOD ? "Order Placed Successfully!" : "Payment Successful!"}
        </h1>
        <p style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "24px",
          lineHeight: "1.6"
        }}>
          {isCOD
            ? "Your order has been placed. You will pay when it arrives."
            : "Thank you for your payment. Your order is confirmed."}
          <br />
          Redirecting to your orders in{" "}
          <strong style={{ color: "#008060" }}>{secondsLeft}s</strong>...
        </p>

        {/* Order Info Card */}
        <div style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "18px 20px",
          marginBottom: "28px",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Order ID</span>
            <span style={{ fontSize: "13px", color: "#111827", fontFamily: "monospace", fontWeight: 700 }}>{orderId}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</span>
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              color: isCOD ? "#d97706" : "#059669",
              background: isCOD ? "#fef3c7" : "#d1fae5",
              padding: "4px 12px",
              borderRadius: "100px",
            }}>
              {isCOD ? "PENDING" : "PAID"}
            </span>
          </div>
        </div>

        <Link
          href="/orders"
          style={{
            background: "#111827",
            color: "#ffffff",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 700,
            textDecoration: "none",
            display: "block",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#374151"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#111827"; e.currentTarget.style.transform = "none"; }}
        >
          View My Orders
        </Link>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes thumbsUpBounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
