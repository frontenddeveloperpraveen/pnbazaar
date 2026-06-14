"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Product } from "../data/db";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { getCartCount, setCartDrawerOpen, products } = useCart();
  const { user, logout, initialized } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const publishedProducts = products.filter((p) => p.status !== "draft");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const isCheckout = pathname.startsWith("/checkout/");

  // Sync search input with URL query param if present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Filter suggestions as query changes
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length >= 2) {
      const matches = publishedProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, products]);

  // Click outside listener for suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click outside listener for profile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click outside listener for categories dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close categories on route change
  useEffect(() => {
    setCategoriesOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCartDrawerOpen(true);
  };

  const selectSuggestion = (slug: string) => {
    setSearchQuery("");
    setShowSuggestions(false);
    router.push(`/product/${slug}`);
  };

  return (
    <>
      {/* Shopify-style Announcement Bar */}
      <div className={`${styles.announcementBar} ${isScrolled ? styles.announcementHidden : ""} ${isCheckout ? styles.checkoutHide : ""}`}>
        <p className={styles.announcementText}>
          Free shipping on orders
        </p>
      </div>

      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""} ${mobileMenuOpen ? styles.menuOpen : ""} ${isCheckout ? styles.checkoutHeader : ""}`}>
        <div className={styles.container}>
          {/* Hamburger Menu Toggle (Mobile) */}
          <button 
            className={`${styles.hamburger} ${isCheckout ? styles.checkoutHide : ""}`} 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.hamburgerIcon}>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.hamburgerIcon}>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>

          {/* Logo */}
          <Link href="/" className={styles.logo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PN Bazaar Logo" className={styles.logoImage} />
          </Link>

          {/* Navigation links */}
          <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navActive : ""}`}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <div className={styles.dropdown} ref={categoriesRef}>
              <span className={styles.navLink} onClick={() => setCategoriesOpen(!categoriesOpen)} style={{ cursor: "pointer" }}>
                Categories <span style={{ fontSize: "10px", marginLeft: "2px" }}>{categoriesOpen ? "▲" : "▼"}</span>
              </span>
              <div className={`${styles.dropdownContent} ${categoriesOpen ? styles.dropdownVisible : ""}`}>
                <Link href="/category/apparel-accessories" onClick={() => setCategoriesOpen(false)}>Apparel & Accessories</Link>
                <Link href="/category/home-office" onClick={() => setCategoriesOpen(false)}>Home & Office</Link>
                <Link href="/category/lifestyle-living" onClick={() => setCategoriesOpen(false)}>Lifestyle & Living</Link>
                <Link href="/category/wellness-care" onClick={() => setCategoriesOpen(false)}>Wellness & Care</Link>
              </div>
            </div>
            <Link href="/orders" className={styles.navLink}>My Orders</Link>
          </nav>

          {/* Search — hidden on product detail pages */}
          {!pathname.startsWith("/product/") && !isCheckout && (
          <div className={styles.searchContainer} ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className={styles.searchInput}
                id="header-search-input"
                autoComplete="off"
              />
              <button type="submit" className={styles.searchButton} aria-label="Search">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>

            {/* Instant Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={styles.suggestionsDropdown}>
                {suggestions.map((product) => (
                  <div
                    key={product.id}
                    className={styles.suggestionItem}
                    onClick={() => selectSuggestion(product.slug)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image || product.images?.[0]}
                      alt={product.name}
                      className={styles.suggestionImg}
                    />
                    <div className={styles.suggestionInfo}>
                      <span className={styles.suggestionName}>{product.name}</span>
                      <span className={styles.suggestionPrice}>₹{product.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Cart Trigger (desktop) */}
          <div className={`${styles.actions} ${isCheckout ? styles.checkoutHide : ""}`}>
            <div ref={profileRef} style={{ position: "relative" }}>
              {initialized && user ? (
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className={styles.profileBtn} aria-label="Profile">
                  <span className={styles.profileAvatar}>{user.name.charAt(0).toUpperCase()}</span>
                </button>
              ) : initialized && !user ? (
                <Link href="/orders" className={styles.profileBtn} aria-label="Sign in">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Link>
              ) : (
                <div style={{ width: 32, height: 32 }} />
              )}
              {showProfileMenu && user && (
                <div className={styles.profileDropdown}>
                  <div className={styles.profileDropdownHeader}>
                    <span className={styles.profileName}>{user.name}</span>
                    <span className={styles.profileEmail}>{user.email}</span>
                  </div>
                  <Link href="/orders" className={styles.profileDropdownItem} onClick={() => setShowProfileMenu(false)}>My Orders</Link>
                  <button onClick={() => { logout(); setShowProfileMenu(false); }} className={styles.profileDropdownItem} style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", width: "100%", textAlign: "left", fontSize: "13px", padding: "8px 14px" }}>Sign Out</button>
                </div>
              )}
            </div>
            <button onClick={handleCartClick} className={styles.cartBtn} aria-label="Shopping Cart">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.cartIcon}>
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {getCartCount() > 0 && (
                <span className={styles.cartBadge}>{getCartCount()}</span>
              )}
            </button>
          </div>

          {isCheckout && (
            <Link href="/cart" className={styles.checkoutCancel}>
              Cancel
            </Link>
          )}
        </div>
      </header>
    </>
  );
};
export default Header;
