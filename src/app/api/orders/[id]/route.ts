import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection("orders");
    const result = await collection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection("orders");
    const body = await request.json();
    
    const updateFields: Record<string, any> = {};
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.trackingLink !== undefined) updateFields.trackingLink = body.trackingLink;
    if (body.courierService !== undefined) updateFields.courierService = body.courierService;
    if (body.archived !== undefined) updateFields.archived = body.archived;
    
    const result = await collection.updateOne(
      { id: id },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, id, status: body.status });
  } catch (error: any) {
    console.error("PUT order status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
