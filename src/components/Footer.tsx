"use client";

import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";

export const Footer: React.FC = () => {
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
              <li><a href="#" className={styles.link}>Track Order</a></li>
              <li><a href="#" className={styles.link}>Easy Returns</a></li>
              <li><Link href="/admin" className={styles.link}>Admin Portal</Link></li>
              <li><a href="#" className={styles.link}>FAQs</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Connect With Us</h4>
            <p className={styles.desc}>Subscribe to receive exclusive deals and product updates.</p>
            <form className={styles.newsletter} onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email address" className={styles.input} required />
              <button type="submit" className={styles.button}>Join</button>
            </form>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            &copy; {new Date().getFullYear()} PN Bazaar. All rights reserved.
          </p>
          <div className={styles.socials}>
            <a href="#" className={styles.socialIcon} aria-label="Facebook">FB</a>
            <a href="#" className={styles.socialIcon} aria-label="Twitter">TW</a>
            <a href="#" className={styles.socialIcon} aria-label="Instagram">IG</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
