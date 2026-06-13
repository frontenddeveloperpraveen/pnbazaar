"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "—";
  const cancelled = searchParams.get("cancelled") === "true";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
      fontFamily: "var(--font-sans, Inter, sans-serif)",
      padding: "20px"
    }}>
      <div style={{
        background: "#ffffff",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
        textAlign: "center",
        maxWidth: "480px",
        width: "100%",
        animation: "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* SVG Animated Red Cross */}
        <div style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 24px",
          borderRadius: "50%",
          background: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" style={{
              strokeDasharray: "30",
              strokeDashoffset: "30",
              animation: "drawCrossLine 0.4s ease forwards 0.2s"
            }} />
            <line x1="6" y1="6" x2="18" y2="18" style={{
              strokeDasharray: "30",
              strokeDashoffset: "30",
              animation: "drawCrossLine 0.4s ease forwards 0.5s"
            }} />
          </svg>
        </div>

        <h1 style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#111827",
          marginBottom: "8px",
          letterSpacing: "-0.5px"
        }}>
          {cancelled ? "Payment Cancelled" : "Payment Failed"}
        </h1>
        <p style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "28px",
          lineHeight: "1.5"
        }}>
          {cancelled
            ? "You closed the payment portal. No charges were made, and your order has been marked as cancelled."
            : "We couldn't verify your payment. If your money was deducted, it will be refunded automatically within 3-5 business days."}
        </p>

        {/* Order Info Card */}
        <div style={{
          background: "#f9fafb",
          border: "1px solid #f3f4f6",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "32px",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>ORDER ID</span>
            <span style={{ fontSize: "13px", color: "#111827", fontFamily: "monospace", fontWeight: 600 }}>{orderId}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>STATUS</span>
            <span style={{ fontSize: "13px", color: "#ef4444", fontWeight: 700 }}>CANCELLED</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href="/" style={{
            background: "#111827",
            color: "#ffffff",
            padding: "14px 24px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s ease",
            display: "block"
          }}>
            Back to Home
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes drawCrossLine {
          to {
            strokeDashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
