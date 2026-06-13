"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import ProductCard from "../../../components/ProductCard";
import styles from "./product.module.css";
import { trackEvent } from "../../../lib/tracker";

interface ProductDetailsClientProps {
  slug: string;
}

export default function ProductDetailsClient({
  slug,
}: ProductDetailsClientProps) {
  const router = useRouter();
  const {
    products,
    promoCodes,
    addToCart,
    createCheckoutSession,
    clearCart,
    setCartDrawerOpen,
  } = useCart();
  const publishedProducts = products.filter((p) => p.status !== "draft");
  const product = publishedProducts.find((p) => p.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState(0); // 0 = all
  const [faqs, setFaqs] = useState<any[]>([]);

  const imageCount = product?.images?.length ?? 0;

  useEffect(() => {
    if (product) {
      fetch(`/api/reviews?productId=${product.id}`)
        .then((r) => r.json())
        .then((data) => {
          setReviews(data);
          setReviewsLoading(false);
        })
        .catch(() => setReviewsLoading(false));
      fetch(`/api/faq?productId=${product.id}`)
        .then((r) => r.json())
        .then((data) => setFaqs(data))
        .catch(() => {});
    }
  }, [product]);

  // Collapsible Accordions State
  const [activeRow, setActiveRow] = useState<string | null>(null);

  const handleAddToCart = () => {
    addToCart(product!, quantity);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  const handleStickyAddToCart = () => {
    addToCart(product!, quantity, true);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product!, 1);
    setCartDrawerOpen(false);
    const sessionId = createCheckoutSession();
    if (sessionId) router.push(`/checkout/${sessionId}`);
  };

  const handleStickyBuyNow = () => {
    addToCart(product!, quantity, true);
    setCartDrawerOpen(true);
  };

  const toggleAccordion = (rowName: string) => {
    if (activeRow === rowName) {
      setActiveRow(null);
    } else {
      setActiveRow(rowName);
    }
    trackEvent(
      "click",
      window.location.pathname,
      `Toggle Accordion: ${rowName}`,
    );
  };

  const goToPrevImage = () =>
    setSelectedImageIndex((i) => (i - 1 + imageCount) % imageCount);
  const goToNextImage = () =>
    setSelectedImageIndex((i) => (i + 1) % imageCount);

  if (!product) {
    if (products.length === 0) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            fontSize: "16px",
            fontWeight: 600,
            color: "#6b7280",
          }}
        >
          Loading...
        </div>
      );
    }
    return (
      <div className={styles.notFound}>
        <h2>Product Not Found</h2>
        <p>The product you are looking for does not exist.</p>
        <Link href="/" className={styles.backBtn}>
          Back to Home
        </Link>
      </div>
    );
  }

  // Related products (same category, excluding current product)
  const relatedProducts = publishedProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link href="/">Home</Link> &gt;{" "}
        <Link href={`/category/${product.category}`}>
          {product.category.replace("-", " & ")}
        </Link>{" "}
        &gt; <span>{product.name}</span>
      </nav>

      {/* Main Grid Layout */}
      <div className={styles.productMain}>
        <div className={styles.mainGrid}>
          {/* Left: Product Image */}
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  imageCount > selectedImageIndex && product.images
                    ? product.images[selectedImageIndex]
                    : product.image
                }
                alt={product.name}
                className={styles.image}
              />
              {imageCount > 1 && (
                <>
                  <button onClick={goToPrevImage} className={styles.arrowBtn}>
                    <span className={styles.arrowIcon}>‹</span>
                  </button>
                  <button onClick={goToNextImage} className={styles.arrowBtn}>
                    <span className={styles.arrowIcon}>›</span>
                  </button>
                </>
              )}
              {product.isHot && (
                <span className={styles.hotBadge}>HOT SELLER</span>
              )}
            </div>
            {imageCount > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                {product.images!.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border:
                        idx === selectedImageIndex
                          ? "2px solid #008060"
                          : "2px solid #e5e7eb",
                      padding: 0,
                      background: "#f9fafb",
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Section */}
          <div className={styles.infoSection}>
            <span className={styles.categoryTag}>
              {product.category.replace("-", " & ")}
            </span>
            <h1 className={styles.title}>{product.name}</h1>

            {/* Rating */}
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {"★".repeat(Math.floor(product.rating))}
                {"☆".repeat(5 - Math.floor(product.rating))}
              </div>
              <span className={styles.ratingVal}>{product.rating}</span>
              <span className={styles.reviews}>
                ({product.reviewsCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className={styles.priceRow}>
              <span className={styles.price}>
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice && (
                <span className={styles.originalPrice}>
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Short description */}
            <p className={styles.shortDesc}>{product.description}</p>

            {product.boughtText && (
              <div className={styles.boughtText}>{product.boughtText}</div>
            )}

            <div className={styles.divider}></div>

            {product.size || product.material ? (
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                {product.size && (
                  <div className={styles.optionSection}>
                    <span className={styles.optionLabel}>Size</span>
                    <div className={styles.sizeSwatches}>
                      {product.size
                        .split(",")
                        .map((s) => s.trim())
                        .map((s) => (
                          <span
                            key={s}
                            className={`${styles.sizeSwatch} ${styles.activeSize}`}
                          >
                            {s}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
                {product.material && (
                  <div className={styles.optionSection}>
                    <span className={styles.optionLabel}>Material</span>
                    <div className={styles.sizeSwatches}>
                      {product.material
                        .split(",")
                        .map((m) => m.trim())
                        .map((m) => (
                          <span
                            key={m}
                            className={`${styles.sizeSwatch} ${styles.activeSize}`}
                          >
                            {m}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Actions: Quantity & Add to Cart */}
            <div className={styles.actionRow}>
              <div className={styles.quantitySelector}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={styles.qtyBtn}
                >
                  -
                </button>
                <span className={styles.qtyVal}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className={styles.qtyBtn}
                >
                  +
                </button>
              </div>

              <button onClick={handleAddToCart} className={styles.addBtn}>
                Add to Cart
              </button>
            </div>

            {/* Success Message Banner */}
            {addedMessage && (
              <div className={styles.successMessage}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.successCheckIcon}
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Added {quantity} item(s) to your shopping cart! </span>
                <Link href="/cart" className={styles.viewCartLink}>
                  View Cart &rarr;
                </Link>
              </div>
            )}

            {/* Policy & Trust Badges */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "10px",
              }}
            >
              {product.returnPolicy && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "14px",
                    paddingTop: "8px",
                    background: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#008060"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "#111827",
                    }}
                  >
                    {(() => {
                      switch (product.returnPolicy) {
                        case "7_days_return_only":
                          return "7 Days Return";
                        case "7_days_return_replacement":
                          return "7 Days Return & Replacement";
                        case "7_days_replacement_only":
                          return "7 Days Replacement";
                        case "no_return":
                          return "No Returns";
                        default:
                          return "7 Days Return & Replacement";
                      }
                    })()}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    Return Policy
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  padding: "14px",
                  paddingBottom: "8px",
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="#008060"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  {(() => {
                    switch (product.deliveryType) {
                      case "free":
                        return "Free Delivery";
                      case "custom":
                        return `Delivery ₹${product.deliveryFee}`;
                      case "cumulative":
                        return `Free above ₹${product.deliveryMinOrder}`;
                      default:
                        return "Free Delivery";
                    }
                  })()}
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  Shipping
                </span>
              </div>

              {(() => {
                const applicableOffers: { label: string; text: string }[] = [];
                if (
                  product.salePrice &&
                  Number(product.salePrice) < Number(product.price)
                ) {
                  applicableOffers.push({
                    label: "SAVE",
                    text: `Special price ₹${Number(product.salePrice).toLocaleString("en-IN")}`,
                  });
                }
                const now = Date.now();
                promoCodes
                  .filter((pc) => {
                    const matchesProduct =
                      !pc.validProducts?.length ||
                      pc.validProducts.includes(product.id);
                    const matchesCategory =
                      !pc.validCategories?.length ||
                      pc.validCategories.includes(product.category);
                    if (!matchesProduct && !matchesCategory) return false;
                    if (pc.startDate && new Date(pc.startDate).getTime() > now)
                      return false;
                    if (pc.endDate && new Date(pc.endDate).getTime() < now)
                      return false;
                    return true;
                  })
                  .forEach((pc) => {
                    if (pc.type === "flat")
                      applicableOffers.push({
                        label: pc.code,
                        text: `₹${pc.value} off`,
                      });
                    else if (pc.type === "percentage")
                      applicableOffers.push({
                        label: pc.code,
                        text: `${pc.value}% off`,
                      });
                    else if (pc.type === "cashback")
                      applicableOffers.push({
                        label: pc.code,
                        text: `₹${pc.value} cashback`,
                      });
                  });
                if (applicableOffers.length === 0) {
                  if (product.warrantyDetails) {
                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          padding: "14px",
                          background: "#fff",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="none"
                          stroke="#008060"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#111827",
                          }}
                        >
                          {product.warrantyDetails}
                        </span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          Warranty
                        </span>
                      </div>
                    );
                  }
                  return null;
                }
                return applicableOffers.map((offer, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      padding: "14px",
                      background: "#fffbeb",
                      borderRadius: "8px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          background: "#d97706",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {offer.label}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#111827",
                        }}
                      >
                        {offer.text}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Available offer
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Accordions */}
        <div className={styles.accordions}>
          {product.returnPolicy && product.deliveryType ? (
            <div className={styles.accordionRow}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion("shipping")}
              >
                <span className={styles.accordionTitle}>
                  Shipping & Returns
                </span>
                <span className={styles.accordionIcon}>
                  {activeRow === "shipping" ? "−" : "+"}
                </span>
              </button>
              <div
                className={`${styles.accordionBody} ${activeRow === "shipping" ? styles.activeBody : ""}`}
              >
                <p>
                  We offer standard ground shipping on all domestic orders.
                  Deliveries take 3-5 business days. Free shipping is
                  automatically applied at checkout for orders exceeding ₹4,000.
                </p>
                <p style={{ marginTop: "8px" }}>
                  Returns are accepted within 30 days of purchase in their
                  original, unused condition.
                </p>
              </div>
            </div>
          ) : null}

          {product.material || product.countryOfOrigin ? (
            <div className={styles.accordionRow}>
              <button
                className={styles.accordionHeader}
                onClick={() => toggleAccordion("materials")}
              >
                <span className={styles.accordionTitle}>Materials & Care</span>
                <span className={styles.accordionIcon}>
                  {activeRow === "materials" ? "−" : "+"}
                </span>
              </button>
              <div
                className={`${styles.accordionBody} ${activeRow === "materials" ? styles.activeBody : ""}`}
              >
                {product.material && (
                  <p>
                    <strong>Material:</strong> {product.material}
                  </p>
                )}
                {product.countryOfOrigin && (
                  <p style={{ marginTop: "8px" }}>
                    <strong>Country of Origin:</strong>{" "}
                    {product.countryOfOrigin}
                  </p>
                )}
                {product.netWeight && (
                  <p style={{ marginTop: "8px" }}>
                    <strong>Net Weight:</strong> {product.netWeight}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <section className={styles.tabsSection}>
        <div className={styles.tabs}>
          <div className={styles.tabActive}>Product Overview</div>
        </div>
        <div className={styles.tabContent}>
          <div className={styles.tabGrid}>
            <div className={styles.longDescSection}>
              <h3>Detailed Description</h3>
              <p>{product.longDescription}</p>
            </div>

            <div className={styles.specsSection}>
              <h3>Specifications</h3>
              <table className={styles.specsTable}>
                <tbody>
                  {Object.entries(product.specs).map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.specKey}>{key}</td>
                      <td className={styles.specVal}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {product.features?.length ? (
        <section className={styles.tabsSection}>
          <div className={styles.tabs}>
            <div className={styles.tabActive}>Features</div>
          </div>
          <ul
            style={{
              paddingLeft: "20px",
              lineHeight: 2,
              color: "var(--text-muted)",
              fontSize: "15px",
            }}
          >
            {product.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Compliance & Dimensions */}
      {(() => {
        const rows: [string, string][] = [];
        if (product.gst) rows.push(["GST", product.gst]);
        if (product.hsnCode) rows.push(["HSN Code", product.hsnCode]);
        if (product.skuId) rows.push(["SKU ID", product.skuId]);
        if (product.netWeight) rows.push(["Net Weight", product.netWeight]);
        if (product.netQuantity)
          rows.push(["Net Quantity", product.netQuantity]);
        if (product.includedComponents)
          rows.push(["Included Components", product.includedComponents]);
        if (product.countryOfOrigin)
          rows.push(["Country of Origin", product.countryOfOrigin]);
        if (product.voltage) rows.push(["Voltage", product.voltage]);
        if (product.wattage) rows.push(["Wattage", product.wattage]);
        if (product.manufacturerName)
          rows.push(["Manufacturer", product.manufacturerName]);
        if (product.manufacturerAddress)
          rows.push(["Manufacturer Address", product.manufacturerAddress]);
        if (product.manufacturerPincode)
          rows.push(["Manufacturer Pincode", product.manufacturerPincode]);
        if (product.packerName) rows.push(["Packer Name", product.packerName]);
        if (product.packerAddress)
          rows.push(["Packer Address", product.packerAddress]);
        if (product.packerPincode)
          rows.push(["Packer Pincode", product.packerPincode]);
        if (product.importerName)
          rows.push(["Importer Name", product.importerName]);
        if (product.importerAddress)
          rows.push(["Importer Address", product.importerAddress]);
        if (product.importerPincode)
          rows.push(["Importer Pincode", product.importerPincode]);
        // Packaging dimensions
        if (
          product.packagingBreadth ||
          product.packagingHeight ||
          product.packagingLength
        ) {
          rows.push([
            "Packaging Dimensions",
            `${product.packagingBreadth || "—"} x ${product.packagingHeight || "—"} x ${product.packagingLength || "—"} cm`,
          ]);
        }
        // Product dimensions
        if (
          product.productBreadth ||
          product.productHeight ||
          product.productLength
        ) {
          rows.push([
            "Product Dimensions",
            `${product.productBreadth || "—"} x ${product.productHeight || "—"} x ${product.productLength || "—"} ${product.productUnit || "cm"}`,
          ]);
        }
        if (product.productWeight)
          rows.push([
            "Product Weight",
            `${product.productWeight} ${product.productWeightUnit || "g"}`,
          ]);
        // Custom attributes
        if (product.customAttributes?.length) {
          product.customAttributes.forEach((a) => {
            if (a.key && a.value) rows.push([a.key, a.value]);
          });
        }
        if (rows.length === 0) return null;
        return (
          <section className={styles.tabsSection}>
            <div className={styles.tabs}>
              <div className={styles.tabActive}>Additional Details</div>
            </div>
            <table className={styles.specsTable} style={{ marginTop: "8px" }}>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td className={styles.specKey}>{k}</td>
                    <td className={styles.specVal}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })()}

      {/* Customer Reviews — Amazon Style */}
      <section className={styles.tabsSection}>
        <div className={styles.tabs}>
          <div className={styles.tabActive}>
            Customer Reviews ({reviews.length})
          </div>
        </div>

        {reviewsLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-muted)",
            }}
          >
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-muted)",
            }}
          >
            <p>No reviews yet for this product.</p>
          </div>
        ) : (
          (() => {
            const avgRating =
              reviews.reduce((s: number, r: any) => s + r.rating, 0) /
              reviews.length;
            const dist = [0, 0, 0, 0, 0];
            reviews.forEach((r: any) => {
              if (r.rating >= 1 && r.rating <= 5) dist[5 - r.rating]++;
            });
            const filtered =
              reviewFilter === 0
                ? reviews
                : reviews.filter((r: any) => r.rating === reviewFilter);

            return (
              <>
                {/* Overall Rating Summary */}
                <div
                  style={{
                    display: "flex",
                    gap: "32px",
                    padding: "24px 0",
                    borderBottom: "1px solid #e5e7eb",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Left: Big rating number + stars */}
                  <div style={{ textAlign: "center", minWidth: "140px" }}>
                    <div
                      style={{
                        fontSize: "48px",
                        fontWeight: 700,
                        color: "#111827",
                        lineHeight: 1,
                      }}
                    >
                      {avgRating.toFixed(1)}
                    </div>
                    <div
                      style={{
                        color: "#f59e0b",
                        fontSize: "20px",
                        margin: "4px 0 2px",
                        letterSpacing: "2px",
                      }}
                    >
                      {"★".repeat(Math.round(avgRating))}
                      {"☆".repeat(5 - Math.round(avgRating))}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Right: Distribution bars */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      justifyContent: "center",
                    }}
                  >
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = dist[5 - star];
                      const pct =
                        reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <button
                          key={star}
                          onClick={() =>
                            setReviewFilter(reviewFilter === star ? 0 : star)
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            padding: "2px 0",
                            fontFamily: "inherit",
                            opacity:
                              reviewFilter === 0 || reviewFilter === star
                                ? 1
                                : 0.5,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#374151",
                              whiteSpace: "nowrap",
                              minWidth: "30px",
                            }}
                          >
                            {star}★
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: "14px",
                              background: "#e5e7eb",
                              borderRadius: "10px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: "#f59e0b",
                                borderRadius: "10px",
                                transition: "width 0.3s",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              minWidth: "24px",
                              textAlign: "right",
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Chips */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    padding: "16px 0 8px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => setReviewFilter(0)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "100px",
                      border:
                        reviewFilter === 0
                          ? "2px solid #f59e0b"
                          : "1px solid #d1d5db",
                      background: reviewFilter === 0 ? "#fef3c7" : "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "#374151",
                    }}
                  >
                    All Reviews
                  </button>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setReviewFilter(reviewFilter === star ? 0 : star)
                      }
                      style={{
                        padding: "6px 14px",
                        borderRadius: "100px",
                        border:
                          reviewFilter === star
                            ? "2px solid #f59e0b"
                            : "1px solid #d1d5db",
                        background: reviewFilter === star ? "#fef3c7" : "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        color: "#374151",
                      }}
                    >
                      {star}★ {dist[5 - star]}
                    </button>
                  ))}
                </div>

                {/* Review Cards */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    padding: "12px 0",
                  }}
                >
                  {filtered.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        color: "var(--text-muted)",
                      }}
                    >
                      No reviews match this filter.
                    </div>
                  ) : (
                    filtered.map((r: any) => (
                      <div
                        key={r._id}
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          padding: "16px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "6px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#008060",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {r.customerName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "14px",
                                color: "#111827",
                              }}
                            >
                              {r.customerName}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  color: "#f59e0b",
                                  fontSize: "14px",
                                  letterSpacing: "1px",
                                }}
                              >
                                {"★".repeat(r.rating)}
                                {"☆".repeat(5 - r.rating)}
                              </span>
                              <span
                                style={{ fontSize: "11px", color: "#9ca3af" }}
                              >
                                {r.date
                                  ? new Date(r.date).toLocaleDateString(
                                      "en-IN",
                                      {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      },
                                    )
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        {r.title && (
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "14px",
                              marginBottom: "4px",
                              color: "#111827",
                            }}
                          >
                            {r.title}
                          </div>
                        )}
                        {r.review && (
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#374151",
                              lineHeight: 1.6,
                              margin: 0,
                            }}
                          >
                            {r.review}
                          </p>
                        )}
                        {r.mediaUrl && (
                          <div style={{ marginTop: "10px" }}>
                            {r.mediaType === "video" ? (
                              <video
                                src={r.mediaUrl}
                                controls
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "240px",
                                  borderRadius: "8px",
                                }}
                              />
                            ) : (
                              <img
                                src={r.mediaUrl}
                                alt="Review media"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "240px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()
        )}
      </section>

      {/* FAQ Section — only if FAQs exist */}
      {faqs.length > 0 && (
        <section className={styles.tabsSection}>
          <div className={styles.tabs}>
            <div className={styles.tabActive}>Frequently Asked Questions</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {faqs.map((f: any) => (
              <div
                key={f._id}
                style={{ borderBottom: "1px solid #f0f0f0", padding: "16px 0" }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "#111827",
                    marginBottom: "6px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "#008060", flexShrink: 0 }}>Q:</span>
                  <span>{f.question}</span>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    lineHeight: 1.6,
                    paddingLeft: "24px",
                  }}
                >
                  {f.answer}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className={styles.related}>
          <h2 className={styles.relatedTitle}>You May Also Like</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Bottom Bar */}
      <div className={styles.mobileStickyBar}>
        <div className={styles.stickyQuantity}>
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className={styles.stickyQtyBtn}
          >
            −
          </button>
          <span className={styles.stickyQtyVal}>{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className={styles.stickyQtyBtn}
          >
            +
          </button>
        </div>
        <button onClick={handleStickyAddToCart} className={styles.stickyCartBtn}>
                   Add to Cart
                    </button>
        <button onClick={handleStickyBuyNow} className={styles.stickyBuyBtn}>
                    Buy Now
        </button>
      </div>
    </div>
  );
}
