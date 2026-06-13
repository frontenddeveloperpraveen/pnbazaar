import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("subscribers");
    const subscribers = await collection.find({}).sort({ subscribedAt: -1 }).toArray();
    const formatted = subscribers.map((s: any) => {
      const { _id, ...rest } = s;
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
    const collection = db.collection("subscribers");
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check for duplicate entry
    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: true, alreadyExists: true });
    }

    const doc = {
      email,
      subscribedAt: new Date().toISOString(),
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("subscribers");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { ObjectId } = require("mongodb");
    await collection.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
