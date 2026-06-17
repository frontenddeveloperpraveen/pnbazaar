import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { verifyAdminAuth, checkRateLimit, getGenericError } from "../../../lib/security";

export async function GET(request: Request) {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_checkouts");
    const checkouts = await collection.find({}).sort({ createdAt: -1 }).toArray();
    const formatted = checkouts.map((c: any) => {
      const { _id, ...rest } = c;
      return { ...rest, _id: _id.toString() };
    });
    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_checkouts");
    const body = await request.json();
    const doc = {
      sessionId: body.sessionId || "",
      email: body.email || "",
      phone: body.phone || "",
      name: body.name || "",
      items: body.items || [],
      total: body.total || 0,
      lat: body.lat || null,
      lng: body.lng || null,
      ipLocation: body.ipLocation || null,
      archived: false,
      followUpLogs: [],
      formData: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ ...doc, _id: result.insertedId.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}

export async function PUT(request: Request) {
    if (!checkRateLimit("abandoned-checkouts:" + (request.headers.get("x-forwarded-for") || "unknown"), 30, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_checkouts");
    const body = await request.json();
    const { sessionId, ...updates } = body;
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    updates.updatedAt = new Date().toISOString();
    const result = await collection.findOneAndUpdate(
      { sessionId },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { _id, ...rest } = result;
    return NextResponse.json({ ...rest, _id: _id.toString() });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("abandoned_checkouts");
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
    await collection.deleteOne({ sessionId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
