import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, reason } = body;

    const db = await getDatabase();

    if (orderId) {
      await db.collection("orders").updateOne(
        { id: orderId },
        { $set: { razorpayStatus: "cancelled", status: "Cancelled" } }
      );
    }

    const collection = db.collection("cancelled_payments");
    await collection.insertOne({
      orderId,
      reason: reason || "Payment modal closed by user",
      cancelledAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment cancel log error:", error);
    return NextResponse.json({ error: error.message || "Failed to log cancellation" }, { status: 500 });
  }
}
