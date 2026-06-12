import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("promos");
    
    const promos = await collection.find({}).toArray();
    const formattedPromos = promos.map(p => {
      const { _id, ...rest } = p;
      return { ...rest };
    });
    
    return NextResponse.json(formattedPromos);
  } catch (error: any) {
    console.error("GET promos error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("promos");
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Code query param required" }, { status: 400 });
    const result = await collection.deleteOne({ code: code.toUpperCase().trim() });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("promos");
    const body = await request.json();
    
    const cleanCode = body.code.toUpperCase().trim();
    
    // Check if duplicate code exists
    const existing = await collection.findOne({ code: cleanCode });
    if (existing) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 400 });
    }
    
    const newPromo = {
      code: cleanCode,
      type: body.type || "percentage",
      value: Number(body.value),
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      isForever: body.isForever ?? true,
      minOrderAmount: body.minOrderAmount ? Number(body.minOrderAmount) : undefined,
      validLocations: body.validLocations || undefined,
      validCategories: body.validCategories || undefined,
      validProducts: body.validProducts || undefined
    };
    
    await collection.insertOne(newPromo);
    return NextResponse.json(newPromo, { status: 201 });
  } catch (error: any) {
    console.error("POST promo error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("promos");
    const body = await request.json();
    const cleanCode = body.code.toUpperCase().trim();
    const updateData: any = {
      type: body.type || "percentage",
      value: Number(body.value),
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      isForever: body.isForever ?? true,
      minOrderAmount: body.minOrderAmount ? Number(body.minOrderAmount) : undefined,
      validLocations: body.validLocations || undefined,
      validCategories: body.validCategories || undefined,
      validProducts: body.validProducts || undefined
    };
    await collection.updateOne({ code: cleanCode }, { $set: updateData });
    return NextResponse.json({ code: cleanCode, ...updateData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

