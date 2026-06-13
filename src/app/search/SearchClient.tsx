"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "../../data/db";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";
import styles from "./search.module.css";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { products } = useCart();
  const publishedProducts = products.filter((p) => p.status !== "draft");
  
  const [rawResults, setRawResults] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>("default");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setRawResults([]);
      return;
    }

    const filtered = publishedProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.longDescription.toLowerCase().includes(q)
    );
    setRawResults(filtered);

    const maxVal = filtered.length > 0 ? Math.max(...filtered.map((p) => p.price)) : 10000;
    setMaxPrice(maxVal);
    setMinPrice(0);
  }, [query, products]);

  useEffect(() => {
    let filtered = [...rawResults];

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

    setFilteredResults(filtered);
  }, [minPrice, maxPrice, sortBy, rawResults]);

  const maxProductPrice = rawResults.length > 0 ? Math.max(...rawResults.map((p) => p.price)) : 10000;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.tag}>Search results</span>
        <h1 className={styles.title}>
          Showing results for <span className={styles.highlight}>&ldquo;{query}&rdquo;</span>
        </h1>
        <p className={styles.count}>
          Found {filteredResults.length} {filteredResults.length === 1 ? "product" : "products"} {rawResults.length > filteredResults.length && `(filtered from ${rawResults.length})`}
        </p>
      </header>

      {rawResults.length > 0 && (
        <>
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
        </>
      )}

      {filteredResults.length > 0 ? (
        <div className={styles.grid}>
          {filteredResults.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
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
              className={styles.premiumSearchIcon}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h2>{rawResults.length > 0 ? "No Filters Match" : "No Products Found"}</h2>
          <p>
            {rawResults.length > 0 
              ? "We couldn't find any products in your search matches that fit this price range or sort criteria." 
              : "We couldn't find anything matching your search. Try checking your spelling or use different keywords."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchClient() {
  return (
    <Suspense fallback={<div className={styles.loadingContainer}>Loading Search Results...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
