"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import styles from "./cart.module.css";

export default function CartClient() {
  const router = useRouter();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    discountPercentage,
    discountAmount,
    discountCode,
    applyDiscountCode,
    removeDiscountCode,
    autoOfferDiscount,
    createCheckoutSession,
    setCartDrawerOpen,
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [couponResult, setCouponResult] = useState<{ success: boolean; message: string } | null>(null);

  const subtotal = getCartTotal();
  const combinedPct = autoOfferDiscount + discountPercentage;
  const totalDiscountVal = (subtotal * combinedPct) / 100 + discountAmount;
  const discountedSubtotal = subtotal - totalDiscountVal;
  const total = discountedSubtotal;

  const handleProceedToCheckout = () => {
    setCartDrawerOpen(false);
    const sessionId = createCheckoutSession();
    if (sessionId) {
      router.push(`/checkout/${sessionId}`);
    }
  };

  if (cart.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyCartIconContainer}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.premiumCartIcon}
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <h1>Your Shopping Cart is Empty</h1>
        <p>It looks like you haven&rsquo;t added any items to your cart yet. Explore our premium collections to get started.</p>
        <Link href="/" className={styles.backBtn}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.tag}>Review your order</span>
        <h1 className={styles.title}>Shopping Cart</h1>
      </header>

      <div className={styles.layout}>
        {/* Left: Cart Items */}
        <div className={styles.cartItemsCol}>
          {cart.map((item) => (
            <div key={item.product.id} className={styles.cartItem}>
              {/* Product Thumbnail */}
              <div className={styles.thumbnailWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.product.image} alt={item.product.name} className={styles.thumbnail} />
              </div>

              {/* Product details */}
              <div className={styles.itemInfo}>
                <Link href={`/product/${item.product.slug}`} className={styles.itemName}>
                  {item.product.name}
                </Link>
                <span className={styles.itemCategory}>{item.product.category.replace("-", " & ")}</span>
                <span className={styles.itemPrice}>₹{item.product.price.toLocaleString("en-IN")} each</span>
              </div>

              {/* Quantity Changer */}
              <div className={styles.quantityControls}>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className={styles.qtyBtn}
                >
                  -
                </button>
                <span className={styles.qtyVal}>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>

              {/* Total Price & Delete button */}
              <div className={styles.priceCol}>
                <span className={styles.totalItemPrice}>
                  ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                </span>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className={styles.deleteBtn}
                  aria-label="Remove Item"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary */}
        <aside className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {autoOfferDiscount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>10% OFF (Auto)</span>
                <span>-₹{((subtotal * autoOfferDiscount) / 100).toLocaleString("en-IN")}</span>
              </div>
            )}
            {discountCode && discountPercentage > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Coupon ({discountCode} — {discountPercentage}%)</span>
                <span>-₹{((subtotal * discountPercentage) / 100).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className={styles.divider}></div>

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Estimated Total</span>
              <span className={styles.grandTotal}>₹{total.toLocaleString("en-IN")}</span>
            </div>

            {autoOfferDiscount === 0 && (
              <p className={styles.freeShippingTip}>
                <strong>Add ₹{(529 - subtotal).toLocaleString("en-IN")}</strong> more to get <strong>10% OFF</strong>
              </p>
            )}

            {/* Coupon Code */}
            <div style={{ margin: "16px 0", padding: "12px", background: "#f9fafb", borderRadius: "6px", border: "1px solid #f0f0f0" }}>
              {discountCode ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#008060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#008060" }}>Discount {discountCode} applied!</span>
                  </div>
                  <button onClick={() => { removeDiscountCode(); setPromoInput(""); setCouponResult(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#9ca3af", lineHeight: 1 }} title="Remove coupon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="text" placeholder="Enter coupon code" value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setCouponResult(null); }} style={{ flex: 1, padding: "8px", fontSize: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", outline: "none" }} />
                    <button onClick={() => { if (!promoInput.trim()) return; const result = applyDiscountCode(promoInput); setCouponResult(result); }} style={{ background: "#008060", color: "#fff", border: "none", borderRadius: "4px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Apply</button>
                  </div>
                  {couponResult && !couponResult.success && (
                    <p style={{ fontSize: "11px", margin: "6px 0 0", color: "#ef4444", fontWeight: 500 }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      {couponResult.message}
                    </p>
                  )}
                </>
              )}
            </div>
            <button onClick={handleProceedToCheckout} className={styles.checkoutBtn}>
              Proceed to Checkout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
