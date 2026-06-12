import type { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search Results | PN Bazaar",
  description: "Search for premium minimalist canvas backpacks, desk organizers, ceramics, and lifestyle accessories.",
  openGraph: {
    title: "Search Results | PN Bazaar",
    description: "Search for premium minimalist canvas backpacks, desk organizers, ceramics, and lifestyle accessories.",
    url: "https://pnbazaar.com/search",
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
    title: "Search Results | PN Bazaar",
    description: "Search for premium minimalist canvas backpacks, desk organizers, ceramics, and lifestyle accessories.",
    images: ["https://pnbazaar.com/logo.png"],
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center" }}>Loading Search...</div>}>
      <SearchClient />
    </Suspense>
  );
}
