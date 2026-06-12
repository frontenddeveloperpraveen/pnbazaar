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
  const [products, setProducts] = useState<Product[]>(rawProducts);
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<string>("default");

  useEffect(() => {
    let filtered = [...rawProducts];

    // Price Filter
    filtered = filtered.filter((p) => p.price <= priceRange);

    // Sort Filter
    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    setProducts(filtered);
  }, [priceRange, sortBy, slug, allProducts]);

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

      {/* Main Content (Filters + Products) */}
      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.filters}>
          <h3 className={styles.filterTitle}>Filter & Sort</h3>

          {/* Sort By */}
          <div className={styles.filterGroup}>
            <label className={styles.label}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.select}
              id="sort-select"
            >
              <option value="default">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Price Range Slider */}
          <div className={styles.filterGroup}>
            <div className={styles.sliderLabelRow}>
              <label className={styles.label}>Max Price</label>
              <span className={styles.priceVal}>₹{priceRange.toLocaleString("en-IN")}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className={styles.slider}
              id="price-range-slider"
            />
            <div className={styles.sliderLimits}>
              <span>₹1,000</span>
              <span>₹10,000</span>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className={styles.mainGrid}>
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
    </div>
  );
}
