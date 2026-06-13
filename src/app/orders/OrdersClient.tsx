"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import styles from "./orders.module.css";

const STEPS = ["Processing", "Shipped", "Delivered"];

function OrdersContent() {
  const searchParams = useSearchParams();
  const { orders, updateOrderStatus } = useCart();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessAlert(true);
    }
  }, [searchParams]);

  return (
    <div className={styles.container}>
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

      {orders.length > 0 ? (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const stepIndex = STEPS.indexOf(order.status);

            return (
              <div key={order.id} className={styles.orderCard}>
                {/* Clickable Header */}
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

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={styles.orderBody}>
                    {/* Status Steps */}
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

                    {/* Items + Delivery in two columns */}
                    <div className={styles.itemsCol}>
                      <h4 className={styles.sectionTitle}>Items Ordered</h4>
                      <div className={styles.itemsGrid}>
                        {order.items.map((item, idx) => (
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
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
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
