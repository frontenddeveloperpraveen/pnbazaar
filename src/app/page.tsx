import type { Metadata } from "next";
import HomePageClient from "./page.client";

export const metadata: Metadata = {
  title: "PN Bazaar | Premium Minimalist Everyday Goods",
  description: "Explore a curated collection of everyday canvas carry-goods, felt workspace organizers, and premium lifestyle accessories.",
  keywords: ["backpacks", "desk organizers", "ceramics", "lifestyle accessories", "minimalist goods"],
  openGraph: {
    title: "PN Bazaar | Premium Minimalist Everyday Goods",
    description: "Explore a curated collection of everyday canvas carry-goods, felt workspace organizers, and premium lifestyle accessories.",
    url: "https://pnbazaar.com",
    siteName: "PN Bazaar",
    images: [
      {
        url: "https://pnbazaar.com/logo.png",
        width: 1200,
        height: 630,
        alt: "PN Bazaar Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PN Bazaar | Premium Minimalist Everyday Goods",
    description: "Explore a curated collection of everyday canvas carry-goods, felt workspace organizers, and premium lifestyle accessories.",
    images: ["https://pnbazaar.com/logo.png"],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}