import React from "react";

export default function CookiesUsagePage() {
  return (
    <div style={{ maxWidth: "800px", margin: "80px auto 40px", padding: "0 20px", fontFamily: "var(--font-sans, Inter, sans-serif)", lineHeight: "1.6" }}>
      <h1 style={{ fontFamily: "var(--font-display, Outfit, sans-serif)", fontSize: "32px", marginBottom: "20px" }}>Cookies Usage</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Last updated: June 13, 2026</p>

      <p style={{ marginBottom: "16px" }}>
        Like most e-commerce sites, PN Bazaar uses cookies, web beacons, tracking pixels, and local storage technologies to enhance your shopping experience.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>1. What Are Cookies?</h2>
      <p style={{ marginBottom: "16px" }}>
        Cookies are small text files stored on your browser or hard drive when you visit certain pages. They help store checkout session snapshots, keep track of your shopping cart contents, and remember your account preferences.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>2. Types of Cookies We Use</h2>
      <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
        <li><strong>Essential Cookies:</strong> Critical for enabling base checkout, shopping carts, and security features.</li>
        <li><strong>Preference Cookies:</strong> Used to customize language preferences or state filters.</li>
        <li><strong>Analytical Cookies:</strong> Help us measure visitor duration and clicked buttons to optimize navigation structures.</li>
      </ul>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>3. Managing Cookies</h2>
      <p style={{ marginBottom: "16px" }}>
        You can block or delete cookies through your web browser preferences at any time. However, disabling essential cookies will prevent the e-commerce shopping cart and checkout processes from functioning correctly.
      </p>
    </div>
  );
}
