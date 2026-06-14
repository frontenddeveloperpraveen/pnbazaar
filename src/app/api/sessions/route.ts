import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

const { ObjectId } = require("mongodb");

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId");
    const collection = db.collection("sessions");
    
    let docs;
    if (visitorId) {
      docs = await collection.find({ visitorId }).sort({ updatedAt: -1 }).toArray();
    } else {
      docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();
    }
    
    const formatted = docs.map((d: any) => {
      const { _id, ...rest } = d;
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
    const collection = db.collection("sessions");
    const body = await request.json();
    const { visitorId } = body;
    
    if (!visitorId) {
      return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    }

    const existing = await collection.findOne({ visitorId });
    const now = new Date().toISOString();

    if (existing) {
      const update: any = { updatedAt: now };
      if (body.items !== undefined) update.items = body.items;
      if (body.checkoutData !== undefined) update.checkoutData = body.checkoutData;
      if (body.orderId !== undefined) update.orderId = body.orderId;
      if (body.lat !== undefined) update.lat = body.lat;
      if (body.lng !== undefined) update.lng = body.lng;
      if (body.ipLocation !== undefined) update.ipLocation = body.ipLocation;
      if (body.archived !== undefined) update.archived = body.archived;

      await collection.updateOne({ visitorId }, { $set: update });
      const updated = await collection.findOne({ visitorId });
      if (updated) {
        const { _id, ...rest } = updated;
        return NextResponse.json({ ...rest, _id: _id.toString() });
      }
    }

    const doc = {
      visitorId,
      items: body.items || [],
      checkoutData: body.checkoutData || null,
      orderId: body.orderId || null,
      lat: body.lat || null,
      lng: body.lng || null,
      ipLocation: body.ipLocation || null,
      createdAt: now,
      updatedAt: now,
      archived: false,
      followUpLogs: [],
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
    const collection = db.collection("sessions");
    const body = await request.json();
    const { visitorId, ...updates } = body;

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    }

    updates.updatedAt = new Date().toISOString();
    await collection.updateOne({ visitorId }, { $set: updates });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection("sessions");
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId");

    if (!visitorId) {
      return NextResponse.json({ error: "visitorId required" }, { status: 400 });
    }

    await collection.deleteOne({ visitorId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
