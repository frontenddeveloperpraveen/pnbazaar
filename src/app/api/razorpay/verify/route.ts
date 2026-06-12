import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDatabase } from "../../../../lib/mongodb";

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = await request.json();

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json({ error: "Razorpay secret key not configured" }, { status: 500 });
    }

    // Generate expected signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed. Signature mismatch." }, { status: 400 });
    }

    // Signature matches, complete order record creation in database securely on the server!
    const db = await getDatabase();
    const collection = db.collection("orders");

    const finalOrder = {
      ...orderPayload,
      id: orderPayload.id || "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: orderPayload.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: "Processing",
      paymentVerified: true,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    };

    await collection.insertOne(finalOrder);

    return NextResponse.json({ success: true, order: finalOrder });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
