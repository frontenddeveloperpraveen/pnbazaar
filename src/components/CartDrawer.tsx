"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import styles from "./CartDrawer.module.css";

export const CartDrawer: React.FC = () => {
  const router = useRouter();
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    discountCode,
    discountPercentage,
    applyDiscountCode,
    removeDiscountCode,
    autoOfferDiscount,
    createCheckoutSession,
    getFinalTotal
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartDrawerOpen(false);
      }
    };
    if (cartDrawerOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cartDrawerOpen, setCartDrawerOpen]);

  if (!cartDrawerOpen) return null;

  const subtotal = getCartTotal();
  
  // Offer Threshold (₹529 for 10% OFF)
  const offerThreshold = 529;
  const hasUnlockedOffer = subtotal >= offerThreshold;
  const amountToOffer = Math.max(0, offerThreshold - subtotal);
  const offerProgressPercentage = Math.min((subtotal / offerThreshold) * 100, 100);

  const combinedPct = autoOfferDiscount + discountPercentage;
  const totalDiscountVal = (subtotal * combinedPct) / 100;
  const finalTotal = getFinalTotal();

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const result = applyDiscountCode(promoInput);
    if (result.success) {
      setPromoSuccess(true);
      setPromoError("");
    } else {
      setPromoError(result.message);
      setPromoSuccess(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => setCartDrawerOpen(false)}>
      <div
        className={`${styles.drawer} ${cartDrawerOpen ? styles.open : ""}`}
        onClick={(e) => e.stopPropagation()}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="drawer-title" className={styles.title}>Your Cart</h2>
          <button
            className={styles.closeBtn}
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close cart drawer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {cart.length === 0 ? (
            <div className={styles.empty}>
              {/* Premium Cart SVG Icon */}
              <div className={styles.emptyIconContainer}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.premiumCartIcon}
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <p className={styles.emptyText}>Your cart is currently empty.</p>
              <button
                className={styles.shopBtn}
                onClick={() => setCartDrawerOpen(false)}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className={styles.cartContainer}>
              {/* Premium Free Shipping Progress Tracker */}
              <div className={styles.shippingTracker}>
                <div className={styles.shippingTrackerHeader}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.truckIcon}
                  >
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <span className={styles.shippingMessage}>
                    {hasUnlockedOffer ? (
                      <strong className={styles.unlockedText}>You have unlocked 10% OFF!</strong>
                    ) : (
                      <>
                        <strong>Add ₹{amountToOffer.toLocaleString("en-IN")}</strong> more to get <strong>10% OFF</strong>
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${offerProgressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Items List */}
              <div className={styles.itemsList}>
                {cart.map((item) => (
                  <div key={item.product.id} className={styles.item}>
                    <div className={styles.imgWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product.image || item.product.images?.[0]}
                        alt={item.product.name}
                        className={styles.image}
                      />
                    </div>
                    <div className={styles.info}>
                      <Link
                        href={`/product/${item.product.slug}`}
                        className={styles.name}
                        onClick={() => setCartDrawerOpen(false)}
                      >
                        {item.product.name}
                      </Link>
                      <span className={styles.category}>
                        {item.product.category.replace("-", " & ")}
                      </span>
                      <div className={styles.row}>
                        {/* Qty Selector */}
                        <div className={styles.qty}>
                          <button
                            onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className={styles.qtyBtn}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className={styles.qtyVal}>{item.quantity}</span>
                          <button
                            onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className={styles.qtyBtn}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className={styles.price}>
                          ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.product.id)}
                      aria-label={`Remove ${item.product.name}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className={styles.footer}>
            {discountCode ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#008060" }}>Discount {discountCode} applied!</span>
                <button
                  onClick={() => { removeDiscountCode(); setPromoInput(""); setPromoSuccess(false); setPromoError(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#9ca3af", lineHeight: 1 }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleApplyPromo} className={styles.promoForm}>
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className={styles.promoInput}
                  />
                  <button type="submit" className={styles.promoBtn}>
                    Apply
                  </button>
                </form>
                {promoError && <p className={styles.promoError}>{promoError}</p>}
              </>
            )}

            {/* Pricing Summary */}
            <div className={styles.summaryContainer}>
              <div className={styles.subtotalRow}>
                <span>Subtotal</span>
                <span className={styles.subtotalPrice}>
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              {autoOfferDiscount > 0 && (
                <div className={`${styles.subtotalRow} ${styles.discountRow}`}>
                  <span>10% OFF (Auto)</span>
                  <span>-₹{((subtotal * autoOfferDiscount) / 100).toLocaleString("en-IN")}</span>
                </div>
              )}
              {discountCode && discountPercentage > 0 && (
                <div className={`${styles.subtotalRow} ${styles.discountRow}`}>
                  <span>Coupon ({discountCode} — {discountPercentage}%)</span>
                  <span>-₹{((subtotal * discountPercentage) / 100).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className={`${styles.subtotalRow} ${styles.finalTotalRow}`}>
                <span>Total</span>
                <span className={styles.finalTotalPrice}>
                  ₹{finalTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <p className={styles.shippingTip}>
              Shipping calculated at checkout.
            </p>
            <div className={styles.actions}>
              <Link
                href="/cart"
                className={styles.cartLink}
                onClick={() => setCartDrawerOpen(false)}
              >
                View Shopping Cart
              </Link>
              <button
                className={styles.checkoutBtn}
                onClick={() => {
                  setCartDrawerOpen(false);
                  const sessionId = createCheckoutSession();
                  if (sessionId) router.push(`/checkout/${sessionId}`);
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
