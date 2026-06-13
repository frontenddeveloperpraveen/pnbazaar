"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Logo & About */}
          <div className={styles.col}>
            <Link href="/" className={styles.logo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="PN Bazaar Logo" className={styles.logoImage} />
            </Link>
            <p className={styles.desc}>
              Your destination for everyday essentials — backpacks, desk organizers, ceramics, and wellness accessories.
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Shop Categories</h4>
            <ul className={styles.list}>
              <li><Link href="/category/apparel-accessories" className={styles.link}>Apparel & Accessories</Link></li>
              <li><Link href="/category/home-office" className={styles.link}>Home & Office</Link></li>
              <li><Link href="/category/lifestyle-living" className={styles.link}>Lifestyle & Living</Link></li>
              <li><Link href="/category/wellness-care" className={styles.link}>Wellness & Care</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Customer Support</h4>
            <ul className={styles.list}>
              <li><Link href="/orders" className={styles.link}>Track Order</Link></li>
              <li><Link href="/policies/return-policy" className={styles.link}>Return Policy</Link></li>
              <li><Link href="/policies/terms-conditions" className={styles.link}>Terms & Conditions</Link></li>
              <li><Link href="/policies/privacy-policy" className={styles.link}>Privacy Policy</Link></li>
              <li><Link href="/policies/cookies-usage" className={styles.link}>Cookies Usage</Link></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Connect With Us</h4>
            <p className={styles.desc}>Subscribe to receive exclusive deals and product updates.</p>
            {status === "success" ? (
              <div className={styles.successMessage}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={styles.checkmarkSvg}>
                  <polyline points="20 6 9 17 4 12" className={styles.checkmarkPolyline} />
                </svg>
                <span>Joined!</span>
              </div>
            ) : (
              <form className={styles.newsletter} onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Your email address"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === "loading"}
                />
                <button type="submit" className={styles.button} disabled={status === "loading"}>
                  {status === "loading" ? "Joining..." : "Join"}
                </button>
              </form>
            )}
            {status === "error" && (
              <p style={{ color: "#ef4444", fontSize: "11px", marginTop: "8px", fontWeight: 500 }}>
                Failed to join. Please try again.
              </p>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            &copy; {new Date().getFullYear()} PN Bazaar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
