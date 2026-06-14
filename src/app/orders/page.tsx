import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "My Orders | PN Bazaar",
  description: "View and track the status of your premium canvas backpacks, workspace organization organizers, and lifestyle orders.",
  openGraph: {
    title: "My Orders | PN Bazaar",
    description: "View and track the status of your premium canvas backpacks, workspace organization organizers, and lifestyle orders.",
    url: "https://pnbazaar.shop/orders",
    images: [
      {
        url: "https://pnbazaar.shop/logo.png",
        width: 1200,
        height: 630,
        alt: "PN Bazaar Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Orders | PN Bazaar",
    description: "View and track the status of your premium canvas backpacks, workspace organization organizers, and lifestyle orders.",
    images: ["https://pnbazaar.shop/logo.png"],
  },
};

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Loading Orders...</div>}>
      <OrdersClient />
    </Suspense>
  );
}