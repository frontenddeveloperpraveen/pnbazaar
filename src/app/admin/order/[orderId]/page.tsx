"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart, Order } from "../../../../context/CartContext";
import styles from "./order.module.css";

const STATUS_LIST = ["Pending", "Processing", "Shipped", "Delivered", "Return", "Cancelled", "Cancellation Requested"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "#fef3c7", Processing: "#fef3c7", Shipped: "#dbeafe", Delivered: "#d1fae5",
  OnHold: "#ffe4e6", Return: "#ffedd5", Cancelled: "#f3f4f6", Archived: "#f3f4f6",
  "Cancellation Requested": "#fee2e2"
};
const STATUS_TEXT_COLORS: Record<string, string> = {
  Pending: "#92400e", Processing: "#92400e", Shipped: "#1e40af", Delivered: "#065f46",
  OnHold: "#9f1239", Return: "#9a3412", Cancelled: "#6b7280", Archived: "#6b7280",
  "Cancellation Requested": "#b91c1c"
};

const COURIER_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: "Delhivery", patterns: [/delhivery\.com/i] },
  { name: "Blue Dart", patterns: [/bluedart\.com/i] },
  { name: "DTDC", patterns: [/dtdc\.in/i] },
  { name: "FedEx", patterns: [/fedex\.com/i] },
  { name: "India Post", patterns: [/indiapost\.gov\.in/i] },
  { name: "XpressBees", patterns: [/xpressbees\.com/i] },
  { name: "Ecom Express", patterns: [/ecomexpress\.in/i] },
  { name: "TrackOn", patterns: [/trackon\.in/i] },
  { name: "Professional Couriers", patterns: [/professionalcouriers\.com/i] },
];

