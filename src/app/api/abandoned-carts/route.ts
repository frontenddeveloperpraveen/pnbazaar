import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_carts");
    const carts = await collection.find({}).sort({ createdAt: -1 }).toArray();
    const formatted = carts.map((c: any) => {
      const { _id, ...rest } = c;
      return { ...rest, _id: _id.toString() };
    });
    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_carts");
    const body = await request.json();
    const doc = {
      email: body.email || "",
      phone: body.phone || "",
      name: body.name || "",
      items: body.items || [],
      total: body.total || 0,
      sessionId: body.sessionId || "",
      lat: body.lat || null,
      lng: body.lng || null,
      ipLocation: body.ipLocation || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
      followUpLogs: [] as { type: string; sentAt: string; message: string }[]
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_carts");
    const body = await request.json();
    const { _id, ...updateData } = body;
    if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
    const { ObjectId } = require("mongodb");
    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateData, updatedAt: new Date().toISOString() } }
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_carts");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
    const { ObjectId } = require("mongodb");
    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
