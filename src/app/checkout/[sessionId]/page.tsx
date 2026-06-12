import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

interface CheckoutPageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const shortId = sessionId ? sessionId.slice(0, 8) : "";
  return {
    title: `Secure Checkout ${shortId ? `(${shortId})` : ""} | PN Bazaar`,
    description: "Complete your checkout at PN Bazaar. Secure Cash on Delivery order placement.",
    openGraph: {
      title: "Secure Checkout | PN Bazaar",
      description: "Complete your checkout at PN Bazaar. Secure Cash on Delivery order placement.",
      url: `https://pnbazaar.com/checkout/${sessionId}`,
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
      title: "Secure Checkout | PN Bazaar",
      description: "Complete your checkout at PN Bazaar. Secure Cash on Delivery order placement.",
      images: ["https://pnbazaar.com/logo.png"],
    },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { sessionId } = await params;
  return <CheckoutClient sessionId={sessionId} />;
}