function detectCourier(url: string): string {
  if (!url) return "";
  for (const c of COURIER_PATTERNS) {
    if (c.patterns.some(p => p.test(url))) return c.name;
  }
  return "Other";
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, updateOrderStatus } = useCart();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  // Confirmation modal state
  const [confirmingStatus, setConfirmingStatus] = useState<string | null>(null);
  const [trackingLink, setTrackingLink] = useState("");
  const [courierService, setCourierService] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleCancelConfirmFlow = async (action: "Approve" | "Reject") => {
    if (!order) return;
    if (action === "Approve") {
      const reason = window.prompt("Enter cancellation approval reason:") || "Customer request approved";
      setSaving(true);
      try {
        await updateOrderStatus(order.id, "Cancelled", undefined);
        await fetch(`/api/orders/${order.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Cancelled", cancelReason: reason })
        });
        setOrder({ ...order, status: "Cancelled", cancelReason: reason });
        showToast("Cancellation approved and email sent", "success");
      } catch (err) {
        showToast("Failed to approve cancellation", "error");
      } finally {
        setSaving(false);
      }
    } else {
      if (!window.confirm("Reject customer cancellation request and return order to Processing?")) return;
      setSaving(true);
      try {
        await updateOrderStatus(order.id, "Processing", undefined);
        setOrder({ ...order, status: "Processing" });
        showToast("Cancellation request rejected", "success");
      } catch (err) {
        showToast("Failed to reject request", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_access_token");
    if (!token) { router.push("/admin"); return; }
    setAuth(true);
  }, [router]);

  useEffect(() => {
    if (!orderId || !auth) return;
    const found = orders.find((o: any) => o.id === orderId);
    if (found) {
      setOrder(found);
      setLoading(false);
    } else {
      const check = setInterval(() => {
        const o = orders.find((ord: any) => ord.id === orderId);
        if (o) { setOrder(o); setLoading(false); clearInterval(check); }
      }, 500);
      setTimeout(() => { clearInterval(check); setLoading(false); }, 5000);
    }
  }, [orderId, orders, auth]);

  const showToast = (message: string, type: "success" | "error") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleStatusSelect = (newStatus: string) => {
    if (!order || newStatus === order.status) return;
    setConfirmingStatus(newStatus);
    setTrackingLink(order.trackingLink || "");
    setCourierService(order.courierService || "");
    setSendEmail(true);
  };

  const handleTrackingLinkChange = (val: string) => {
    setTrackingLink(val);
    if (val) {
      const detected = detectCourier(val);
      if (detected) setCourierService(detected);
    } else {
      setCourierService("");
    }
  };

  const handleConfirmStatus = async () => {
    if (!order || !confirmingStatus) return;
    setSaving(true);
    const prev = order.status;
    const trackingData = confirmingStatus === "Shipped" && trackingLink
      ? { trackingLink, courierService }
      : undefined;
    setOrder({ ...order, status: confirmingStatus as Order["status"], ...(trackingData || {}) });
    setConfirmingStatus(null);
    try {
      if (confirmingStatus === "Cancelled") {
        await fetch(`/api/orders/${order.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Cancelled", cancelReason })
        });
      } else {
        await updateOrderStatus(order.id, confirmingStatus as Order["status"], trackingData);
      }
      const emailMsg = sendEmail ? " — email notification sent" : " — email skipped";
      showToast(`Status updated to "${confirmingStatus}"${emailMsg}`, "success");
    } catch {
      setOrder({ ...order, status: prev });
      showToast("Failed to update status", "error");
    }
    setSaving(false);
  };

  const handleCancelConfirm = () => {
    setConfirmingStatus(null);
    setTrackingLink("");
    setCourierService("");
    setCancelReason("");
  };

  if (!auth || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loader}>Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h2>Order Not Found</h2>
          <p>The order with ID &quot;{orderId}&quot; could not be found.</p>
          <Link href="/admin?tab=orders" className={styles.btn}>Back to Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/admin?tab=orders" className={styles.backBtn}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Orders
        </Link>
        <div className={styles.orderIdBadge}>Order #{order.id}</div>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order Details</h1>
          <p className={styles.subtitle}>Placed on {new Date(order.date).toLocaleString("en-IN")}</p>
        </div>
        <div className={styles.statusGroup}>
          <div className={styles.statusRow}>
            <select
              value={order.status === "Archived" ? order.status : order.status}
              onChange={(e) => handleStatusSelect(e.target.value)}
              className={styles.statusSelect}
              style={{
                backgroundColor: STATUS_COLORS[order.status] || "#f3f4f6",
                color: STATUS_TEXT_COLORS[order.status] || "#6b7280",
                borderColor: STATUS_TEXT_COLORS[order.status] || "#d1d5db",
              }}
            >
              {STATUS_LIST.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {order.status !== "Archived" ? (
              <button onClick={() => { setConfirmingStatus("Archived"); setSendEmail(false); }} className={styles.archiveBtn} title="Move to Archived">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                Archive
              </button>
            ) : (
              <button onClick={() => { setConfirmingStatus("Pending"); setSendEmail(false); }} className={styles.unarchiveBtn} title="Restore from Archived">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                Unarchive
              </button>
            )}
            <button
              onClick={async () => {
                if (!window.confirm("Delete this order permanently?")) return;
                try {
                  const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Delete failed");
                  showToast("Order deleted", "success");
                  setTimeout(() => router.push("/admin?tab=orders"), 1000);
                } catch {
                  showToast("Failed to delete order", "error");
                }
              }}
              className={styles.deleteBtn}
              title="Delete order permanently"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete
            </button>
          </div>
          <span className={styles.autoSaveLabel}>Click status to confirm change</span>
        </div>
      </div>

      {order.status === "Cancellation Requested" && (
        <div style={{ padding: "16px 20px", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h4 style={{ margin: "0 0 4px 0", color: "#991b1b", fontSize: "14px", fontWeight: 700 }}>Cancellation Requested by Customer</h4>
            <p style={{ margin: 0, color: "#7f1d1d", fontSize: "13px" }}>This customer has requested to cancel this order. Please approve or reject the request.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => handleCancelConfirmFlow("Approve")}
              style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "4px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
            >
              Approve & Cancel
            </button>
            <button 
              onClick={() => handleCancelConfirmFlow("Reject")}
              style={{ padding: "8px 16px", backgroundColor: "#edf2f7", color: "#4a5568", border: "1px solid #cbd5e1", borderRadius: "4px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
            >
              Reject Request
            </button>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* Items */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Items</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "50px" }}></th>
                <th>Product</th>
                <th>Variant</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, i: number) => (
                <tr key={i}>
                  <td>
                    {(item.product?.image || item.image) ? (
                      <img src={item.product?.image || item.image} alt="" className={styles.thumb} />
                    ) : (
                      <div className={styles.thumbPlaceholder} />
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.product?.name || item.name || item.title || "—"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    {[item.product?.size, item.product?.material].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>₹{Number(item.product?.price || item.price || 0).toLocaleString("en-IN")}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    ₹{((item.product?.price || item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customer */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Customer</h3>
          <div className={styles.detailBlock}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Name</span>
              <span>{order.customerInfo?.name || "—"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <span>{order.customerInfo?.email || "—"}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Phone</span>
              <span>{order.customerInfo?.phone || "—"}</span>
            </div>
            {order.customerInfo?.ipLocation && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>IP Location</span>
                <span>{order.customerInfo.ipLocation}</span>
              </div>
            )}
            {order.customerInfo?.lat && order.customerInfo?.lng && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Coordinates</span>
                <span>{order.customerInfo.lat.toFixed(6)}, {order.customerInfo.lng.toFixed(6)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Billing Address */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Billing Address</h3>
          <div className={styles.detailBlock}>
            {order.customerInfo?.doorNo && <div>Door: {order.customerInfo.doorNo}</div>}
            {order.customerInfo?.houseName && <div>{order.customerInfo.houseName}</div>}
            {order.customerInfo?.streetName && <div>{order.customerInfo.streetName}</div>}
            {order.customerInfo?.address && <div>{order.customerInfo.address}</div>}
            <div style={{ marginTop: "4px" }}>
              {order.customerInfo?.pincode}{order.customerInfo?.state ? `, ${order.customerInfo.state}` : ""}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Shipping Address</h3>
          <div className={styles.detailBlock}>
            {order.customerInfo?.shippingAddress ? (
              <>
                <div>{order.customerInfo.shippingAddress}</div>
                {order.customerInfo.shippingState && <div>{order.customerInfo.shippingState} - {order.customerInfo.shippingPincode}</div>}
              </>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>Same as billing</div>
            )}
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
              <strong style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Estimated Delivery Date</strong>
              <div style={{ fontWeight: 600, color: "#008060" }}>
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
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Pricing */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Payment &amp; Pricing</h3>
          <div className={styles.detailBlock}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Grand Total</span>
              <strong style={{ fontSize: "18px", color: "#008060" }}>₹{order.total.toLocaleString("en-IN")}</strong>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Payment Method</span>
              <span>{order.customerInfo?.paymentMethod === "COD" ? "Cash on Delivery" : order.customerInfo?.paymentMethod || "Standard"}</span>
            </div>
            {order.appliedCoupon && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Coupon Applied</span>
                <span style={{ color: "#008060", fontWeight: 600 }}>{order.appliedCoupon}</span>
              </div>
            )}
            {order.cashbackApplied && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Cashback</span>
                <span style={{ color: "#008060", fontWeight: 600 }}>₹{order.cashbackApplied}</span>
              </div>
            )}
            {order.customerInfo?.giftWrap && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Gift Wrap</span>
                <span>Yes {order.customerInfo.giftNote ? `— "${order.customerInfo.giftNote}"` : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tracking & Communication */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Tracking &amp; Communication</h3>
          <div className={styles.detailBlock}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Confirmation Email</span>
              {order.emailSent ? (
                <span style={{ color: "#008060", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Sent
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>Not sent</span>
              )}
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Default Order</span>
              <span>{order.defaultOrdered ? "Yes" : "No"}</span>
            </div>
            {order.trackingLink && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tracking</span>
                <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#008060", fontSize: "12px", textDecoration: "underline", wordBreak: "break-all" }}>
                  {order.courierService || "Track"} ↗
                </a>
              </div>
            )}
            {order.courierService && !order.trackingLink && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Courier</span>
                <span>{order.courierService}</span>
              </div>
            )}
          </div>
        </div>

        {/* Location Map */}
        {order.customerInfo?.lat && order.customerInfo?.lng && (
          <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
            <h3 className={styles.cardTitle}>Order Location</h3>
            <div style={{ width: "100%", height: "280px", borderRadius: "6px", overflow: "hidden" }}>
              <iframe
                title="Order Location"
                width="100%" height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${order.customerInfo.lat},${order.customerInfo.lng}&zoom=15`}
              />
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", textAlign: "center" }}>
              {order.customerInfo.lat.toFixed(6)}, {order.customerInfo.lng.toFixed(6)}
            </div>
          </div>
        )}
      </div>

      {/* Status Confirmation Modal */}
      {confirmingStatus && (
        <div className={styles.overlay} onClick={handleCancelConfirm}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm Status Change</h3>
            <p className={styles.modalSub}>
              <span className={styles.statusPill} style={{ backgroundColor: STATUS_COLORS[order.status], color: STATUS_TEXT_COLORS[order.status] }}>{order.status}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 10px" }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              <span className={styles.statusPill} style={{ backgroundColor: STATUS_COLORS[confirmingStatus], color: STATUS_TEXT_COLORS[confirmingStatus] }}>{confirmingStatus}</span>
            </p>

            {/* Tracking link — only shown when changing to Shipped */}
            {confirmingStatus === "Shipped" && (
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Tracking Link</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  placeholder="https://example.com/track/ABC123"
                  value={trackingLink}
                  onChange={(e) => handleTrackingLinkChange(e.target.value)}
                />
                {courierService && (
                  <span className={styles.courierBadge}>Detected courier: {courierService}</span>
                )}
              </div>
            )}

            {confirmingStatus === "Cancelled" && (
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Reason for Cancellation *</label>
                <textarea
                  className={styles.modalInput}
                  rows={3}
                  placeholder="e.g. Item out of stock, customer requested cancel, etc."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", marginTop: "4px", outline: "none", resize: "vertical" }}
                  required
                />
              </div>
            )}

            {/* Send email checkbox */}
            <div className={styles.modalField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Send email notification to customer</span>
              </label>
            </div>

            <div className={styles.modalActions}>
              <button onClick={handleCancelConfirm} className={styles.modalCancel} disabled={saving}>
                Cancel
              </button>
              <button onClick={handleConfirmStatus} className={styles.modalConfirm} disabled={saving}>
                {saving ? "Saving..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === "success" ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}