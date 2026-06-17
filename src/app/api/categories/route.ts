import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const products = db.collection("products");
    const categories = await products.distinct("category");

    const result = categories
      .filter(Boolean)
      .map((slug: string) => ({
        name: slug
          .split("-")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug,
        description: "",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
      }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
