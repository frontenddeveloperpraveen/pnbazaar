import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { checkRateLimit, checkOrigin, getGenericError } from "../../../lib/security";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit("razorpay:" + (request.headers.get("x-forwarded-for") || "unknown"), 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    if (!checkOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const db = await getDatabase();
    const order = await db.collection("orders").findOne({ id: orderId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentVerified) {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    const amount = order.total;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured in environment variables." },
        { status: 500 }
      );
    }

    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + orderId,
    };

    const rzpOrder = await razorpay.orders.create(options);
    return NextResponse.json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
