import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { sendOrderConfirmedEmail } from "../../../lib/email";
import Razorpay from "razorpay";
import { secureToken, secureOrderId, checkRateLimit, checkOrigin, getGenericError } from "../../../lib/security";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit("checkout:" + request.headers.get("x-forwarded-for") || "unknown", 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!checkOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
    const body = await request.json();
    const { paymentMethod, customerInfo, items, subtotal, shippingFee, total, appliedCoupon, cashbackApplied, giftWrap, giftNote } = body;

    if (!customerInfo || !items || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection("orders");

    const orderId = secureOrderId();
    const date = new Date().toISOString();

    if (paymentMethod === "COD") {
      const sub = subtotal || total;
      const delivery = shippingFee || 0;
      const disc = Math.max(0, (sub + delivery) - total);
      const viewToken = secureToken();

      // Server-side price validation: recalculate total from items
      let validatedSubtotal = 0;
      for (const item of (items || [])) {
        const qty = item.quantity || 1;
        const price = item.product?.price || item.price || 0;
        validatedSubtotal += price * qty;
      }
      // If client subtotal differs significantly, reject
      if (Math.abs(validatedSubtotal - sub) > 1) {
        return NextResponse.json({ error: "Price mismatch detected" }, { status: 400 });
      }

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
        viewToken,
        viewClaimed: false,
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
          giftWrap: giftWrap || undefined,
          giftNote: giftNote?.trim() || undefined,
        };
        await sendOrderConfirmedEmail(payload);
      } catch (mailErr) {
        console.error("Failed to send COD confirmation email:", mailErr);
      }

      return NextResponse.json({ success: true, order: newOrder, paymentMethod: "COD" });
    }

    if (paymentMethod === "ONLINE") {
      const settings = await db.collection("settings").findOne({ key: "payment_config" });
      const prepaidEnabled = settings?.value?.prepaidEnabled ?? true;
      if (!prepaidEnabled) {
        return NextResponse.json({ error: "Online payments are currently disabled" }, { status: 403 });
      }

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
      const disc = Math.max(0, (sub + delivery) - total);

      const viewToken = secureToken();
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
        viewToken,
        viewClaimed: false,
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
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
