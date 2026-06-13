import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentMethod, customerInfo, items, total, appliedCoupon, cashbackApplied, giftWrap, giftNote } = body;

    if (!customerInfo || !items || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection("orders");

    const orderId = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (paymentMethod === "COD") {
      const newOrder = {
        items,
        total,
        status: "Processing",
        customerInfo,
        cashbackApplied,
        appliedCoupon,
        defaultOrdered: true,
        giftWrap: giftWrap || undefined,
        giftNote: giftNote || undefined,
        paymentVerified: false,
        paymentMethod: "COD",
        id: orderId,
        date,
      };

      await collection.insertOne(newOrder);
      return NextResponse.json({ success: true, order: newOrder, paymentMethod: "COD" });
    }

    if (paymentMethod === "ONLINE") {
      const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;

      if (!key_id || !key_secret) {
        return NextResponse.json({ error: "Razorpay credentials not configured" }, { status: 500 });
      }

      const razorpay = new Razorpay({ key_id, key_secret });

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: "receipt_" + orderId,
      });

      const pendingOrder = {
        items,
        total,
        status: "Pending",
        customerInfo,
        cashbackApplied,
        appliedCoupon,
        defaultOrdered: true,
        giftWrap: giftWrap || undefined,
        giftNote: giftNote || undefined,
        paymentVerified: false,
        paymentMethod: "Online (Razorpay)",
        razorpayOrderId: razorpayOrder.id,
        razorpayStatus: "created",
        id: orderId,
        date,
      };

      await collection.insertOne(pendingOrder);

      return NextResponse.json({
        success: true,
        order: pendingOrder,
        paymentMethod: "ONLINE",
        razorpay: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      });
    }

    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}
