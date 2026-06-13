"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES, Product } from "../../../data/db";
import ProductCard from "../../../components/ProductCard";
import { useCart } from "../../../context/CartContext";
import styles from "./category.module.css";

interface CategoryClientProps {
  slug: string;
}

export default function CategoryClient({ slug }: CategoryClientProps) {
  const { products: allProducts } = useCart();
  const category = CATEGORIES.find((c) => c.slug === slug);
  const rawProducts = allProducts.filter((p) => p.category === slug && p.status !== "draft");

  // Filtering states
  const maxProductPrice = rawProducts.length > 0 ? Math.max(...rawProducts.map((p) => p.price)) : 10000;
  const [products, setProducts] = useState<Product[]>(rawProducts);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(maxProductPrice);
  const [sortBy, setSortBy] = useState<string>("default");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    let filtered = [...rawProducts];

    // Price Filter
    filtered = filtered.filter((p) => p.price >= minPrice && p.price <= maxPrice);

    // Sort Filter
    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    setProducts(filtered);
  }, [minPrice, maxPrice, sortBy, slug, allProducts, rawProducts]);

  if (!category) {
    return (
      <div className={styles.notFound}>
        <h2>Category Not Found</h2>
        <p>The collection you are looking for does not exist.</p>
        <Link href="/" className={styles.backBtn}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Category Banner */}
      <header className={styles.header}>
        <div className={styles.headerOverlay}></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={category.image} alt={category.name} className={styles.bannerImage} />
        <div className={styles.headerContent}>
          <span className={styles.collectionTag}>Bazaar Collection</span>
          <h1 className={styles.title}>{category.name}</h1>
          <p className={styles.desc}>{category.description}</p>
        </div>
      </header>

      {/* Top Filter Bar */}
      <div className={styles.topFilterBar}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className={`${styles.expandButton} ${isExpanded ? styles.expandActive : ""}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filter and Sort {isExpanded ? "▲" : "▼"}
        </button>
        
        <div className={styles.activeSummary}>
          <span>Price: ₹{minPrice.toLocaleString("en-IN")} - ₹{maxPrice.toLocaleString("en-IN")}</span>
          <span className={styles.divider}>|</span>
          <span>Sort: {sortBy === "default" ? "Featured" : sortBy === "price-low" ? "Price: Low to High" : sortBy === "price-high" ? "Price: High to Low" : "Top Rated"}</span>
        </div>
      </div>

      {/* Expanded top filter drawer */}
      {isExpanded && (
        <div className={styles.expandedPanel}>
          <div className={styles.filterGrid}>
            {/* Sort Column */}
            <div className={styles.filterCol}>
              <label className={styles.filterLabel}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Price Column */}
            <div className={styles.filterCol}>
              <label className={styles.filterLabel}>Price Range</label>
              <div className={styles.priceInputsRow}>
                <div className={styles.priceInputWrapper}>
                  <span className={styles.currencyPrefix}>₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice || 0}
                    onChange={(e) => setMinPrice(Math.max(0, Number(e.target.value)))}
                    className={styles.priceInput}
                  />
                </div>
                <span className={styles.rangeText}>to</span>
                <div className={styles.priceInputWrapper}>
                  <span className={styles.currencyPrefix}>₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice || 0}
                    onChange={(e) => setMaxPrice(Math.max(minPrice, Number(e.target.value)))}
                    className={styles.priceInput}
                  />
                </div>
              </div>
              <div style={{ marginTop: "12px" }}>
                <input
                  type="range"
                  min="0"
                  max={maxProductPrice}
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className={styles.rangeSlider}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  <span>₹0</span>
                  <span>Max: ₹{maxProductPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Actions Column */}
            <div className={styles.filterActionsCol}>
              <button 
                onClick={() => {
                  setMinPrice(0);
                  setMaxPrice(maxProductPrice);
                  setSortBy("default");
                }}
                className={styles.resetBtn}
              >
                Reset All
              </button>
              <button 
                onClick={() => setIsExpanded(false)}
                className={styles.applyBtn}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className={styles.productsSection}>
        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <h3>No products match these filters</h3>
            <p>Try broadening your price range or sorting option.</p>
          </div>
        )}
      </div>
    </div>
  );
}
