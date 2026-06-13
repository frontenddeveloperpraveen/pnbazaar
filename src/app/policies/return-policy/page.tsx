import React from "react";

export default function ReturnPolicyPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "80px auto 40px", padding: "0 20px", fontFamily: "var(--font-sans, Inter, sans-serif)", lineHeight: "1.6" }}>
      <h1 style={{ fontFamily: "var(--font-display, Outfit, sans-serif)", fontSize: "32px", marginBottom: "20px" }}>Return Policy</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Last updated: June 13, 2026</p>
      
      <p style={{ marginBottom: "16px" }}>
        At PN Bazaar, we want you to be completely satisfied with your purchase. If for any reason you are not happy with your hand-crafted items, we accept returns within 30 days of purchase.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>1. Conditions for Returns</h2>
      <p style={{ marginBottom: "16px" }}>
        To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>2. Non-Returnable Items</h2>
      <p style={{ marginBottom: "16px" }}>
        Certain types of items cannot be returned, including custom-made products, personalized orders, gift wraps, and promotional clearance sale items.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>3. Refunds Process</h2>
      <p style={{ marginBottom: "16px" }}>
        Once we receive and inspect your returned item, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original payment method. For Cash on Delivery orders, refunds will be issued as shop credit or bank transfer.
      </p>

      <h2 style={{ fontSize: "20px", marginTop: "24px", marginBottom: "12px" }}>4. Contact Support</h2>
      <p style={{ marginBottom: "16px" }}>
        If you have any questions about returns, please contact our support team at <strong>support@pnbazaar.com</strong>.
      </p>
    </div>
  );
}
