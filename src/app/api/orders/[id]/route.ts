import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection("orders");
    const body = await request.json();
    
    const updateFields: Record<string, any> = { status: body.status };
    if (body.trackingLink !== undefined) updateFields.trackingLink = body.trackingLink;
    if (body.courierService !== undefined) updateFields.courierService = body.courierService;
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
