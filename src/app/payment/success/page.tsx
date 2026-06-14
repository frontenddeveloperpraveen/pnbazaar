"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface OrderData {
  id: string;
  status: string;
  paymentMethod: string;
  date: string;
  total: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  items: any[];
  customerInfo: any;
  giftWrap?: boolean;
  giftNote?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") || "";
  const token = searchParams.get("token") || "";
  const method = searchParams.get("method") || "ONLINE";
  const isCOD = method === "COD";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !token) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    fetch("/api/orders/claim-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "This link is no longer valid");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong");
        setLoading(false);
      });
  }, [orderId, token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "var(--font-sans, Inter, sans-serif)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, margin: "0 auto 16px", border: "3px solid #e5e7eb", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#6b7280", fontSize: 14 }}>Verifying your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "var(--font-sans, Inter, sans-serif)", padding: 20 }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.06)", textAlign: "center", maxWidth: 400, width: "100%" }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#111" }}>{error === "This confirmation link has already been used" ? "Already Viewed" : "Link Expired"}</h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
            {error === "This confirmation link has already been used"
              ? "This order confirmation was already viewed. If you need help, contact support."
              : "This link is invalid or expired. Please contact support if you need assistance."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/orders" style={{ padding: "12px 24px", background: "#111827", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>View My Orders</Link>
            <Link href="/" style={{ padding: "12px 24px", background: "#f3f4f6", color: "#111", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Go Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (d: string) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + ", " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch { return d; }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", fontFamily: "var(--font-sans, Inter, sans-serif)", padding: "40px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.07)", maxWidth: 520, width: "100%", overflow: "hidden", animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {/* Success header */}
        <div style={{ padding: "40px 36px 28px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ width: 88, height: 88, margin: "0 auto 20px", borderRadius: "50%", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(16,185,129,0.2)" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "checkPop 0.6s ease 0.2s both" }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8, letterSpacing: "-0.5px" }}>
            {isCOD ? "Order Placed!" : "Payment Successful!"}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5, margin: 0 }}>
            {isCOD
              ? "Your order has been placed. You will pay when it arrives."
              : "Your payment was completed successfully. Your order is confirmed."}
          </p>
        </div>

        {/* Order ID */}
        <div style={{ padding: "20px 36px", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>Order ID</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "monospace", letterSpacing: 0.5 }}>{order?.id || orderId}</span>
        </div>

        {/* Order details */}
        <div style={{ padding: "24px 36px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Status</span>
              <span style={{ fontWeight: 700, color: isCOD ? "#d97706" : "#059669", background: isCOD ? "#fef3c7" : "#d1fae5", padding: "2px 10px", borderRadius: 100, fontSize: 11 }}>
                {isCOD ? "PENDING" : "PAID"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Date</span>
              <span style={{ fontWeight: 600, color: "#111" }}>{order?.date ? formatDate(order.date) : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Payment</span>
              <span style={{ fontWeight: 600, color: "#111" }}>{isCOD ? "Cash on Delivery" : "Online Payment"}</span>
            </div>
            {order?.giftWrap && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}>
                <span style={{ color: "#6b7280" }}>Gift Wrap</span>
                <span style={{ fontWeight: 600, color: "#d97706", background: "#fef3c7", padding: "2px 10px", borderRadius: 100, fontSize: 11 }}>🎁 {order.giftNote ? `"${order.giftNote}"` : "Yes"}</span>
              </div>
            )}
          </div>

          {order && order.items && order.items.length > 0 && (
            <div style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Items</p>
              {order.items.slice(0, 4).map((item: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.product?.title || item.product?.name || item.name || "Item"} x{item.quantity}
                  </span>
                  <span style={{ fontWeight: 600, color: "#111", marginLeft: 12, whiteSpace: "nowrap" }}>
                    ₹{((item.product?.price || item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
              {order.items.length > 4 && (
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>+{order.items.length - 4} more items</p>
              )}
            </div>
          )}

          {order && (
            <div style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#6b7280" }}>Subtotal</span>
                <span style={{ color: "#111" }}>₹{(order.subtotal || 0).toLocaleString("en-IN")}</span>
              </div>
              {(order.discount || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#10b981" }}>Discount</span>
                  <span style={{ color: "#10b981" }}>-₹{(order.discount || 0).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#6b7280" }}>Shipping</span>
                <span style={{ color: "#111" }}>{order.deliveryFee === 0 ? "FREE" : `₹${(order.deliveryFee || 0).toLocaleString("en-IN")}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, marginTop: 10, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                <span style={{ color: "#111" }}>Total</span>
                <span style={{ color: "#111827" }}>₹{(order.total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: "0 36px 36px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/orders" style={{ background: "#111827", color: "#fff", padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none", textAlign: "center", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            View My Orders
          </Link>
          <Link href="/" style={{ background: "transparent", color: "#111827", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none", textAlign: "center", border: "1px solid #e5e7eb" }}>
            Continue Shopping
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
