import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "80px auto 40px", padding: "0 20px", fontFamily: "var(--font-sans, Inter, sans-serif)", lineHeight: "1.6" }}>
      <h1 style={{ fontFamily: "var(--font-display, Outfit, sans-serif)", fontSize: "32px", marginBottom: "20px" }}>Privacy Policy</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Last updated: June 13, 2026</p>

      <p style={{ marginBottom: "16px" }}>
        PN Bazaar operates the website and online services. We are committed to protecting your privacy and ensuring your personal information is handled in a safe and responsible manner.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>1. Information We Collect</h2>
      <p style={{ marginBottom: "16px" }}>
        When you place an order, join our newsletter, or create a checkout session, we collect the personal information you give us, such as your name, billing address, shipping address, email address, phone number, coordinates, and IP location.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>2. How We Use Your Information</h2>
      <p style={{ marginBottom: "16px" }}>
        We use this information to process your transactions, manage your orders, send confirmation notices, target follow-up communications for aborted shopping carts, and improve our store layout experience.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>3. Data Security</h2>
      <p style={{ marginBottom: "16px" }}>
        To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered, or destroyed.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>4. Third-Party Integrations</h2>
      <p style={{ marginBottom: "16px" }}>
        In general, the third-party providers used by us (such as payment processors and analytical frameworks) will only collect, use, and disclose your information to the extent necessary to allow them to perform the services they provide to us.
      </p>
    </div>
  );
}
