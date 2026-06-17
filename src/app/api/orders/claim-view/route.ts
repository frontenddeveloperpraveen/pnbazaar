import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { checkRateLimit, getGenericError } from "../../../../lib/security";

export async function POST(request: Request) {
  if (!checkRateLimit("claim-view:" + (request.headers.get("x-forwarded-for") || "unknown"), 5, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const { orderId, token } = await request.json();
    if (!orderId || !token) {
      return NextResponse.json({ error: "Missing orderId or token" }, { status: 400 });
    }

    const db = await getDatabase();
    const order = await db.collection("orders").findOne({ id: orderId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.viewToken !== token) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 403 });
    }

    if (order.viewClaimed) {
      return NextResponse.json({ error: "This confirmation link has already been used" }, { status: 403 });
    }

    await db.collection("orders").updateOne(
      { id: orderId },
      { $set: { viewClaimed: true, viewedAt: new Date().toISOString() } }
    );

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        date: order.date,
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
        items: order.items,
        customerInfo: order.customerInfo,
        appliedCoupon: order.appliedCoupon,
        giftWrap: order.giftWrap,
        giftNote: order.giftNote,
      },
    });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
