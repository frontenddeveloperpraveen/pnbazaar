import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getDatabase } from "../../../../lib/mongodb";
import { sanitizeHtml, getGenericError } from "../../../../lib/security";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.in",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "noreply@pnbazaar.shop",
    pass: process.env.SMTP_PASS || "",
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, requestType, reason, imageUrls, customerName, customerEmail } = body;

    if (!orderId || !requestType || !reason) {
      return NextResponse.json({ error: "orderId, requestType, and reason required" }, { status: 400 });
    }

    const db = await getDatabase();
    const order = await db.collection("orders").findOne({ id: orderId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const formatPrice = (p: number) => "₹" + (p || 0).toLocaleString("en-IN");

    const itemsHtml = (order.items || []).map((item: any) => {
      const p = item.product || item;
      const name = p.name || p.title || "Unknown";
      const qty = item.quantity || 1;
      const price = p.price || 0;
      return `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${name}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${qty}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${formatPrice(price)}</td></tr>`;
    }).join("");

    const imagesHtml = (imageUrls || []).length > 0
      ? imageUrls.map((url: string) => `<div style="margin-bottom:12px"><img src="${sanitizeHtml(url)}" alt="User uploaded" style="max-width:400px;border-radius:8px;border:1px solid #e2e8f0" /></div>`).join("")
      : "<p style='color:#666'>No images uploaded</p>";

    const requestLabel = sanitizeHtml(requestType === "return" ? "Return" : "Replacement");

    await transporter.sendMail({
      from: `"PN Bazaar" <noreply@pnbazaar.shop>`,
      to: "iamkrpraveen@gmail.com",
      subject: `${requestLabel} Request - Order #${orderId}`,
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${requestLabel} Request - #${orderId}</title></head>
<body style="font-family:-apple-system,sans-serif;background:#f6f9fc;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
<div style="background:#111827;padding:24px;text-align:center">
<h1 style="color:#fff;margin:0;font-size:20px">${requestLabel} Request</h1>
</div>
<div style="padding:24px">
<div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:20px;border-left:4px solid #f59e0b">
<strong style="color:#92400e">Action Required</strong>
<p style="margin:4px 0 0;color:#92400e;font-size:13px">Customer has requested a ${requestType} for order <strong>#${orderId}</strong>. Review the details below and take appropriate action.</p>
</div>

<h3 style="margin:0 0 12px;font-size:16px;color:#111827">Order Details</h3>
<table style="width:100%;border-collapse:collapse;margin-bottom:20px">
<thead><tr style="background:#f7fafc"><th style="padding:8px;text-align:left;font-size:12px;color:#718096;border-bottom:2px solid #e2e8f0">Item</th><th style="padding:8px;text-align:center;font-size:12px;color:#718096;border-bottom:2px solid #e2e8f0">Qty</th><th style="padding:8px;text-align:right;font-size:12px;color:#718096;border-bottom:2px solid #e2e8f0">Price</th></tr></thead>
<tbody>${itemsHtml}</tbody>
</table>

<div style="background:#f7fafc;border-radius:8px;padding:16px;margin-bottom:20px">
<h4 style="margin:0 0 8px;font-size:13px;color:#718096;text-transform:uppercase;letter-spacing:0.5px">Customer Info</h4>
<p style="margin:0;font-size:14px;color:#111827"><strong>Name:</strong> ${sanitizeHtml(customerName || order.customerInfo?.name || "N/A")}</p>
<p style="margin:4px 0 0;font-size:14px;color:#111827"><strong>Email:</strong> ${sanitizeHtml(customerEmail || order.customerInfo?.email || "N/A")}</p>
<p style="margin:4px 0 0;font-size:14px;color:#111827"><strong>Order Total:</strong> ${formatPrice(order.total || 0)}</p>
<p style="margin:4px 0 0;font-size:14px;color:#111827"><strong>Payment:</strong> ${order.customerInfo?.paymentMethod === "COD" ? "Cash on Delivery" : order.customerInfo?.paymentMethod || "Standard"}</p>
<p style="margin:4px 0 0;font-size:14px;color:#111827"><strong>Order Date:</strong> ${new Date(order.date).toLocaleString("en-IN")}</p>
</div>

<div style="background:#f7fafc;border-radius:8px;padding:16px;margin-bottom:20px">
<h4 style="margin:0 0 8px;font-size:13px;color:#718096;text-transform:uppercase;letter-spacing:0.5px;color:${requestType === "return" ? "#b91c1c" : "#1e40af"}">${requestLabel} Reason</h4>
<p style="margin:0;font-size:14px;color:#111827;white-space:pre-wrap">${sanitizeHtml(reason)}</p>
</div>

<div style="background:#f7fafc;border-radius:8px;padding:16px;margin-bottom:20px">
<h4 style="margin:0 0 8px;font-size:13px;color:#718096;text-transform:uppercase;letter-spacing:0.5px">Uploaded Photos</h4>
${imagesHtml}
</div>

<div style="text-align:center;padding:16px;background:#f7fafc;border-radius:8px;font-size:12px;color:#718096">
<p style="margin:0">Visit admin panel to process this request</p>
<a href="https://pnbazaar.shop/admin?tab=orders" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px">Open Admin Panel</a>
</div>
</div>
<div style="background:#f7fafc;padding:20px;text-align:center;font-size:12px;color:#718096;border-top:1px solid #e2e8f0">
<p style="margin:0">&copy; ${new Date().getFullYear()} PN Bazaar. Automated request notification.</p>
</div>
</div>
</body></html>`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Return request error:", error);
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
