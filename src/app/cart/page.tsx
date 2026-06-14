import type { Metadata } from "next";
import CartClient from "./CartClient";

export const metadata: Metadata = {
  title: "Your Shopping Cart | PN Bazaar",
  description: "Review your selected premium minimalist canvas backpacks, desk organizers, ceramics, and lifestyle accessories.",
  openGraph: {
    title: "Your Shopping Cart | PN Bazaar",
    description: "Review your selected premium minimalist canvas backpacks, desk organizers, ceramics, and lifestyle accessories.",
    url: "https://pnbazaar.shop/cart",
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
    title: "Your Shopping Cart | PN Bazaar",
    description: "Review your selected premium minimalist canvas backpacks, desk organizers, ceramics, and lifestyle accessories.",
    images: ["https://pnbazaar.shop/logo.png"],
  },
};

export default function CartPage() {
  return <CartClient />;
}
