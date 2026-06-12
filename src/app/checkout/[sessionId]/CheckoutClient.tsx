"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../../context/CartContext";
import styles from "./checkout.module.css";

interface CheckoutSession {
  cart: { product: any; quantity: number }[];
  discountCode: string;
  discountPercentage: number;
  discountAmount: number;
  autoOfferDiscount: number;
  subtotal: number;
  combinedPct: number;
  totalDiscount: number;
  shippingFee: number;
}

interface CheckoutClientProps {
  sessionId: string;
}

export default function CheckoutClient({ sessionId }: CheckoutClientProps) {
  const router = useRouter();
  const { checkout, setCartDrawerOpen } = useCart();

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  // Billing
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddressLine1, setBillingAddressLine1] = useState("");
  const [billingAddressLine2, setBillingAddressLine2] = useState("");
  const [billingLandmark, setBillingLandmark] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPincode, setBillingPincode] = useState("");

  // Geolocation
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Shipping
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingName, setShippingName] = useState("");
  const [shippingAddressLine1, setShippingAddressLine1] = useState("");
  const [shippingAddressLine2, setShippingAddressLine2] = useState("");
  const [shippingLandmark, setShippingLandmark] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPincode, setShippingPincode] = useState("");

  // Gift
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftNote, setGiftNote] = useState("");

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const abandonedSaved = useRef(false);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    setCartDrawerOpen(false);
    if (!sessionId) return;
    try {
      const raw = localStorage.getItem("checkout_" + sessionId);
      if (raw) {
        setSession(JSON.parse(raw));
      } else {
        router.push("/cart");
        return;
      }
    } catch {
      router.push("/cart");
      return;
    }
    setLoading(false);
  }, [sessionId, router, setCartDrawerOpen]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  useEffect(() => {
    if (!session || abandonedSaved.current) return;
    abandonedSaved.current = true;
    fetch("/api/abandoned-checkouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        name: "",
        email: "",
        phone: "",
        items: session.cart.map(item => ({
          productId: item.product?.id || item.product?._id,
          name: item.product?.title || item.product?.name,
          price: item.product?.price,
          quantity: item.quantity,
          image: item.product?.images?.[0]
        })),
        total: session.subtotal - session.totalDiscount + session.shippingFee,
        lat,
        lng,
      }),
    }).catch(() => {});
  }, [session, sessionId, lat, lng]);

