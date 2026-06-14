import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDatabase } from "../../../../lib/mongodb";
import { sendOrderConfirmedEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json({ error: "Razorpay secret key not configured" }, { status: 500 });
    }

    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      const db = await getDatabase();
      await db.collection("orders").updateOne(
        { id: orderId },
        { $set: { razorpayStatus: "failed", status: "Cancelled" } }
      );
      return NextResponse.json({ error: "Payment verification failed. Signature mismatch." }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection("orders").findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          status: "Processing",
          paymentVerified: true,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpayStatus: "paid",
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Send confirmation email (non-blocking)
    try {
      const order = result;
      const payload = {
        orderId: order.id,
        customerName: order.customerInfo?.name || "Customer",
        customerEmail: order.customerInfo?.email,
        items: order.items || [],
        subtotal: order.subtotal || order.total,
        discount: order.discount || 0,
        deliveryFee: order.deliveryFee || 0,
        total: order.total,
        shippingAddress: {
          fullName: order.customerInfo?.shippingName || order.customerInfo?.name || "Customer",
          addressLine: order.customerInfo?.shippingAddress || order.customerInfo?.address || "",
          city: order.customerInfo?.shippingCity || "",
          state: order.customerInfo?.shippingState || "",
          pincode: order.customerInfo?.shippingPincode || "",
          phone: order.customerInfo?.phone || "",
        },
        paymentMethod: "Online (Razorpay)",
        date: order.date,
      };
      await sendOrderConfirmedEmail(payload);
    } catch (mailErr) {
      console.error("Failed to send ONLINE confirmation email:", mailErr);
    }

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
