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

interface SavedAddress {
  id: string;
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  state: string;
  city: string;
  pincode: string;
}

interface CheckoutClientProps {
  sessionId: string;
}

const STORAGE_KEY = "saved_addresses";

export default function CheckoutClient({ sessionId }: CheckoutClientProps) {
  const router = useRouter();
  const { setCartDrawerOpen, clearCart } = useCart();

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE" | "">("");
  const [step, setStep] = useState<"address" | "payment">("address");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

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
  const [ipLocation, setIpLocation] = useState<string>("");

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
  const formRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {},
  );
  const markTouched = (field: string) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  const [billingPincodeValid, setBillingPincodeValid] = useState<
    boolean | null
  >(null);
  const [shippingPincodeValid, setShippingPincodeValid] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const pincode = billingPincode.trim();
    if (pincode.length === 6) {
      setBillingPincodeValid(null);
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
            setBillingState(data[0].PostOffice[0].State);
            setBillingCity(data[0].PostOffice[0].District);
            setBillingPincodeValid(true);
          } else {
            setBillingState("");
            setBillingCity("");
            setBillingPincodeValid(false);
          }
        })
        .catch(() => {
          setBillingPincodeValid(null);
        });
    } else {
      setBillingState("");
      setBillingCity("");
      setBillingPincodeValid(null);
    }
  }, [billingPincode]);

  useEffect(() => {
    const pincode = shippingPincode.trim();
    if (pincode.length === 6) {
      setShippingPincodeValid(null);
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
            setShippingState(data[0].PostOffice[0].State);
            setShippingCity(data[0].PostOffice[0].District);
            setShippingPincodeValid(true);
          } else {
            setShippingState("");
            setShippingCity("");
            setShippingPincodeValid(false);
          }
        })
        .catch(() => {
          setShippingPincodeValid(null);
        });
    } else {
      setShippingState("");
      setShippingCity("");
      setShippingPincodeValid(null);
    }
  }, [shippingPincode]);

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

    const saved = loadAddresses();
    setSavedAddresses(saved);
    if (saved.length > 0) {
      setSelectedAddressId(saved[0].id);
      setStep("payment");
    }
    setLoading(false);
  }, [sessionId, router, setCartDrawerOpen]);

  useEffect(() => {
    const fetchIpLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            setLat(data.latitude);
            setLng(data.longitude);
            setIpLocation(`${data.city || ""}, ${data.region || ""}, ${data.country_name || ""} (IP: ${data.ip || ""})`);
          }
        }
      } catch (err) {
        console.error("IP Geolocation failed:", err);
      }
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          fetchIpLocation();
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      fetchIpLocation();
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
        items: session.cart.map((item) => ({
          productId: item.product?.id || item.product?._id,
          name: item.product?.title || item.product?.name,
          price: item.product?.price,
          quantity: item.quantity,
          image: item.product?.images?.[0],
        })),
        total: session.subtotal - session.totalDiscount + session.shippingFee,
        lat,
        lng,
        ipLocation,
      }),
    }).catch(() => {});
  }, [session, sessionId, lat, lng, ipLocation]);

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      fetch("/api/abandoned-checkouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: billingName,
          email: billingEmail,
          phone: billingPhone,
          formData: {
            billingName,
            billingEmail,
            billingPhone,
            billingAddressLine1,
            billingAddressLine2,
            billingLandmark,
            billingState,
            billingCity,
            billingPincode,
            shippingName,
            shippingAddressLine1,
            shippingAddressLine2,
            shippingLandmark,
            shippingState,
            shippingCity,
            shippingPincode,
            sameAsBilling,
            giftWrap,
            giftNote,
          },
        }),
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    session,
    sessionId,
    billingName,
    billingEmail,
    billingPhone,
    billingAddressLine1,
    billingAddressLine2,
    billingLandmark,
    billingState,
    billingCity,
    billingPincode,
    shippingName,
    shippingAddressLine1,
    shippingAddressLine2,
    shippingLandmark,
    shippingState,
    shippingCity,
    shippingPincode,
    sameAsBilling,
    giftWrap,
    giftNote,
  ]);

  useEffect(() => {
    if (!session) return;
    if (lat !== null || lng !== null || ipLocation) {
      fetch("/api/abandoned-checkouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          lat,
          lng,
          ipLocation,
        }),
      }).catch(() => {});
    }
  }, [lat, lng, ipLocation, session, sessionId]);

  const loadAddresses = (): SavedAddress[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveAddresses = (addresses: SavedAddress[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    setSavedAddresses(addresses);
  };

  const buildAddress = (
    line1: string,
    line2: string,
    landmark: string,
    city: string,
    state: string,
    pincode: string,
  ) => {
    return [
      line1,
      line2,
      landmark ? `Landmark: ${landmark}` : "",
      city,
      state,
      pincode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const validateAddress = () => {
    const errs: Record<string, string> = {};
    if (!billingName.trim()) errs.billingName = "Name is required";
    if (!billingEmail.trim()) errs.billingEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail))
      errs.billingEmail = "Invalid email";
    if (billingPhone && !/^\d{10}$/.test(billingPhone))
      errs.billingPhone = "Invalid phone number";
    if (!billingAddressLine1.trim())
      errs.billingAddress = "Address Line 1 is required";
    if (!billingState) errs.billingState = "State is required";
    if (!billingCity) errs.billingCity = "City is required";
    if (!billingPincode.trim()) errs.billingPincode = "Pincode is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateAbandonedCheckoutForm = async () => {
    try {
      await fetch("/api/abandoned-checkouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: billingName,
          email: billingEmail,
          phone: billingPhone,
          formData: {
            billingName,
            billingEmail,
            billingPhone,
            billingAddressLine1,
            billingAddressLine2,
            billingLandmark,
            billingState,
            billingCity,
            billingPincode,
            shippingName,
            shippingAddressLine1,
            shippingAddressLine2,
            shippingLandmark,
            shippingState,
            shippingCity,
            shippingPincode,
            sameAsBilling,
            giftWrap,
            giftNote,
          },
          lat,
          lng,
        }),
      });
    } catch (e) {
      console.error("Failed to update abandoned checkout", e);
    }
  };

  const handleSaveAddress = () => {
    if (!validateAddress()) return;
    const newAddr: SavedAddress = {
      id: editingAddressId || Date.now().toString(),
      name: billingName,
      email: billingEmail,
      phone: billingPhone,
      line1: billingAddressLine1,
      line2: billingAddressLine2,
      landmark: billingLandmark,
      state: billingState,
      city: billingCity,
      pincode: billingPincode,
    };
    let updated: SavedAddress[];
    if (editingAddressId) {
      updated = savedAddresses.map((a) =>
        a.id === editingAddressId ? newAddr : a,
      );
    } else {
      updated = [...savedAddresses, newAddr];
    }
    saveAddresses(updated);
    setSelectedAddressId(newAddr.id);
    setShowAddressForm(false);
    setEditingAddressId(null);
    updateAbandonedCheckoutForm();
    setStep("payment");
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find(a => a.id === id);
    if (addr) {
      setBillingName(addr.name);
      setBillingEmail(addr.email);
      setBillingPhone(addr.phone);
      setBillingAddressLine1(addr.line1);
      setBillingAddressLine2(addr.line2);
      setBillingLandmark(addr.landmark);
      setBillingState(addr.state);
      setBillingCity(addr.city);
      setBillingPincode(addr.pincode);
    }
    updateAbandonedCheckoutForm();
  };

  const handleEditAddress = (addr: SavedAddress) => {
    setBillingName(addr.name);
    setBillingEmail(addr.email);
    setBillingPhone(addr.phone);
    setBillingAddressLine1(addr.line1);
    setBillingAddressLine2(addr.line2);
    setBillingLandmark(addr.landmark);
    setBillingState(addr.state);
    setBillingCity(addr.city);
    setBillingPincode(addr.pincode);
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
    setErrors({});
    setStep("address");
    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddNewAddress = () => {
    clearAddressForm();
    setEditingAddressId(null);
    setShowAddressForm(true);
    setErrors({});
    setStep("address");
    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const clearAddressForm = () => {
    setBillingName("");
    setBillingEmail("");
    setBillingPhone("");
    setBillingAddressLine1("");
    setBillingAddressLine2("");
    setBillingLandmark("");
    setBillingState("");
    setBillingCity("");
    setBillingPincode("");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const addr = selectedAddress;
    const name = addr ? addr.name : billingName;
    const email = addr ? addr.email : billingEmail;
    const phone = addr ? addr.phone : billingPhone;
    const line1 = addr ? addr.line1 : billingAddressLine1;
    const line2 = addr ? addr.line2 : billingAddressLine2;
    const landmark = addr ? addr.landmark : billingLandmark;
    const state = addr ? addr.state : billingState;
    const city = addr ? addr.city : billingCity;
    const pincode = addr ? addr.pincode : billingPincode;

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.billingName = "Name is required";
    if (!email.trim()) errs.billingEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.billingEmail = "Invalid email";
    if (phone && !/^\d{10}$/.test(phone))
      errs.billingPhone = "Invalid phone number";
    if (!line1.trim())
      errs.billingAddress = "Address Line 1 is required";
    if (!state) errs.billingState = "State is required";
    if (!city) errs.billingCity = "City is required";
    if (!pincode.trim()) errs.billingPincode = "Pincode is required";
    if (!sameAsBilling) {
      if (!shippingName.trim()) errs.shippingName = "Name is required";
      if (!shippingAddressLine1.trim())
        errs.shippingAddress = "Address Line 1 is required";
      if (!shippingState) errs.shippingState = "State is required";
      if (!shippingCity) errs.shippingCity = "City is required";
      if (!shippingPincode.trim()) errs.shippingPincode = "Pincode is required";
    }
    if (!paymentMethod) {
      errs.paymentMethod = "Please select a payment method";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setErrors(prev => ({ ...prev, form: "Please fix the highlighted fields and try again." }));
      setTimeout(() => {
        const pEl = document.getElementById("payment-section-container");
        if (pEl) {
          pEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    const currentSession = session;
    if (!currentSession) return;
    setSubmitting(true);

    const billingFull = buildAddress(line1, line2, landmark, city, state, pincode);
    const shipName = sameAsBilling ? name : shippingName;
    const shipFull = sameAsBilling
      ? billingFull
      : buildAddress(shippingAddressLine1, shippingAddressLine2, shippingLandmark, shippingCity, shippingState, shippingPincode);
    const shipState = sameAsBilling ? state : shippingState;
    const shipPin = sameAsBilling ? pincode : shippingPincode;

    const customerInfo = {
      name, email, phone,
      address: billingFull,
      billingAddress: billingFull,
      billingState: state,
      billingCity: city,
      billingPincode: pincode,
      billingAddressLine1: line1,
      billingAddressLine2: line2,
      billingLandmark: landmark,
      shippingName: shipName,
      shippingAddress: shipFull,
      shippingState: shipState,
      shippingCity: sameAsBilling ? city : shippingCity,
      shippingPincode: shipPin,
      shippingAddressLine1: sameAsBilling ? line1 : shippingAddressLine1,
      shippingAddressLine2: sameAsBilling ? line2 : shippingAddressLine2,
      shippingLandmark: sameAsBilling ? landmark : shippingLandmark,
      paymentMethod: paymentMethod === "ONLINE" ? "Online (Razorpay)" : "COD",
      lat,
      lng,
      ipLocation,
    };

    try {
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerInfo,
          items: currentSession.cart,
          total,
          paymentMethod,
          appliedCoupon: currentSession.discountCode || undefined,
          giftWrap: giftWrap || undefined,
          giftNote: giftNote.trim() || undefined,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.success) {
        setErrors({ form: checkoutData.error || "Failed to place order. Please try again." });
        setSubmitting(false);
        return;
      }

      const dbOrderId = checkoutData.order.id;

      if (paymentMethod === "COD") {
        try {
          clearCart();
          localStorage.removeItem("checkout_" + sessionId);
          await fetch("/api/abandoned-checkouts?sessionId=" + encodeURIComponent(sessionId), { method: "DELETE" });
        } catch {}
        router.push(`/payment/success?orderId=${dbOrderId}`);
        return;
      }

      const rzpOrderId = checkoutData.razorpay.orderId;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_pnbazaarKey123",
        amount: checkoutData.razorpay.amount,
        currency: checkoutData.razorpay.currency,
        name: "PN Bazaar",
        description: "Order Payment",
        image: "/logo.png",
        order_id: rzpOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: dbOrderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              clearCart();
              localStorage.removeItem("checkout_" + sessionId);
              await fetch("/api/abandoned-checkouts?sessionId=" + encodeURIComponent(sessionId), { method: "DELETE" });
              router.push(`/payment/success?orderId=${dbOrderId}`);
            } else {
              setErrors({ form: verifyData.error || "Payment verification failed. Please contact PN Bazaar support." });
              setSubmitting(false);
              router.push(`/payment/failure?orderId=${dbOrderId}`);
            }
          } catch (err: any) {
            setErrors({ form: "An error occurred while validating payment." });
            setSubmitting(false);
            router.push(`/payment/failure?orderId=${dbOrderId}`);
          }
        },
        prefill: {
          name: billingName,
          email: billingEmail,
          contact: billingPhone,
        },
        notes: { address: billingFull, sessionId },
        theme: { color: "#121212" },
        modal: {
          ondismiss: function () {
            // Instantly transition UI to failure without blocking/waiting
            setSubmitting(false);
            router.push(`/payment/failure?orderId=${dbOrderId}&cancelled=true`);
            // Fire cancel request asynchronously
            fetch("/api/razorpay/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: dbOrderId, reason: "Payment modal closed by customer" }),
            }).catch(() => {});
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Place order error:", err);
      setErrors({ form: err.message || "An error occurred. Please try again." });
      setSubmitting(false);
    }
  };

  const selectedAddress = savedAddresses.find(
    (a) => a.id === selectedAddressId,
  );

  // Shared form sections (avoid duplication between desktop/mobile)
  const sharedBillingFields = (
    <>
      <div className={styles.formGroup}>
        <label>Full Name *</label>
        <div className={styles.inputWithTick}>
          <input
            type="text"
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
            onBlur={() => markTouched("billingName")}
          />
          {!isDesktop &&
            touchedFields.billingName &&
            billingName.trim().length > 0 && (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
        </div>
        {errors.billingName && (
          <p className={styles.errorText}>{errors.billingName}</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label>Email Address *</label>
        <div className={styles.inputWithTick}>
          <input
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            onBlur={() => markTouched("billingEmail")}
          />
          {!isDesktop &&
            touchedFields.billingEmail &&
            billingEmail.trim().length > 0 &&
            (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail) ? (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            ) : (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            ))}
        </div>
        {errors.billingEmail && (
          <p className={styles.errorText}>{errors.billingEmail}</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label>Phone Number</label>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={billingPhone}
          onChange={(e) =>
            setBillingPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
        />
        {errors.billingPhone && (
          <p className={styles.errorText}>{errors.billingPhone}</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label>Address Line 1 (Door No / House Name / Building) *</label>
        <input
          type="text"
          value={billingAddressLine1}
          onChange={(e) => setBillingAddressLine1(e.target.value)}
        />
        {errors.billingAddress && (
          <p className={styles.errorText}>{errors.billingAddress}</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label>Address Line 2 (Road / Area / Colony)</label>
        <input
          type="text"
          value={billingAddressLine2}
          onChange={(e) => setBillingAddressLine2(e.target.value)}
        />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Landmark</label>
          <input
            type="text"
            value={billingLandmark}
            onChange={(e) => setBillingLandmark(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Pincode *</label>
          <div className={styles.inputWithTick}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={billingPincode}
              onChange={(e) =>
                setBillingPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            {!isDesktop && billingPincodeValid === true && (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
            {!isDesktop && billingPincodeValid === false && (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            )}
          </div>
          {errors.billingPincode && (
            <p className={styles.errorText}>{errors.billingPincode}</p>
          )}
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>State *</label>
          <input
            type="text"
            value={billingState}
            onChange={(e) => setBillingState(e.target.value)}
          />
          {errors.billingState && (
            <p className={styles.errorText}>{errors.billingState}</p>
          )}
        </div>
        <div className={styles.formGroup}>
          <label>District *</label>
          <input
            type="text"
            value={billingCity}
            onChange={(e) => setBillingCity(e.target.value)}
          />
          {errors.billingCity && (
            <p className={styles.errorText}>{errors.billingCity}</p>
          )}
        </div>
      </div>
    </>
  );

  const sharedShippingFields = (
    <>
      <div className={styles.formGroup}>
        <label>Full Name *</label>
        <div className={styles.inputWithTick}>
          <input
            type="text"
            value={shippingName}
            onChange={(e) => setShippingName(e.target.value)}
            onBlur={() => markTouched("shippingName")}
          />
          {!isDesktop &&
            touchedFields.shippingName &&
            shippingName.trim().length > 0 && (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
        </div>
        {errors.shippingName && (
          <p className={styles.errorText}>{errors.shippingName}</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label>Address Line 1 *</label>
        <input
          type="text"
          value={shippingAddressLine1}
          onChange={(e) => setShippingAddressLine1(e.target.value)}
        />
        {errors.shippingAddress && (
          <p className={styles.errorText}>{errors.shippingAddress}</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label>Address Line 2</label>
        <input
          type="text"
          value={shippingAddressLine2}
          onChange={(e) => setShippingAddressLine2(e.target.value)}
        />
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Landmark</label>
          <input
            type="text"
            value={shippingLandmark}
            onChange={(e) => setShippingLandmark(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Pincode *</label>
          <div className={styles.inputWithTick}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={shippingPincode}
              onChange={(e) =>
                setShippingPincode(
                  e.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
            />
            {!isDesktop && shippingPincodeValid === true && (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
            {!isDesktop && shippingPincodeValid === false && (
              <span className={styles.tickInside}>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            )}
          </div>
          {errors.shippingPincode && (
            <p className={styles.errorText}>{errors.shippingPincode}</p>
          )}
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>State *</label>
          <input
            type="text"
            value={shippingState}
            onChange={(e) => setShippingState(e.target.value)}
          />
          {errors.shippingState && (
            <p className={styles.errorText}>{errors.shippingState}</p>
          )}
        </div>
        <div className={styles.formGroup}>
          <label>District *</label>
          <input
            type="text"
            value={shippingCity}
            onChange={(e) => setShippingCity(e.target.value)}
          />
          {errors.shippingCity && (
            <p className={styles.errorText}>{errors.shippingCity}</p>
          )}
        </div>
      </div>
    </>
  );

  const sharedGiftWrapSection = (
    <div className={styles.sectionCard}>
      <h2 className={styles.sectionTitle}>Gift Options</h2>
      <label className={styles.sameAsBilling} style={{ marginBottom: "12px" }}>
        <input
          type="checkbox"
          checked={giftWrap}
          onChange={(e) => setGiftWrap(e.target.checked)}
        />
        This is a gift &mdash; wrap it for <strong>₹35</strong>
      </label>
      {giftWrap && (
        <div className={styles.formGroup}>
          <label>Gift Note (optional)</label>
          <textarea
            value={giftNote}
            onChange={(e) => setGiftNote(e.target.value)}
            rows={2}
            maxLength={200}
          />
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "4px",
              textAlign: "right",
            }}
          >
            {giftNote.length}/200
          </p>
        </div>
      )}
    </div>
  );
  const sharedPaymentMethodSection = (
    <div className={styles.sectionCard} id="payment-section-container" style={{ border: errors.paymentMethod ? "2px solid #ef4444" : "1px solid var(--border-color)", transition: "all 0.2s" }}>
      <h2 className={styles.sectionTitle}>Payment Method</h2>
      {errors.paymentMethod && (
        <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>
          ⚠️ {errors.paymentMethod}
        </p>
      )}

      <div
        className={styles.paymentOption}
        onClick={() => setPaymentMethod("COD")}
        style={{
          borderColor:
            paymentMethod === "COD" ? "var(--primary)" : "var(--border-color)",
          borderWidth: paymentMethod === "COD" ? "1.5px" : "1px",
          borderStyle: "solid",
          boxShadow: paymentMethod === "COD" ? "var(--shadow-sm)" : "none",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <input
          type="radio"
          name="payment"
          id="cod"
          checked={paymentMethod === "COD"}
          onChange={() => setPaymentMethod("COD")}
          style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
        />
        <div style={{ marginLeft: "8px" }}>
          <label htmlFor="cod" className={styles.paymentLabel} style={{ cursor: "pointer", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "6px" }}
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="12" y1="12" x2="12" y2="12.01" />
              <path d="M2 8h20" />
            </svg>
            Cash on Delivery
          </label>
          <p className={styles.paymentDesc}>
            Pay with cash when your order is delivered
          </p>
        </div>
      </div>

      <div
        className={styles.paymentOption}
        onClick={() => setPaymentMethod("ONLINE")}
        style={{
          marginTop: "16px",
          borderColor:
            paymentMethod === "ONLINE"
              ? "var(--primary)"
              : "var(--border-color)",
          borderWidth: paymentMethod === "ONLINE" ? "1.5px" : "1px",
          borderStyle: "solid",
          boxShadow: paymentMethod === "ONLINE" ? "var(--shadow-sm)" : "none",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <input
          type="radio"
          name="payment"
          id="online"
          checked={paymentMethod === "ONLINE"}
          onChange={() => setPaymentMethod("ONLINE")}
          style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
        />
        <div style={{ marginLeft: "8px", width: "100%" }}>
          <label htmlFor="online" className={styles.paymentLabel} style={{ cursor: "pointer", display: "flex", alignItems: "center", WebkitTapHighlightColor: "transparent" }}>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "6px" }}
            >
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
              <path d="M5 15h2" />
            </svg>
            Online Payment (UPI, Cards, NetBanking)
          </label>
          <p className={styles.paymentDesc} style={{ marginBottom: "8px" }}>
            Pay securely with Credit/Debit cards, NetBanking, or UPI
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginTop: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Payment Gateway icons (Visa, Mastercard, RuPay, UPI SVGs) */}
            <div style={{ display: "flex", gap: "6px" }}>
              <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ border: "1px solid #e5e7eb", borderRadius: "3px" }}>
                <rect width="32" height="20" rx="3" fill="#1A1F71"/>
                <path d="M12.3 6.1l-1.8 7.8h-1.5l1.8-7.8h1.5zm6.5 0c-.3-.9-1.2-1.2-2.3-1.2h-3.1l-.3 1.3h1.2c.7 0 1.2.2 1.4.5.2.3.1.8-.1 1.4l-.8 3.8h-1.5l.8-3.8c.2-.9-.1-1.3-.8-1.3h-1.2l-.8 3.8h-1.5l1.8-7.8h1.5l-.5 2.2c.4-.7 1.1-.9 1.9-.9.8 0 1.5.3 1.8.8.4.5.3 1.2.1 2.1l-.8 3.8h-1.5l.8-3.8c.2-.9-.1-1.3-.8-1.3h-.2l-.6 2.9" fill="white"/>
              </svg>
              <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ border: "1px solid #e5e7eb", borderRadius: "3px" }}>
                <rect width="32" height="20" rx="3" fill="#222"/>
                <circle cx="12" cy="10" r="6" fill="#EB001B" opacity="0.9"/>
                <circle cx="20" cy="10" r="6" fill="#F79E1B" opacity="0.9"/>
              </svg>
            </div>
            <span style={{ fontSize: "9px", letterSpacing: "0.5px", fontWeight: "bold", border: "1px solid #007a87", padding: "1px 5px", borderRadius: "3px", color: "#007a87", backgroundColor: "#eefbfc", whiteSpace: "nowrap" }}>
              BHIM UPI
            </span>
            <span style={{ fontSize: "9px", letterSpacing: "0.5px", fontWeight: "bold", border: "1px solid #1a1f71", padding: "1px 5px", borderRadius: "3px", color: "#1a1f71", backgroundColor: "#f0f2fa", whiteSpace: "nowrap" }}>
              CARDS
            </span>
            <span style={{ fontSize: "9px", letterSpacing: "0.5px", fontWeight: "bold", border: "1px solid #5f259f", padding: "1px 5px", borderRadius: "3px", color: "#5f259f", backgroundColor: "#f8f3fc", whiteSpace: "nowrap" }}>
              NETBANKING
            </span>
          </div>
          <p
            style={{
              marginTop: "10px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#16a34a",
            }}
          >
            Pay online &amp; get 5% instant discount
          </p>
        </div>
      </div>
    </div>
  );

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
        <p>
          Your checkout session could not be found. Please go back to your cart
          and try again.
        </p>
        <Link href="/cart" className={styles.backBtn}>
          Back to Cart
        </Link>
      </div>
    );
  }

  const giftWrapFee = giftWrap ? 35 : 0;
  const onlineDiscount = paymentMethod === "ONLINE" ? Math.round(session.subtotal * 0.05) : 0;
  const total =
    session.subtotal -
    session.totalDiscount -
    onlineDiscount +
    session.shippingFee +
    giftWrapFee;

  return (
    <div
      className={`${styles.container} ${step === "payment" ? styles.stepPayment : styles.stepAddress}`}
    >
      {/* Step Indicator */}
      {!isDesktop && (
        <div className={styles.steps}>
          <div
            className={`${styles.step} ${step === "address" ? styles.stepActive : ""}`}
          >
            <span className={styles.stepNum}>1</span>
            <span>Address</span>
          </div>
          <div className={styles.stepLine} />
          <div
            className={`${styles.step} ${step === "payment" ? styles.stepActive : ""}`}
          >
            <span className={styles.stepNum}>2</span>
            <span>Payment</span>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className={styles.layout}>
        {/* Left: Forms */}
        <div className={styles.formCol}>
          {isDesktop ? (
            <>
              {/* Delivery Address (editable form) */}
              <div ref={formRef}>
                <div className={styles.sectionCard}>
                  <h2 className={styles.sectionTitle}>Delivery Address</h2>
                  {sharedBillingFields}
                </div>
                <div className={styles.sectionCard}>
                  <h2 className={styles.sectionTitle}>Shipping Address</h2>
                  <label className={styles.sameAsBilling}>
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                    />
                    Same as billing address
                  </label>
                  {!sameAsBilling && sharedShippingFields}
                </div>
              </div>
              {sharedGiftWrapSection}
              {sharedPaymentMethodSection}
            </>
          ) : (
            <>
              {step === "payment" && (
                <>
                  <div className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>Deliver To</h2>
                    {selectedAddress && (
                      <div className={styles.savedAddressCard}>
                        <div className={styles.savedAddrInfo}>
                          <strong>{selectedAddress.name}</strong>
                          <p>
                            {buildAddress(
                              selectedAddress.line1,
                              selectedAddress.line2,
                              selectedAddress.landmark,
                              selectedAddress.city,
                              selectedAddress.state,
                              selectedAddress.pincode,
                            )}
                          </p>
                          <p>
                            {selectedAddress.email}{" "}
                            {selectedAddress.phone
                              ? `• ${selectedAddress.phone}`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={styles.editAddrBtn}
                          onClick={() => handleEditAddress(selectedAddress)}
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    {savedAddresses.length > 1 && (
                      <div className={styles.savedAddressesList}>
                        <p className={styles.otherAddrLabel}>Other Addresses</p>
                        {savedAddresses
                          .filter((a) => a.id !== selectedAddressId)
                          .map((addr) => (
                            <div
                              key={addr.id}
                              className={`${styles.savedAddressCard} ${styles.savedAddressCompact}`}
                            >
                              <div className={styles.savedAddrInfo}>
                                <strong>{addr.name}</strong>
                                <p>
                                  {buildAddress(
                                    addr.line1,
                                    addr.line2,
                                    addr.landmark,
                                    addr.city,
                                    addr.state,
                                    addr.pincode,
                                  )}
                                </p>
                              </div>
                              <div className={styles.addrActions}>
                                <button
                                  type="button"
                                  className={styles.deliverBtn}
                                  onClick={() => handleSelectAddress(addr.id)}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  Deliver to this address
                                </button>
                                <button
                                  type="button"
                                  className={styles.editAddrBtn}
                                  onClick={() => handleEditAddress(addr)}
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.addNewAddrBtn}
                      onClick={handleAddNewAddress}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add new address
                    </button>
                  </div>
                  {sharedGiftWrapSection}
                  {sharedPaymentMethodSection}
                </>
              )}

              {(step === "address" || showAddressForm) && (
                <div ref={formRef}>
                  <div className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>
                      {editingAddressId
                        ? "Edit Address"
                        : "Add Delivery Address"}
                    </h2>
                    {sharedBillingFields}
                  </div>
                  <div className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>Shipping Address</h2>
                    <label className={styles.sameAsBilling}>
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                      />
                      Same as billing address
                    </label>
                    {!sameAsBilling && sharedShippingFields}
                  </div>
                </div>
              )}
              {(step === "address" || showAddressForm) && (
                <button
                  type="button"
                  className={styles.continueBtn}
                  onClick={handleSaveAddress}
                >
                  {editingAddressId
                    ? "Update Address"
                    : savedAddresses.length > 0
                      ? "Save & Go to Payment"
                      : "Continue to Payment"}
                </button>
              )}
            </>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryItems}>
              {session.cart.map((item, i) => (
                <div key={item.product?.id || i} className={styles.summaryItem}>
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className={styles.summaryItemImg}
                    />
                  )}
                  <div className={styles.summaryItemInfo}>
                    <div className={styles.summaryItemName}>
                      {item.product?.name || "Product"}
                    </div>
                    <div className={styles.summaryItemQty}>
                      Qty: {item.quantity}
                    </div>
                  </div>
                  <div className={styles.summaryItemPrice}>
                    ₹
                    {(
                      (item.product?.price || 0) * item.quantity
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summaryFooter}>
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

              {onlineDiscount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span>Online Payment Discount (5%)</span>
                  <span>-₹{onlineDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}

              {(session.totalDiscount > 0 || onlineDiscount > 0) && (
                <div className={styles.summaryRow}>
                  <span>Subtotal After Discount</span>
                  <span>
                    ₹
                    {(session.subtotal - session.totalDiscount - onlineDiscount).toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>{session.shippingFee === 0 ? "Free" : `₹${session.shippingFee.toLocaleString("en-IN")}`}</span>
              </div>

              {giftWrap && (
                <div className={styles.summaryRow}>
                  <span>Gift Wrap</span>
                  <span>₹35</span>
                </div>
              )}

              <div className={styles.totalBox}>
                <span>Total</span>
                <span className={styles.grandTotal}>
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {errors.form && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "12px",
                    marginTop: "8px",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {errors.form}
                </p>
              )}

              <button
                type="submit"
                className={styles.placeOrderBtn}
                disabled={submitting}
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
