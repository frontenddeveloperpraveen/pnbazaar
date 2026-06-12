"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { CATEGORIES, type Product } from "../data/db";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import styles from "./page.module.css";
import { trackEvent } from "../lib/tracker";

export default function HomePageClient() {
  const { products } = useCart();
  const publishedProducts = products.filter((p) => p.status !== "draft");
  const featuredProducts = publishedProducts.filter((p) => p.isFeatured);
  const hotProducts = publishedProducts.filter((p) => p.isHot);

  // Group published products by category slug
  const byCategory = new Map<string, Product[]>();
  for (const p of publishedProducts) {
    const list = byCategory.get(p.category) || [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  useEffect(() => {
    trackEvent("pageview", "/");
  }, []);

  return (
    <div className={styles.home}>
      {/* Hero Banner Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <span className={styles.heroTag}>Everyday Essentials</span>
          <h1 className={styles.heroTitle}>
            Designed for Utility, <span className={styles.highlight}>Built to Last</span>
          </h1>
          <p className={styles.heroSub}>
            Discover our curated collection of hand-crafted backpacks, desk organizers, matte ceramics, and wellness accessories designed for your daily routine.
          </p>
          <div className={styles.heroActions}>
            <Link href="/category/apparel-accessories" className={styles.primaryBtn}>
              Apparel & Accessories
            </Link>
            <Link href="/category/home-office" className={styles.secondaryBtn}>
              Home & Office
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className={styles.badgesSection}>
        <div className={styles.badgesGrid}>
          <div className={styles.badgeCard}>
            <div className={styles.badgeIconContainer}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.premiumIcon}
              >
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div>
              <h4 className={styles.badgeName}>Free Shipping</h4>
              <p className={styles.badgeText}>On all orders above ₹4,000</p>
            </div>
          </div>
          <div className={styles.badgeCard}>
            <div className={styles.badgeIconContainer}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.premiumIcon}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h4 className={styles.badgeName}>30-Day Returns</h4>
              <p className={styles.badgeText}>Hassle-free easy refunds</p>
            </div>
          </div>
          <div className={styles.badgeCard}>
            <div className={styles.badgeIconContainer}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.premiumIcon}
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8a8.5 8.5 0 0 1-9 10Z"></path>
                <path d="M9 22v-4H5v-4H2v-4"></path>
              </svg>
            </div>
            <div>
              <h4 className={styles.badgeName}>Ethically Sourced</h4>
              <p className={styles.badgeText}>Renewable and organic materials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Shop by Collection</h2>
          <p className={styles.sectionDesc}>Explore our seasonal lines designed to simplify and elevate your routine.</p>
        </div>
        <div className={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/category/${cat.slug}`} className={styles.categoryCard}>
              <div className={styles.catImageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cat.image} alt={cat.name} className={styles.catImage} />
                <div className={styles.catOverlay}></div>
              </div>
              <div className={styles.catContent}>
                <h3 className={styles.catName}>{cat.name}</h3>
                <p className={styles.catDesc}>{cat.description}</p>
                <span className={styles.catLink}>Browse Collection &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Hot Deals Promo */}
      <section className={styles.promoBanner}>
        <div className={styles.promoContent}>
          <span className={styles.promoTag}>SEASONAL COLLECTION SPECIALS</span>
          <h2 className={styles.promoTitle}>Hand-Crafted Goods Up to 20% Off</h2>
          <p className={styles.promoDesc}>
            Upgrade your daily commute and workspace setup with our sustainable wool felt pads and canvas carry gear.
          </p>
          <Link href="/search?q=felt" className={styles.promoBtn}>
            Shop Workspace Essentials
          </Link>
        </div>
      </section>

      {/* Products by Category */}
      {CATEGORIES.filter(c => byCategory.has(c.slug)).map(cat => (
        <section key={cat.slug} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{cat.name}</h2>
            <p className={styles.sectionDesc}>{cat.description}</p>
          </div>
          <div className={styles.productsGrid}>
            {byCategory.get(cat.slug)!.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}

      {/* Featured Products */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Masterpieces</h2>
          <p className={styles.sectionDesc}>Explore our current season favorites and top-tier arrivals.</p>
        </div>
        <div className={styles.productsGrid}>
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Hot Products */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Trending & Hot Sellers</h2>
          <p className={styles.sectionDesc}>Items that are selling fast. Grab yours before they go out of stock.</p>
        </div>
        <div className={styles.productsGrid}>
          {hotProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
