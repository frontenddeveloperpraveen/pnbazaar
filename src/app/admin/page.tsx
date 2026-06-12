import type { Metadata } from "next";
import { Suspense } from "react";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin Portal | PN Bazaar",
  description: "PN Bazaar administrator management panel for orders, products, inventory, offers, and analytics.",
  openGraph: {
    title: "Admin Portal | PN Bazaar",
    description: "PN Bazaar administrator management panel for orders, products, inventory, offers, and analytics.",
    url: "https://pnbazaar.com/admin",
    images: [
      {
        url: "https://pnbazaar.com/logo.png",
        width: 1200,
        height: 630,
        alt: "PN Bazaar Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Admin Portal | PN Bazaar",
    description: "PN Bazaar administrator management panel for orders, products, inventory, offers, and analytics.",
    images: ["https://pnbazaar.com/logo.png"],
  },
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Loading Admin Portal...</div>}>
      <AdminClient />
    </Suspense>
  );
}
