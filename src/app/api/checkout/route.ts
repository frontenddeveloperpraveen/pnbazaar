import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { sendOrderConfirmedEmail } from "../../../lib/email";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentMethod, customerInfo, items, subtotal, shippingFee, total, appliedCoupon, cashbackApplied, giftWrap, giftNote } = body;

    if (!customerInfo || !items || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection("orders");

    const orderId = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const date = new Date().toISOString();

    if (paymentMethod === "COD") {
      const sub = subtotal || total;
      const delivery = shippingFee || 0;
      const disc = (sub + delivery) - total;

      const newOrder = {
        items,
        subtotal: sub,
        discount: disc > 0 ? disc : 0,
        deliveryFee: delivery,
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

      // Send confirmation email (non-blocking)
      try {
        const payload = {
          orderId: orderId,
          customerName: customerInfo?.name || "Customer",
          customerEmail: customerInfo?.email,
          items: items || [],
          subtotal: sub,
          discount: disc > 0 ? disc : 0,
          deliveryFee: delivery,
          total: total,
          shippingAddress: {
            fullName: customerInfo?.shippingName || customerInfo?.name || "Customer",
            addressLine: customerInfo?.shippingAddress || customerInfo?.address || "",
            city: customerInfo?.shippingCity || "",
            state: customerInfo?.shippingState || "",
            pincode: customerInfo?.shippingPincode || "",
            phone: customerInfo?.phone || "",
          },
          paymentMethod: "COD",
          date: date,
        };
        await sendOrderConfirmedEmail(payload);
      } catch (mailErr) {
        console.error("Failed to send COD confirmation email:", mailErr);
      }

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

      const sub = subtotal || total;
      const delivery = shippingFee || 0;
      const disc = (sub + delivery) - total;

      const pendingOrder = {
        items,
        subtotal: sub,
        discount: disc > 0 ? disc : 0,
        deliveryFee: delivery,
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
