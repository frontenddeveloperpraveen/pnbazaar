import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, reason, orderId } = body;

    const db = await getDatabase();
    const collection = db.collection("cancelled_payments");

    const logEntry = {
      sessionId,
      orderId,
      reason: reason || "Payment modal closed by user",
      cancelledAt: new Date().toISOString(),
    };

    await collection.insertOne(logEntry);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment cancel log error:", error);
    return NextResponse.json({ error: error.message || "Failed to log cancellation" }, { status: 500 });
  }
}
