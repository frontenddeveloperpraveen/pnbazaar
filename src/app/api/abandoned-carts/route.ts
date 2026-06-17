import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { verifyAdminAuth, checkRateLimit, getGenericError } from "../../../lib/security";

export async function GET(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_carts");
    const carts = await collection.find({}).sort({ createdAt: -1 }).toArray();
    const formatted = carts.map((c: any) => {
      const { _id, ...rest } = c;
      return { ...rest, _id: _id.toString() };
    });
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!checkRateLimit("abandoned-carts:" + (request.headers.get("x-forwarded-for") || "unknown"), 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
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
  } catch {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
  } catch {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const db = await getDatabase();
    const collection = db.collection("abandoned_carts");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });
    const { ObjectId } = require("mongodb");
    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
