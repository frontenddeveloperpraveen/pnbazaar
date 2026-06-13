"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "../data/db";
import { useCart } from "../context/CartContext";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const { cart, addToCart, createCheckoutSession, setCartDrawerOpen, clearCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, true);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) {
      const existingItem = cart.find((item) => item.product.id === product.id);
      if (existingItem && existingItem.quantity > 1) {
        setCartDrawerOpen(true);
      } else {
        addToCart(product, 1);
        setCartDrawerOpen(true);
      }
    } else {
      clearCart();
      addToCart(product, 1);
      const sessionId = createCheckoutSession();
      if (sessionId) router.push(`/checkout/${sessionId}`);
    }
  };

  return (
    <div className={styles.card}>
      <Link href={`/product/${product.slug}`} className={styles.link}>
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || product.images?.[0]}
            alt={product.name}
            className={styles.image}
            loading="lazy"
          />
          {product.isHot && <span className={styles.badge}>HOT</span>}
        </div>

        <div className={styles.content}>
          <span className={styles.category}>{product.category.replace("-", " & ")}</span>
          <h3 className={styles.title}>{product.name}</h3>

          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {"★".repeat(Math.floor(product.rating))}
              {"☆".repeat(5 - Math.floor(product.rating))}
            </div>
            <span className={styles.reviews}>({product.reviewsCount})</span>
          </div>

          {product.boughtText && (
            <div className={styles.boughtRow}>{product.boughtText}</div>
          )}

          <div className={styles.footerRow}>
            <div className={styles.priceContainer}>
              <span className={styles.price}>₹{product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice && (
                <span className={styles.originalPrice}>₹{product.originalPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>

          <div className={styles.btnRow}>
            <button onClick={handleAddToCart} className={styles.cartBtn} aria-label="Add to Cart">
              Add to Cart
            </button>
            <button onClick={handleBuyNow} className={styles.buyBtn} aria-label="Buy Now">
              Buy Now
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default ProductCard;
