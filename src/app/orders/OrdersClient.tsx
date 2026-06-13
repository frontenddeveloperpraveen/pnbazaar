"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import styles from "./orders.module.css";

declare global {
  interface Window {
    google?: any;
  }
}

const STEPS = ["Processing", "Shipped", "Delivered"];

function decodeToken(token: string): { email: string; name: string } | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return { email: decoded.email, name: decoded.name };
  } catch {
    return null;
  }
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const { orders, updateOrderStatus, refreshOrders } = useCart();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Login form
  const [loginName, setLoginName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // On mount, check for existing token
  useEffect(() => {
    const stored = localStorage.getItem("orders_auth_token");
    if (stored) {
      const decoded = decodeToken(stored);
      if (decoded && decoded.email) {
        setAuthToken(stored);
        setUserEmail(decoded.email);
        setUserName(decoded.name);
      }
    } else {
      // Check for success alert param
      if (searchParams.get("success") === "true") {
        setShowSuccessAlert(true);
      }
    }
  }, [searchParams]);

  // Google Sign-In initialization
  useEffect(() => {
    if (authToken) return;

    const GOOGLE_CLIENT_ID = "1025360315399-rpl33br5haa520mp35gj9m1cvifp72rn.apps.googleusercontent.com";

    const initGoogle = () => {
      if (typeof window.google === "undefined" || !googleBtnRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "signin_with",
        });
      } catch (e) {
        console.error("Google init error:", e);
      }
    };

    if (typeof window.google !== "undefined") {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [authToken]);

  // Fetch orders for the authed user
  useEffect(() => {
    if (!authToken || !userEmail) return;
    setLoadingOrders(true);
    fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Merge into the orders state from CartContext
          const existingIds = new Set(orders.map((o: any) => o.id));
          const newOnes = data.filter((o: any) => !existingIds.has(o.id));
          if (newOnes.length > 0) {
            // We need to inject them. Since orders comes from context,
            // we'll use a separate state for user orders.
            setUserOrders(data);
          } else {
            setUserOrders(data);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [authToken, userEmail]);

  const [userOrders, setUserOrders] = useState<any[]>([]);

  const handleGetOtp = async () => {
    if (!loginName.trim() || !loginEmail.trim()) {
      setAuthError("Name and email are required");
      return;
    }
    setSendingOtp(true);
    setAuthError("");
    setAuthMessage("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), name: loginName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      setAuthMessage("OTP sent to your email. Please check inbox/spam.");
    } catch (err: any) {
      setAuthError(err.message);
    }
    setSendingOtp(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setAuthError("Enter the OTP");
      return;
    }
    setVerifying(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      localStorage.setItem("orders_auth_token", data.token);
      setAuthToken(data.token);
      setUserEmail(data.email);
      setUserName(data.name);
    } catch (err: any) {
      setAuthError(err.message);
    }
    setVerifying(false);
  };

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) return;
    setAuthError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google login failed");
      localStorage.setItem("orders_auth_token", data.token);
      setAuthToken(data.token);
      setUserEmail(data.email);
      setUserName(data.name);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("orders_auth_token");
    setAuthToken(null);
    setUserEmail("");
    setUserName("");
    setOtpSent(false);
    setOtp("");
    setLoginName("");
    setLoginEmail("");
    setLoginPassword("");
    setUserOrders([]);
  };

  const handleRequestCancellation = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to request cancellation for this order?")) return;
    try {
      await updateOrderStatus(orderId, 'Cancellation Requested' as any);
      alert("Cancellation request submitted successfully. Waiting for admin confirmation.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit cancellation request.");
    }
  };

  const displayOrders = userOrders.length > 0 ? userOrders : (orders.filter((o: any) => o.customerInfo?.email === userEmail));

  // Render login screen if not authenticated
  if (!authToken) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.tag}>History & Status</span>
          <h1 className={styles.title}>My Orders</h1>
        </header>
        <div className={styles.loginContainer}>
          <div className={styles.loginCard}>
            <h2 className={styles.loginTitle}>Sign in to view your orders</h2>
            <p className={styles.loginSub}>Enter your details and verify with OTP to access your order history.</p>

            {authError && <div className={styles.authError}>{authError}</div>}
            {authMessage && <div className={styles.authSuccess}>{authMessage}</div>}

            {!otpSent ? (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className={styles.authInput}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={styles.authInput}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={styles.authInput}
                />
                <button onClick={handleGetOtp} disabled={sendingOtp} className={styles.authBtn}>
                  {sendingOtp ? "Sending OTP..." : "Get OTP"}
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 12px" }}>
                  OTP sent to <strong>{loginEmail}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className={styles.authInput}
                />
                <button onClick={handleVerifyOtp} disabled={verifying} className={styles.authBtn}>
                  {verifying ? "Verifying..." : "Verify OTP"}
                </button>
                <button onClick={() => { setOtpSent(false); setOtp(""); setAuthError(""); }} className={styles.authLinkBtn}>
                  Change email or resend
                </button>
              </>
            )}

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center" }}></div>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Link href="/" className={styles.authLinkBtn} style={{ textDecoration: "none", display: "inline-block" }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.authBar}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Signed in as <strong>{userName}</strong> ({userEmail})
        </span>
        <button onClick={handleLogout} className={styles.logoutBtn}>Sign Out</button>
      </div>

      {showSuccessAlert && (
        <div className={styles.successBanner}>
          <div className={styles.successHeader}>
            <div className={styles.successIconContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.successCheckIcon}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <h3>Order Placed Successfully!</h3>
              <p>Thank you for shopping at PN Bazaar. We have sent a confirmation email to you.</p>
            </div>
          </div>
          <button onClick={() => setShowSuccessAlert(false)} className={styles.closeAlertBtn}>✕</button>
        </div>
      )}

      <header className={styles.header}>
        <span className={styles.tag}>History & Status</span>
        <h1 className={styles.title}>My Orders</h1>
      </header>

      {loadingOrders ? (
        <div className={styles.loadingContainer}>Loading your orders...</div>
      ) : displayOrders.length > 0 ? (
        <div className={styles.ordersList}>
          {displayOrders.map((order: any) => {
            const isExpanded = expandedOrderId === order.id;
            const stepIndex = STEPS.indexOf(order.status);

            return (
              <div key={order.id} className={styles.orderCard}>
                <button
                  className={styles.orderHeader}
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                >
                  <div className={styles.headerMeta}>
                    <div>
                      <span className={styles.metaLabel}>Order ID</span>
                      <span className={styles.metaVal}>{order.id}</span>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Date Placed</span>
                      <span className={styles.metaVal}>{order.date}</span>
                    </div>
                    <div>
                      <span className={styles.metaLabel}>Total Paid</span>
                      <span className={`${styles.metaVal} ${styles.totalPaid}`}>
                        ₹{order.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className={styles.statusBadge}>
                      <span className={styles.statusDot}></span>
                      {order.status}
                    </div>
                    <svg
                      viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: "var(--text-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className={styles.orderBody}>
                    <div style={{ gridColumn: "1 / -1", marginBottom: "8px" }}>
                      <div className={styles.stepTracker}>
                        {STEPS.map((step, i) => (
                          <React.Fragment key={step}>
                            <div className={`${styles.stepItem} ${i <= stepIndex ? styles.stepActive : ""} ${i < stepIndex ? styles.stepCompleted : ""}`}>
                              <div className={styles.stepCircle}>
                                {i < stepIndex ? (
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                  <span>{i + 1}</span>
                                )}
                              </div>
                              <span className={styles.stepLabel}>{step}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={`${styles.stepLine} ${i < stepIndex ? styles.stepLineActive : ""}`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className={styles.itemsCol}>
                      <h4 className={styles.sectionTitle}>Items Ordered</h4>
                      <div className={styles.itemsGrid}>
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className={styles.itemRow}>
                            <img src={item.product.image} alt={item.product.name} className={styles.itemThumb} />
                            <div className={styles.itemMeta}>
                              <Link href={`/product/${item.product.slug}`} className={styles.itemName}>
                                {item.product.name}
                              </Link>
                              <span className={styles.itemQtyPrice}>
                                Qty: {item.quantity} &times; ₹{item.product.price.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.detailsCol}>
                      <h4 className={styles.sectionTitle}>Delivery Details</h4>
                      <div className={styles.shippingDetails}>
                        <p className={styles.detailName}>{order.customerInfo.name}</p>
                        <p className={styles.detailEmail}>{order.customerInfo.email}</p>
                        {order.customerInfo.phone && <p className={styles.detailPhone}>{order.customerInfo.phone}</p>}
                        <div style={{ marginTop: "12px" }}>
                          <span className={styles.detailLabel}>Billing Address</span>
                          <p className={styles.detailAddr}>{order.customerInfo.billingAddress || order.customerInfo.address}</p>
                          {order.customerInfo.billingState && <p className={styles.detailAddr}>{order.customerInfo.billingState} - {order.customerInfo.billingPincode}</p>}
                        </div>
                        {order.customerInfo.shippingAddress && (
                          <div style={{ marginTop: "12px" }}>
                            <span className={styles.detailLabel}>Shipping Address</span>
                            <p className={styles.detailAddr}>{order.customerInfo.shippingAddress}</p>
                            {order.customerInfo.shippingState && <p className={styles.detailAddr}>{order.customerInfo.shippingState} - {order.customerInfo.shippingPincode}</p>}
                          </div>
                        )}
                        <div style={{ marginTop: "12px" }}>
                          <span className={styles.detailLabel}>Payment</span>
                          <p className={styles.detailAddr}>{order.customerInfo.paymentMethod === "COD" ? "Cash on Delivery" : order.customerInfo.paymentMethod || "Standard"}</p>
                        </div>
                        {order.customerInfo.giftWrap && (
                          <div style={{ marginTop: "12px" }}>
                            <span className={styles.detailLabel}>Gift Wrap</span>
                            <p className={styles.detailAddr}>Yes {order.customerInfo.giftNote ? `- "${order.customerInfo.giftNote}"` : ""}</p>
                          </div>
                        )}
                        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
                          <span className={styles.detailLabel} style={{ color: "#008060", fontWeight: 700 }}>Estimated Delivery</span>
                          <p className={styles.detailAddr} style={{ fontWeight: 600, color: "#111827" }}>
                            {(() => {
                              const today = new Date();
                              let daysToAdd = 5;
                              const targetDate = new Date(today);
                              targetDate.setDate(today.getDate() + 5);
                              if (targetDate.getDay() === 0) {
                                daysToAdd = 6;
                              }
                              const finalDate = new Date(today);
                              finalDate.setDate(today.getDate() + daysToAdd);
                              return finalDate.toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              });
                            })()}
                          </p>
                        </div>
                        {['Pending', 'Processing'].includes(order.status) && (
                          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
                            <button
                              onClick={() => handleRequestCancellation(order.id)}
                              style={{ width: "100%", padding: "10px 16px", backgroundColor: "#fecaca", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "100px", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}
                            >
                              Request Cancellation
                            </button>
                          </div>
                        )}
                        {order.status === 'Cancellation Requested' && (
                          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
                            <p style={{ color: "#b91c1c", fontSize: "13px", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block" }}></span>
                              Cancellation request pending approval
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIconContainer}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
              <polygon points="12 22.08 12 12 3 6.92 3 17 12 22.08"></polygon>
              <polygon points="12 12 21 6.92 21 17 12 22.08"></polygon>
              <polygon points="12 2 3 6.92 12 12 21 6.92 12 2"></polygon>
              <line x1="12" y1="22.08" x2="12" y2="22.08"></line>
            </svg>
          </div>
          <h2>No Orders Found</h2>
          <p>You haven&rsquo;t placed any orders yet. Once you make a purchase, it will appear here.</p>
          <Link href="/" className={styles.backBtn}>Start Shopping</Link>
        </div>
      )}
    </div>
  );
}

export default function OrdersClient() {
  return (
    <Suspense fallback={<div className={styles.loadingContainer}>Loading Orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
