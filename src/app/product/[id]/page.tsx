import type { Metadata } from "next";
import { PRODUCTS } from "../../../data/db";
import ProductDetailsClient from "./ProductDetailsClient";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug && p.status !== "draft");

  if (!product) {
    return {
      title: "Product Not Found | PN Bazaar",
      description: "The requested product could not be found.",
    };
  }

  const title = product.seoMetaTitle || `${product.name} | PN Bazaar`;
  const description = product.seoMetaDescription || product.description;
  const mainImage = product.image; // "img is main image" from user prompt!

  return {
    title,
    description,
    keywords: product.seoKeywords ? product.seoKeywords.split(",").map(k => k.trim()) : product.tags || [],
    openGraph: {
      title,
      description,
      type: "website", // Standard OG type or casted
      url: `https://pnbazaar.com/product/${product.slug}`,
      images: [
        {
          url: mainImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      siteName: "PN Bazaar",
    },
    other: {
      "og:price:amount": product.price.toString(),
      "og:price:currency": "INR",
      "product:price:amount": product.price.toString(),
      "product:price:currency": "INR",
      "product:retailer_item_id": product.id,
      "product:category": product.category,
      "og:type": "product",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [mainImage],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id: slug } = await params;
  return <ProductDetailsClient slug={slug} />;
}
