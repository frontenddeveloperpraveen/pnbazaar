import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { PRODUCTS as initialProducts } from "../../../data/db";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("products");
    
    // Count existing products
    const count = await collection.countDocuments();
    if (count === 0) {
      // Insert initial fallback products if db is empty
      await collection.insertMany(initialProducts);
    }
    
    const products = await collection.find({}).toArray();
    
    // Convert Mongo _id to string or preserve it
    const formattedProducts = products.map(p => {
      const { _id, ...rest } = p;
      return { ...rest, id: rest.id || String(_id) };
    });
    
    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error("GET products error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("products");
    const body = await request.json();
    
    // Check if product already exists or generate a valid id
    const newProduct = {
      ...body,
      id: body.id || "prod-" + Date.now()
    };
    
    await collection.insertOne(newProduct);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