const STATES_AND_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "South Delhi", "Vasant Kunj"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Noida"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"]
};

  const buildAddress = (line1: string, line2: string, landmark: string, city: string, state: string, pincode: string) => {
    return [line1, line2, landmark ? `Landmark: ${landmark}` : "", city, state, pincode].filter(Boolean).join(", ");
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!billingName.trim()) errs.billingName = "Name is required";
    if (!billingEmail.trim()) errs.billingEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) errs.billingEmail = "Invalid email";
    if (billingPhone && !/^[0-9+\-\s()]{7,15}$/.test(billingPhone)) errs.billingPhone = "Invalid phone number";
    if (!billingAddressLine1.trim()) errs.billingAddress = "Address Line 1 is required";
    if (!billingState) errs.billingState = "State is required";
    if (!billingCity) errs.billingCity = "City is required";
    if (!billingPincode.trim()) errs.billingPincode = "Pincode is required";
    if (!sameAsBilling) {
      if (!shippingName.trim()) errs.shippingName = "Name is required";
      if (!shippingAddressLine1.trim()) errs.shippingAddress = "Address Line 1 is required";
      if (!shippingState) errs.shippingState = "State is required";
      if (!shippingCity) errs.shippingCity = "City is required";
      if (!shippingPincode.trim()) errs.shippingPincode = "Pincode is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const billingFull = buildAddress(billingAddressLine1, billingAddressLine2, billingLandmark, billingCity, billingState, billingPincode);
    const shipName = sameAsBilling ? billingName : shippingName;
    const shipFull = sameAsBilling ? billingFull : buildAddress(shippingAddressLine1, shippingAddressLine2, shippingLandmark, shippingCity, shippingState, shippingPincode);
    const shipState = sameAsBilling ? billingState : shippingState;
    const shipPin = sameAsBilling ? billingPincode : shippingPincode;

    if (paymentMethod === "COD") {
      const result = await checkout({
        name: billingName,
        email: billingEmail,
        address: billingFull,
        state: billingState,
        pincode: billingPincode,
        phone: billingPhone,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        billingAddress: billingFull,
        billingState,
        billingPincode,
        shippingName: shipName,
        shippingAddress: shipFull,
        shippingState: shipState,
        shippingPincode: shipPin,
        paymentMethod: "COD",
        giftWrap: giftWrap || undefined,
        giftNote: giftNote.trim() || undefined,
        addressLine1: billingAddressLine1,
        addressLine2: billingAddressLine2,
        landmark: billingLandmark,
        city: billingCity,
      });

      if (result) {
        try {
          localStorage.removeItem("checkout_" + sessionId);
          await fetch("/api/abandoned-checkouts?sessionId=" + encodeURIComponent(sessionId), { method: "DELETE" });
        } catch {}
        router.push("/orders?success=true");
      } else {
        setErrors({ form: "Failed to place order. Please try again." });
        setSubmitting(false);
      }
    } else {
      // Razorpay Online Payment Flow
      let generatedOrderId = "";
      try {
        const res = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total }),
        });
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          setErrors({ form: data.error || "Failed to initialize payment gateway. Please try again or use COD." });
          setSubmitting(false);
          return;
        }

        generatedOrderId = data.orderId;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_pnbazaarKey123",
          amount: data.amount,
          currency: data.currency,
          name: "PN Bazaar",
          description: "Order Payment",
          image: "/logo.png",
          order_id: data.orderId,
          handler: async function (response: any) {
            // Secure Payment Verification
            try {
              const orderPayload = {
                items: session.cart,
                total: total,
                customerInfo: {
                  name: billingName,
                  email: billingEmail,
                  phone: billingPhone,
                  address: billingFull,
                  billingAddress: billingFull,
                  billingState,
                  billingCity,
                  billingPincode,
                  billingAddressLine1,
                  billingAddressLine2,
                  billingLandmark,
                  shippingName: shipName,
                  shippingAddress: shipFull,
                  shippingState: shipState,
                  shippingCity: sameAsBilling ? billingCity : shippingCity,
                  shippingPincode: shipPin,
                  shippingAddressLine1: sameAsBilling ? billingAddressLine1 : shippingAddressLine1,
                  shippingAddressLine2: sameAsBilling ? billingAddressLine2 : shippingAddressLine2,
                  shippingLandmark: sameAsBilling ? billingLandmark : shippingLandmark,
                  paymentMethod: "Online (Razorpay)",
                  giftWrap: giftWrap || undefined,
                  giftNote: giftNote.trim() || undefined,
                },
                appliedCoupon: session.discountCode || undefined,
                cashbackApplied: undefined,
                defaultOrdered: true
              };

              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderPayload
                })
              });
              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                // Clear cart locally
                localStorage.removeItem("pn_cart");
                localStorage.removeItem("checkout_" + sessionId);
                await fetch("/api/abandoned-checkouts?sessionId=" + encodeURIComponent(sessionId), { method: "DELETE" });
                router.push("/orders?success=true");
              } else {
                setErrors({ form: verifyData.error || "Payment verification failed. Please contact PN Bazaar support." });
                setSubmitting(false);
              }
            } catch (err: any) {
              console.error("Verification callback error: ", err);
              setErrors({ form: "An error occurred while validating payment." });
              setSubmitting(false);
            }
          },
          prefill: {
            name: billingName,
            email: billingEmail,
            contact: billingPhone,
          },
          notes: {
            address: billingFull,
            sessionId: sessionId,
          },
          theme: {
            color: "#121212",
          },
          modal: {
            ondismiss: async function() {
              setSubmitting(false);
              // Call payment cancellation fallback API
              await fetch("/api/razorpay/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId,
                  orderId: generatedOrderId,
                  reason: "Razorpay payment modal closed by customer"
                })
              }).catch(() => {});
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        console.error("Razorpay error: ", err);
        setErrors({ form: err.message || "An error occurred during Razorpay transaction initialization." });
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.emptyContainer}>
        <h1>Loading...</h1>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.emptyContainer}>
        <h1>Session Expired</h1>
        <p>Your checkout session could not be found. Please go back to your cart and try again.</p>
        <Link href="/cart" className={styles.backBtn}>Back to Cart</Link>
      </div>
    );
  }

  const giftWrapFee = giftWrap ? 35 : 0;
  const total = session.subtotal - session.totalDiscount + session.shippingFee + giftWrapFee;

  return (
    <div className={styles.container}>
      <Link href="/cart" className={styles.backLink}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Cart
      </Link>
      <div className={styles.header}>
        <h1 className={styles.title}>Checkout</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className={styles.layout}>
        {/* Left: Forms */}
        <div className={styles.formCol}>
          {/* Billing Address */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Billing Address</h2>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input type="text" value={billingName} onChange={e => setBillingName(e.target.value)} placeholder="John Doe" />
              {errors.billingName && <p className={styles.errorText}>{errors.billingName}</p>}
            </div>
            <div className={styles.formGroup}>
              <label>Email Address *</label>
              <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="john@example.com" />
              {errors.billingEmail && <p className={styles.errorText}>{errors.billingEmail}</p>}
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input type="tel" value={billingPhone} onChange={e => setBillingPhone(e.target.value)} placeholder="+91 98765 43210" />
              {errors.billingPhone && <p className={styles.errorText}>{errors.billingPhone}</p>}
            </div>
            <div className={styles.formGroup}>
              <label>Address Line 1 (Door No / House Name / Building) *</label>
              <input type="text" value={billingAddressLine1} onChange={e => setBillingAddressLine1(e.target.value)} placeholder="Flat 101, block A, Park Avenue" />
              {errors.billingAddress && <p className={styles.errorText}>{errors.billingAddress}</p>}
            </div>
            <div className={styles.formGroup}>
              <label>Address Line 2 (Road / Area / Colony)</label>
              <input type="text" value={billingAddressLine2} onChange={e => setBillingAddressLine2(e.target.value)} placeholder="Sector 4, Gandhi Nagar" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Landmark</label>
                <input type="text" value={billingLandmark} onChange={e => setBillingLandmark(e.target.value)} placeholder="Opposite City Mall" />
              </div>
              <div className={styles.formGroup}>
                <label>Pincode *</label>
                <input type="text" value={billingPincode} onChange={e => setBillingPincode(e.target.value)} placeholder="110001" />
                {errors.billingPincode && <p className={styles.errorText}>{errors.billingPincode}</p>}
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>State *</label>
                <select 
                  value={billingState} 
                  onChange={e => {
                    setBillingState(e.target.value);
                    setBillingCity("");
                  }}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-base)", fontSize: "13px", outline: "none", color: billingState ? "var(--text-main)" : "#9ca3af"
                  }}
                >
                  <option value="">Select State</option>
                  {Object.keys(STATES_AND_CITIES).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.billingState && <p className={styles.errorText}>{errors.billingState}</p>}
              </div>
              <div className={styles.formGroup}>
                <label>City *</label>
                <select 
                  value={billingCity} 
                  onChange={e => setBillingCity(e.target.value)}
                  disabled={!billingState}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-base)", fontSize: "13px", outline: "none", opacity: billingState ? 1 : 0.6,
                    color: billingCity ? "var(--text-main)" : "#9ca3af"
                  }}
                >
                  <option value="">Select City</option>
                  {billingState && STATES_AND_CITIES[billingState]?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.billingCity && <p className={styles.errorText}>{errors.billingCity}</p>}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Shipping Address</h2>
            <label className={styles.sameAsBilling}>
              <input type="checkbox" checked={sameAsBilling} onChange={e => setSameAsBilling(e.target.checked)} />
              Same as billing address
            </label>
            {!sameAsBilling && (
              <>
                <div className={styles.formGroup}>
                  <label>Full Name *</label>
                  <input type="text" value={shippingName} onChange={e => setShippingName(e.target.value)} placeholder="John Doe" />
                  {errors.shippingName && <p className={styles.errorText}>{errors.shippingName}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label>Address Line 1 (Door No / House Name / Building) *</label>
                  <input type="text" value={shippingAddressLine1} onChange={e => setShippingAddressLine1(e.target.value)} placeholder="Flat 101, block A, Park Avenue" />
                  {errors.shippingAddress && <p className={styles.errorText}>{errors.shippingAddress}</p>}
                </div>
                <div className={styles.formGroup}>
                  <label>Address Line 2 (Road / Area / Colony)</label>
                  <input type="text" value={shippingAddressLine2} onChange={e => setShippingAddressLine2(e.target.value)} placeholder="Sector 4, Gandhi Nagar" />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Landmark</label>
                    <input type="text" value={shippingLandmark} onChange={e => setShippingLandmark(e.target.value)} placeholder="Opposite City Mall" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Pincode *</label>
                    <input type="text" value={shippingPincode} onChange={e => setShippingPincode(e.target.value)} placeholder="400001" />
                    {errors.shippingPincode && <p className={styles.errorText}>{errors.shippingPincode}</p>}
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>State *</label>
                    <select 
                      value={shippingState} 
                      onChange={e => {
                        setShippingState(e.target.value);
                        setShippingCity("");
                      }}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-base)", fontSize: "13px", outline: "none", color: shippingState ? "var(--text-main)" : "#9ca3af"
                      }}
                    >
                      <option value="">Select State</option>
                      {Object.keys(STATES_AND_CITIES).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.shippingState && <p className={styles.errorText}>{errors.shippingState}</p>}
                  </div>
                  <div className={styles.formGroup}>
                    <label>City *</label>
                    <select 
                      value={shippingCity} 
                      onChange={e => setShippingCity(e.target.value)}
                      disabled={!shippingState}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
                        backgroundColor: "var(--bg-base)", fontSize: "13px", outline: "none", opacity: shippingState ? 1 : 0.6,
                        color: shippingCity ? "var(--text-main)" : "#9ca3af"
                      }}
                    >
                      <option value="">Select City</option>
                      {shippingState && STATES_AND_CITIES[shippingState]?.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.shippingCity && <p className={styles.errorText}>{errors.shippingCity}</p>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Gift Wrap */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Gift Options</h2>
            <label className={styles.sameAsBilling} style={{ marginBottom: "12px" }}>
              <input type="checkbox" checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)} />
              This is a gift &mdash; wrap it for <strong>₹35</strong>
            </label>
            {giftWrap && (
              <div className={styles.formGroup}>
                <label>Gift Note (optional)</label>
                <textarea
                  value={giftNote}
                  onChange={e => setGiftNote(e.target.value)}
                  placeholder="Write a short message for the recipient..."
                  rows={2}
                  maxLength={200}
                />
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>{giftNote.length}/200</p>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Payment Method</h2>
            
            <div className={styles.paymentOption} style={{
              borderColor: paymentMethod === "COD" ? "var(--primary)" : "var(--border-color)",
              borderWidth: paymentMethod === "COD" ? "2px" : "1px",
              borderStyle: "solid",
              boxShadow: paymentMethod === "COD" ? "var(--shadow-sm)" : "none",
              padding: "16px",
              borderRadius: "var(--radius-md)"
            }}>
              <input 
                type="radio" 
                name="payment" 
                id="cod" 
                checked={paymentMethod === "COD"} 
                onChange={() => setPaymentMethod("COD")} 
              />
              <div style={{ marginLeft: "8px" }}>
                <label htmlFor="cod" className={styles.paymentLabel}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", verticalAlign: "middle" }}><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="12" x2="12" y2="12.01"/><path d="M2 8h20"/></svg>
                  Cash on Delivery
                </label>
                <p className={styles.paymentDesc}>Pay with cash when your order is delivered</p>
              </div>
            </div>

            <div className={styles.paymentOption} style={{
              marginTop: "16px",
              borderColor: paymentMethod === "ONLINE" ? "var(--primary)" : "var(--border-color)",
              borderWidth: paymentMethod === "ONLINE" ? "2px" : "1px",
              borderStyle: "solid",
              boxShadow: paymentMethod === "ONLINE" ? "var(--shadow-sm)" : "none",
              padding: "16px",
              borderRadius: "var(--radius-md)"
            }}>
              <input 
                type="radio" 
                name="payment" 
                id="online" 
                checked={paymentMethod === "ONLINE"} 
                onChange={() => setPaymentMethod("ONLINE")} 
              />
              <div style={{ marginLeft: "8px", width: "100%" }}>
                <label htmlFor="online" className={styles.paymentLabel}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", verticalAlign: "middle" }}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/><path d="M5 15h2"/></svg>
                  Online Payment (UPI, Credit/Debit Card)
                </label>
                <p className={styles.paymentDesc} style={{ marginBottom: "8px" }}>Pay securely with Cards, UPI, or NetBanking using Razorpay</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "bold", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--primary-light)", color: "#111" }}>CARDS</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--primary-light)", color: "#007a87" }}>UPI</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--primary-light)", color: "#4285F4" }}>GPay</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--primary-light)", color: "#5f259f" }}>PhonePe</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--primary-light)", color: "#00b9f5" }}>Paytm</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--primary-light)", color: "#e36c09" }}>BHIM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            {session.cart.map((item, i) => (
              <div key={item.product?.id || i} className={styles.summaryItem}>
                {item.product?.image && (
                  <img src={item.product.image} alt={item.product.name} className={styles.summaryItemImg} />
                )}
                <div className={styles.summaryItemInfo}>
                  <div className={styles.summaryItemName}>{item.product?.name || "Product"}</div>
                  <div className={styles.summaryItemQty}>Qty: {item.quantity}</div>
                </div>
                <div className={styles.summaryItemPrice}>₹{((item.product?.price || 0) * item.quantity).toLocaleString("en-IN")}</div>
              </div>
            ))}

            <div className={styles.divider} />

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{session.subtotal.toLocaleString("en-IN")}</span>
            </div>

            {session.discountCode && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Coupon ({session.discountCode})</span>
                <span>-{session.discountPercentage}%</span>
              </div>
            )}

            {session.autoOfferDiscount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Auto Offer (10% OFF)</span>
                <span>-10%</span>
              </div>
            )}

            {session.totalDiscount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Total Discount</span>
                <span>-₹{session.totalDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span>Subtotal After Discount</span>
              <span>₹{(session.subtotal - session.totalDiscount).toLocaleString("en-IN")}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>₹{session.shippingFee.toLocaleString("en-IN")}</span>
            </div>

            {giftWrap && (
              <div className={styles.summaryRow}>
                <span>Gift Wrap</span>
                <span>₹35</span>
              </div>
            )}

            <div className={styles.divider} />

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span className={styles.grandTotal}>₹{total.toLocaleString("en-IN")}</span>
            </div>

            {errors.form && (
              <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px", textAlign: "center", fontWeight: 500 }}>{errors.form}</p>
            )}

            <button type="submit" className={styles.placeOrderBtn} disabled={submitting}>
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
