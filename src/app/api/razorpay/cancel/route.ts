import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { checkRateLimit, checkOrigin, getGenericError } from "../../../../lib/security";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit("cancel:" + (request.headers.get("x-forwarded-for") || "unknown"), 20, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!checkOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const db = await getDatabase();
    const order = await db.collection("orders").findOne({ id: orderId });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.paymentVerified) {
      return NextResponse.json({ error: "Cannot cancel a paid order" }, { status: 400 });
    }

    await db.collection("orders").updateOne(
      { id: orderId },
      { $set: { razorpayStatus: "cancelled", status: "Cancelled" } }
    );

    const collection = db.collection("cancelled_payments");
    await collection.insertOne({
      orderId,
      reason: reason || "Payment modal closed by user",
      cancelledAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment cancel log error:", error);
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
