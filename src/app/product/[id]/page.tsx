import type { Metadata } from "next";
import { getDatabase } from "../../../lib/mongodb";
import ProductDetailsClient from "./ProductDetailsClient";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id: slug } = await params;

  let product: any = null;
  try {
    const db = await getDatabase();
    product = await db.collection("products").findOne({ slug, status: { $ne: "draft" } });
  } catch {
    // fallback to static data
  }

  if (!product) {
    return {
      title: "Product Not Found | PN Bazaar",
      description: "The requested product could not be found.",
    };
  }

  const title = product.seoMetaTitle || `${product.name} | PN Bazaar`;
  const description = product.seoMetaDescription || product.description;
  const ogDescription = "Pay online and get flat 10% off! Shop now at PN Bazaar.";
  const mainImage = product.image || product.images?.[0] || "";

  return {
    title,
    description,
    keywords: product.seoKeywords ? product.seoKeywords.split(",").map((k: string) => k.trim()) : product.tags || [],
    openGraph: {
      title,
      description: ogDescription,
      type: "website",
      url: `https://pnbazaar.com/product/${slug}`,
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
      description: ogDescription,
      images: [mainImage],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id: slug } = await params;
  return <ProductDetailsClient slug={slug} />;
}
