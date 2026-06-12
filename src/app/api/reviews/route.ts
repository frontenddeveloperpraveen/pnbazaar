import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("reviews");
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const filter = productId ? { productId } : {};
    const reviews = await collection.find(filter).sort({ date: -1 }).toArray();
    const formatted = reviews.map((r: any) => {
      const { _id, ...rest } = r;
      return { ...rest, _id: _id.toString(), id: rest.id || String(_id) };
    });
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("reviews");
    const body = await request.json();
    const doc = {
      id: body.id || "rev-" + Date.now() + Math.random().toString(36).slice(2, 6),
      productId: body.productId || "",
      productName: body.productName || "",
      customerName: body.customerName || "",
      rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
      title: body.title || "",
      review: body.review || "",
      mediaUrl: body.mediaUrl || "",
      mediaType: body.mediaType || "",
      date: body.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId.toString() }, { status: 201 });
  } catch (error: any) {
    console.error("POST review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("reviews");
    const body = await request.json();
    const { _id, ...updateFields } = body;
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    const { ObjectId } = require("mongodb");
    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateFields, updatedAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("reviews");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
    const { ObjectId } = require("mongodb");
    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE review error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}