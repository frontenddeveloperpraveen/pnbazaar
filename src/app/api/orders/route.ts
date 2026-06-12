import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("orders");
    
    // Retrieve all orders sorted by date/id descending
    const orders = await collection.find({}).sort({ _id: -1 }).toArray();
    
    const formattedOrders = orders.map(o => {
      const { _id, ...rest } = o;
      return { ...rest, id: rest.id || String(_id) };
    });
    
    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error("GET orders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("orders");
    const body = await request.json();
    
    const newOrder = {
      ...body,
      id: body.id || "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: body.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    await collection.insertOne(newOrder);
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
