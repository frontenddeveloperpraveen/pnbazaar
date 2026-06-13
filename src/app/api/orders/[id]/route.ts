import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { sendOrderShippedEmail, sendOrderCancelledEmail, sendOrderDeliveredEmail } from "../../../../lib/email";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection("orders");
    const result = await collection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const collection = db.collection("orders");
    const body = await request.json();
    
    const existingOrder = await collection.findOne({ id: id });
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateFields: Record<string, any> = {};
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.trackingLink !== undefined) updateFields.trackingLink = body.trackingLink;
    if (body.courierService !== undefined) updateFields.courierService = body.courierService;
    if (body.archived !== undefined) updateFields.archived = body.archived;
    if (body.cancelReason !== undefined) updateFields.cancelReason = body.cancelReason;
    
    const result = await collection.updateOne(
      { id: id },
      { $set: updateFields }
    );
    
    // If status transitioned, send email
    if (body.status && body.status !== existingOrder.status) {
      const payload = {
        orderId: existingOrder.id,
        customerName: existingOrder.customerInfo?.name || existingOrder.customerName || "Customer",
        customerEmail: existingOrder.customerInfo?.email || existingOrder.customerEmail,
        items: existingOrder.items || [],
        subtotal: existingOrder.subtotal || existingOrder.total,
        discount: existingOrder.discount || 0,
        deliveryFee: existingOrder.deliveryFee || 0,
        total: existingOrder.total,
        shippingAddress: {
          fullName: existingOrder.customerInfo?.name || "Customer",
          addressLine: existingOrder.customerInfo?.shippingAddress || existingOrder.customerInfo?.address || "",
          city: existingOrder.customerInfo?.city || "",
          state: existingOrder.customerInfo?.shippingState || existingOrder.customerInfo?.state || "",
          pincode: existingOrder.customerInfo?.shippingPincode || existingOrder.customerInfo?.pincode || "",
          phone: existingOrder.customerInfo?.phone || "",
        },
        paymentMethod: existingOrder.customerInfo?.paymentMethod || existingOrder.paymentMethod || "cod",
        date: existingOrder.date,
        cancelReason: body.cancelReason || existingOrder.cancelReason,
        trackingLink: body.trackingLink || existingOrder.trackingLink || body.trackingLink
      };

      try {
        const normalizedStatus = body.status.toLowerCase();
        if (normalizedStatus === "shipped") {
          await sendOrderShippedEmail(payload);
        } else if (normalizedStatus === "cancelled") {
          await sendOrderCancelledEmail(payload);
        } else if (normalizedStatus === "delivered") {
          await sendOrderDeliveredEmail(payload);
        }
      } catch (mailErr) {
        console.error("Failed to send order update email:", mailErr);
      }
    }
    
    return NextResponse.json({ success: true, id, status: body.status || existingOrder.status });
  } catch (error: any) {
    console.error("PUT order status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
