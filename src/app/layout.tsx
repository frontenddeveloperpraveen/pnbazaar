import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import ClientLayoutWrapper from "../components/ClientLayoutWrapper";

export const metadata: Metadata = {
  title: "PN Bazaar | Premium Minimalist Everyday Goods",
  description: "Explore a curated collection of everyday canvas carry-goods, felt workspace organizers, and premium lifestyle accessories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}
