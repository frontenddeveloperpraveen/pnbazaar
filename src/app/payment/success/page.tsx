"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../../context/CartContext";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") || "—";
  const { clearCart } = useCart();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Start redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRedirecting(true);
          router.push("/orders");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedFeedback(true);
  };

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
        {/* SVG Animated Checkmark */}
        <div style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 24px",
          borderRadius: "50%",
          background: "#ecfdf5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" style={{
              strokeDasharray: "50",
              strokeDashoffset: "50",
              animation: "drawCheckmark 0.6s ease forwards 0.2s"
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
          Payment Successful!
        </h1>
        <p style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "20px",
          lineHeight: "1.5"
        }}>
          Thank you for your order. Redirecting to your Order Summary in{" "}
          <strong style={{ color: "#008060" }}>{secondsLeft}s</strong>...
        </p>

        {/* Order Info Card */}
        <div style={{
          background: "#f9fafb",
          border: "1px solid #f3f4f6",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          textAlign: "left"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>ORDER ID</span>
            <span style={{ fontSize: "13px", color: "#111827", fontFamily: "monospace", fontWeight: 600 }}>{orderId}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>STATUS</span>
            <span style={{ fontSize: "13px", color: "#10b981", fontWeight: 700 }}>PAID</span>
          </div>
        </div>

        {/* Rate Our Experience widget */}
        <div style={{
          borderTop: "1px solid #f3f4f6",
          paddingTop: "20px",
          marginBottom: "28px"
        }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
            Rate Our Experience
          </h3>
          {!submittedFeedback ? (
            <form onSubmit={handleSubmitFeedback}>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      fontSize: "28px",
                      color: star <= (hoverRating || rating) ? "#fbbf24" : "#d1d5db",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      outline: "none"
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Write optional feedback..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  outline: "none",
                  marginBottom: "10px",
                  boxSizing: "border-box"
                }}
              />
              <button
                type="submit"
                disabled={rating === 0}
                style={{
                  background: rating > 0 ? "#111827" : "#9ca3af",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: rating > 0 ? "pointer" : "default"
                }}
              >
                Submit Review
              </button>
            </form>
          ) : (
            <p style={{ fontSize: "13px", color: "#10b981", fontWeight: 600 }}>
              Thank you for your feedback!
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href="/orders" style={{
            background: "#008060",
            color: "#ffffff",
            padding: "14px 24px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s ease",
            display: "block",
            boxShadow: "0 4px 6px rgba(0, 128, 96, 0.15)"
          }}>
            View My Orders Now
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
        @keyframes drawCheckmark {
          to {
            strokeDashoffset: 0;
          }
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
