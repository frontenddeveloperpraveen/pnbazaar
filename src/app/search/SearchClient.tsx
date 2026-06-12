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
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setResults([]);
      return;
    }

    const filtered = publishedProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.longDescription.toLowerCase().includes(q)
    );
    setResults(filtered);
  }, [query, products]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.tag}>Search results</span>
        <h1 className={styles.title}>
          Showing results for <span className={styles.highlight}>&ldquo;{query}&rdquo;</span>
        </h1>
        <p className={styles.count}>
          Found {results.length} {results.length === 1 ? "product" : "products"}
        </p>
      </header>

      {results.length > 0 ? (
        <div className={styles.grid}>
          {results.map((product) => (
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
          <h2>No Products Found</h2>
          <p>We couldn&rsquo;t find anything matching your search. Try checking your spelling or use different keywords.</p>
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
