"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const token = searchParams.get("token") || "";
  const cancelled = searchParams.get("cancelled") === "true";

  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (orderId && token) {
      fetch("/api/orders/claim-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) { setVerified(true); setOrderData(data.order); }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId, token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%)", fontFamily: "var(--font-sans, Inter, sans-serif)", padding: "40px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.07)", maxWidth: 500, width: "100%", overflow: "hidden", animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {/* Failure header */}
        <div style={{ padding: "40px 36px 28px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ width: 80, height: 80, margin: "0 auto 20px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(239,68,68,0.15)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "crossPop 0.6s ease 0.2s both" }}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8, letterSpacing: "-0.5px" }}>
            {cancelled ? "Payment Cancelled" : "Payment Failed"}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
            {cancelled
              ? "You closed the payment window. No charges were made."
              : "We couldn't process your payment. No amount has been deducted."}
          </p>
        </div>

        {/* Info */}
        {orderId && (
          <div style={{ padding: "20px 36px", background: "#f9fafb", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>Order ID</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "monospace", letterSpacing: 0.5 }}>{orderId}</span>
            </div>
            {orderData?.giftWrap && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#d97706", background: "#fef3c7", padding: "3px 10px", borderRadius: 100 }}>
                  🎁 Gift Wrap{orderData.giftNote ? `: "${orderData.giftNote}"` : ""}
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: "24px 36px" }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.6, margin: 0 }}>
              {cancelled
                ? "Your order has been cancelled. If you still want to proceed, please go back to your cart and try again."
                : "If your money was deducted, it will be refunded automatically within 3-5 business days. Contact support if you need help."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/cart" style={{ background: "#111827", color: "#fff", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none", textAlign: "center", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              Return to Cart
            </Link>
            <Link href="/" style={{ background: "transparent", color: "#111827", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", textAlign: "center", border: "1px solid #e5e7eb" }}>
              Back to Home
            </Link>
          </div>

          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
            Need help?{" "}
            <a href="mailto:support@pnbazaar.shop" style={{ color: "#111827", fontWeight: 600, textDecoration: "underline" }}>
              support@pnbazaar.shop
            </a>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes crossPop { 0% { transform: scale(0) rotate(-90deg); opacity: 0; } 50% { transform: scale(1.2) rotate(10deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
