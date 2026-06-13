import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { sendOrderConfirmedEmail } from "../../../lib/email";

export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("orders");
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    const query: Record<string, any> = {};
    if (email) {
      query["customerInfo.email"] = email;
    }
    
    const orders = await collection.find(query).sort({ _id: -1 }).toArray();
    
    const formattedOrders = orders.map(o => {
      const { _id, ...rest } = o;
      return { ...rest, id: rest.id || String(_id) };
    });
    
    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error("GET orders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("orders");
    const body = await request.json();
    
    const newOrder = {
      ...body,
      id: body.id || "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: body.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    await collection.insertOne(newOrder);
    
    // Trigger confirmation email asynchronously
    try {
      const payload = {
        orderId: newOrder.id,
        customerName: newOrder.customerInfo?.name || newOrder.customerName || "Customer",
        customerEmail: newOrder.customerInfo?.email || newOrder.customerEmail,
        items: newOrder.items || [],
        subtotal: newOrder.subtotal || newOrder.total,
        discount: newOrder.discount || 0,
        deliveryFee: newOrder.deliveryFee || 0,
        total: newOrder.total,
        shippingAddress: {
          fullName: newOrder.customerInfo?.name || "Customer",
          addressLine: newOrder.customerInfo?.shippingAddress || newOrder.customerInfo?.address || "",
          city: newOrder.customerInfo?.city || "",
          state: newOrder.customerInfo?.shippingState || newOrder.customerInfo?.state || "",
          pincode: newOrder.customerInfo?.shippingPincode || newOrder.customerInfo?.pincode || "",
          phone: newOrder.customerInfo?.phone || "",
        },
        paymentMethod: newOrder.customerInfo?.paymentMethod || newOrder.paymentMethod || "cod",
        date: newOrder.date
      };
      await sendOrderConfirmedEmail(payload);
    } catch (mailErr) {
      console.error("Failed to send order confirmation email:", mailErr);
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
