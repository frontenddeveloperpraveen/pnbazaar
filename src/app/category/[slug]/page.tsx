import type { Metadata } from "next";
import { CATEGORIES } from "../../../data/db";
import CategoryClient from "./CategoryClient";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: "Collection Not Found | PN Bazaar",
      description: "The requested collection could not be found.",
    };
  }

  const title = `${category.name} | PN Bazaar Collection`;
  const description = category.description;

  return {
    title,
    description,
    keywords: [category.name.toLowerCase(), "collection", "pn bazaar", "shopping"],
    openGraph: {
      title,
      description,
      url: `https://pnbazaar.com/category/${category.slug}`,
      images: [
        {
          url: category.image,
          width: 800,
          height: 600,
          alt: category.name,
        },
      ],
      siteName: "PN Bazaar",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [category.image],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  return <CategoryClient key={slug} slug={slug} />;
}
