import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("faqs");
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const filter = productId ? { productId } : {};
    const faqs = await collection.find(filter).sort({ createdAt: -1 }).toArray();
    const formatted = faqs.map((f: any) => {
      const { _id, ...rest } = f;
      return { ...rest, _id: _id.toString() };
    });
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET faqs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("faqs");
    const body = await request.json();
    const doc = {
      id: body.id || "faq-" + Date.now() + Math.random().toString(36).slice(2, 6),
      productId: body.productId || "",
      productName: body.productName || "",
      question: body.question || "",
      answer: body.answer || "",
      createdAt: new Date().toISOString(),
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId.toString() }, { status: 201 });
  } catch (error: any) {
    console.error("POST faq error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("faqs");
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
    console.error("PUT faq error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("faqs");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
    const { ObjectId } = require("mongodb");
    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE faq error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}