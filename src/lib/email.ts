import nodemailer from "nodemailer";

// Zoho Mail SMTP Transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  port: 465,
  secure: true, // true for port 465 SSL
  auth: {
    user: "noreply@pnbazaar.shop",
    pass: "aS3al$fw",
  },
});

// Format Price to INR
const formatPrice = (price: number) => {
  return "₹" + price.toLocaleString("en-IN");
};

// Common Email Styling Wrapper
const getEmailWrapper = (title: string, bodyContent: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
            color: #333333;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
          }
          .email-header {
            background-color: #ffffff; /* White background for JPEG logo */
            padding: 30px 40px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
          }
          .email-header img {
            height: 60px; /* Slightly larger to showcase the logo properly */
            object-fit: contain;
            margin-bottom: 0px;
          }
          .email-header h1 {
            display: none; /* Hide text h1 since logo is present */
          }
          .email-body {
            padding: 40px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 16px;
          }
          .product-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .product-table th {
            text-align: left;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #718096;
            border-bottom: 1px solid #e2e8f0;
          }
          .product-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #edf2f7;
            vertical-align: middle;
          }
          .product-img {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #edf2f7;
            background-color: #f7fafc;
          }
          .product-name {
            font-weight: 600;
            color: #2d3748;
            font-size: 14px;
          }
          .product-meta {
            font-size: 12px;
            color: #718096;
            margin-top: 2px;
          }
          .summary-table {
            width: 250px;
            margin-left: auto;
            margin-top: 20px;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 6px 10px;
            font-size: 14px;
          }
          .summary-total {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px !important;
          }
          .card-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }
          .info-card {
            background-color: #f7fafc;
            border: 1px solid #edf2f7;
            border-radius: 8px;
            padding: 16px;
            font-size: 13px;
          }
          .info-card h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #718096;
          }
          .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 50px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .badge-success {
            background-color: #e6f4ea;
            color: #137333;
          }
          .badge-warning {
            background-color: #fef7e0;
            color: #b06000;
          }
          .badge-info {
            background-color: #e8f0fe;
            color: #1a73e8;
          }
          .badge-error {
            background-color: #fce8e6;
            color: #c5221f;
          }
          .button {
            display: inline-block;
            background-color: #111827;
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 8px; /* Slightly sharper border radius for dark theme */
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            margin-top: 20px;
            margin-bottom: 20px;
          }
          .email-footer {
            background-color: #f7fafc;
            padding: 30px 40px;
            text-align: center;
            font-size: 12px;
            color: #718096;
            border-top: 1px solid #edf2f7;
          }
          .email-footer a {
            color: #111827;
            text-decoration: underline;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <img src="cid:pnbazaar-logo" alt="PN Bazaar">
          </div>
          <div class="email-body">
            ${bodyContent}
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} PN Bazaar. All rights reserved.</p>
            <p>Need support? Contact us at <a href="mailto:support@pnbazaar.shop">support@pnbazaar.shop</a></p>
            <p><a href="https://pnbazaar.shop/policies/privacy-policy">Privacy Policy</a> | <a href="https://pnbazaar.shop/policies/terms-conditions">Terms & Conditions</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Generates Product Row HTML
const getProductRows = (items: any[]) => {
  return items
    .map((item) => {
      const product = item.product || item;
      const name = product.name || product.title || "";
      const image = product.image || product.thumbnail || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=100&auto=format&fit=crop";
      const price = product.price || 0;
      const quantity = item.quantity || 1;
      return `
        <tr>
          <td style="width: 60px;">
            <img src="${image}" alt="${name}" class="product-img">
          </td>
          <td>
            <div class="product-name">${name}</div>
            <div class="product-meta">Qty: ${quantity}</div>
          </td>
          <td style="text-align: right; font-weight: 600; color: #2d3748; font-size: 14px;">
            ${formatPrice(price * quantity)}
          </td>
        </tr>
      `;
    })
    .join("");
};

// Helper: Get Estimated Delivery Text (5-6 days)
const getEstimatedDelivery = (orderDate: string) => {
  const base = orderDate ? new Date(orderDate) : new Date();
  let devTime = new Date(base.getTime() + 5 * 24 * 60 * 60 * 1000);
  if (devTime.getDay() === 0) {
    // If Sunday, push to Monday
    devTime = new Date(devTime.getTime() + 1 * 24 * 60 * 60 * 1000);
  }
  return devTime.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper: Format ISO date for display
const formatOrderDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

// Interface order models
export interface OrderEmailPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  shippingAddress: {
    fullName: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: string;
  date: string;
  cancelReason?: string;
  trackingLink?: string;
}

// 1. Send Order Confirmed Email
export async function sendOrderConfirmedEmail(order: OrderEmailPayload) {
  const estDelivery = getEstimatedDelivery(order.date);
  const productsHtml = getProductRows(order.items);

  const html = getEmailWrapper(
    "Order Confirmed - PN Bazaar",
    `
      <div class="badge badge-success">✓ Order Confirmed</div>
      <h2 style="margin-top: 0; color: #1a1a1a;">Thank you for your order, ${order.customerName}!</h2>
      <p style="color: #4a5568; font-size: 15px;">We have received your order and are preparing it for shipment. Below is your order details summary. Your estimated delivery date is <strong>${estDelivery}</strong>.</p>
      
      <div class="section-title">Order Details</div>
      <p style="font-size: 13px; color: #718096; margin-bottom: 20px;">Order Reference: <strong>#${order.orderId}</strong> | Date: ${formatOrderDate(order.date)}</p>
      
      <table class="product-table">
        <thead>
          <tr>
            <th colspan="2">Item Description</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
        </tbody>
      </table>
      
      <table class="summary-table">
        <tr>
          <td>Subtotal:</td>
          <td style="text-align: right; font-weight: 500;">${formatPrice(order.subtotal)}</td>
        </tr>
        <tr>
          <td>Discount:</td>
          <td style="text-align: right; font-weight: 500; ${order.discount > 0 ? "color: #e53e3e;" : "color: #999;"}">${order.discount > 0 ? "-" : ""}${formatPrice(order.discount)}</td>
        </tr>
        <tr>
          <td>Delivery:</td>
          <td style="text-align: right; font-weight: 500;">${order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}</td>
        </tr>
        <tr class="summary-total">
          <td><strong>Total:</strong></td>
          <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
        </tr>
      </table>
      
      <div style="display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap;">
        <div class="info-card" style="flex: 1; min-width: 240px;">
          <h4>Delivery Address</h4>
          <strong>${order.shippingAddress.fullName}</strong><br>
          ${order.shippingAddress.addressLine}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
          Phone: ${order.shippingAddress.phone}
        </div>
        <div class="info-card" style="flex: 1; min-width: 240px;">
          <h4>Payment Mode</h4>
          <span style="text-transform: uppercase; font-weight: 600; color: #4a5568;">${order.paymentMethod.replace("_", " ")}</span>
        </div>
      </div>
    `
  );

  await transporter.sendMail({
    from: `"PN Bazaar" <noreply@pnbazaar.shop>`,
    to: order.customerEmail,
    subject: `Order Confirmed: #${order.orderId} - PN Bazaar`,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: './public/logo.png',
        cid: 'pnbazaar-logo'
      }
    ]
  });
}

// 2. Send Order Shipped Email
export async function sendOrderShippedEmail(order: OrderEmailPayload) {
  const estDelivery = getEstimatedDelivery(order.date);
  const productsHtml = getProductRows(order.items);
  const trackUrl = order.trackingLink || `https://pnbazaar.shop/orders?id=${order.orderId}`;

  const html = getEmailWrapper(
    "Order Dispatched - PN Bazaar",
    `
      <div class="badge badge-info">✈ Order Dispatched</div>
      <h2 style="margin-top: 0; color: #1a1a1a;">Great news! Your package is on its way.</h2>
      <p style="color: #4a5568; font-size: 15px;">Your order has been handed over to our courier partner. You can track your shipment using the link below.</p>
      
      <div style="text-align: center;">
        <a href="${trackUrl}" target="_blank" class="button" style="color: white !important;">Track Your Shipment</a>
      </div>

      <div class="section-title">Estimated Delivery Date</div>
      <p style="font-size: 16px; color: #111827; font-weight: 700; margin-top: 0;">${estDelivery}</p>

      <div class="section-title">Items Dispatched</div>
      <table class="product-table">
        <tbody>
          ${productsHtml}
        </tbody>
      </table>
      
      <div class="info-card" style="margin-top: 20px;">
        <h4>Shipping Details</h4>
        <strong>${order.shippingAddress.fullName}</strong><br>
        ${order.shippingAddress.addressLine}, ${order.shippingAddress.city}, ${order.shippingAddress.pincode}
      </div>
    `
  );

  await transporter.sendMail({
    from: `"PN Bazaar" <noreply@pnbazaar.shop>`,
    to: order.customerEmail,
    subject: `Order Dispatched: #${order.orderId} - PN Bazaar`,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: './public/logo.png',
        cid: 'pnbazaar-logo'
      }
    ]
  });
}

// 3. Send Order Cancelled Email
export async function sendOrderCancelledEmail(order: OrderEmailPayload) {
  const productsHtml = getProductRows(order.items);

  const html = getEmailWrapper(
    "Order Cancelled - PN Bazaar",
    `
      <div class="badge badge-error">✕ Order Cancelled</div>
      <h2 style="margin-top: 0; color: #1a1a1a;">Your order has been cancelled</h2>
      <p style="color: #4a5568; font-size: 15px;">We would like to inform you that your order <strong>#${order.orderId}</strong> has been cancelled.</p>
      
      ${
        order.cancelReason
          ? `<div class="info-card" style="border-left: 4px solid #ef4444; background-color: #fef2f2; margin-bottom: 20px;">
              <h4 style="color: #991b1b;">Reason for Cancellation</h4>
              <p style="margin: 0; font-size: 14px; font-weight: 500; color: #7f1d1d;">${order.cancelReason}</p>
             </div>`
          : ""
      }

      <div class="info-card" style="margin-bottom: 20px;">
        <h4>Refund Status</h4>
        <p style="margin: 0; font-size: 13px;">If you have already paid for this order via UPI/Card, the refund has been initiated and will reflect in your account within 3-5 business days. For cash-on-delivery orders, no transactions were settled.</p>
      </div>

      <div class="section-title">Cancelled Items</div>
      <table class="product-table">
        <tbody>
          ${productsHtml}
        </tbody>
      </table>
    `
  );

  await transporter.sendMail({
    from: `"PN Bazaar" <noreply@pnbazaar.shop>`,
    to: order.customerEmail,
    subject: `Order Cancelled: #${order.orderId} - PN Bazaar`,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: './public/logo.png',
        cid: 'pnbazaar-logo'
      }
    ]
  }  );
}

// 4. Send OTP Email
export async function sendOtpEmail(email: string, otp: string, name: string) {
  const html = getEmailWrapper(
    "Your OTP for Login - PN Bazaar",
    `
      <div class="badge badge-info">🔐 Login Verification</div>
      <h2 style="margin-top: 0; color: #1a1a1a;">Hi ${name},</h2>
      <p style="color: #4a5568; font-size: 15px;">Use the OTP below to verify your email and access your orders.</p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: #f3f4f6; padding: 16px 40px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111827;">
          ${otp}
        </div>
      </div>

      <p style="color: #6b7280; font-size: 13px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    `
  );

  await transporter.sendMail({
    from: `"PN Bazaar" <noreply@pnbazaar.shop>`,
    to: email,
    subject: `Your Login OTP - PN Bazaar`,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: './public/logo.png',
        cid: 'pnbazaar-logo'
      }
    ]
  });
}

// 5. Send Abandoned Cart/Checkout Email
export async function sendAbandonedEmail(
  email: string,
  name: string,
  type: "cart" | "checkout",
  items: any[],
  total: number
) {
  const productsHtml = getProductRows(items);
  const subject = type === "checkout"
    ? "Complete Your Purchase - PN Bazaar"
    : "You Left Something Behind - PN Bazaar";

  const bodyText = type === "checkout"
    ? "We noticed you didn't complete your payment. Your items are still reserved — finish your order now before they run out!"
    : "You have items waiting in your cart. Come back and complete your purchase!";

  const html = getEmailWrapper(
    subject,
    `
      <div class="badge badge-warning">${type === "checkout" ? "Payment Pending" : "Items Waiting"}</div>
      <h2 style="margin-top: 0; color: #1a1a1a;">Hey ${name}, don't miss out!</h2>
      <p style="color: #4a5568; font-size: 15px;">${bodyText}</p>
      
      <div class="section-title">Items in your ${type === "checkout" ? "order" : "cart"}</div>
      <table class="product-table">
        <thead>
          <tr>
            <th colspan="2">Item Description</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
        </tbody>
      </table>
      
      <table class="summary-table">
        <tr class="summary-total">
          <td><strong>Total:</strong></td>
          <td style="text-align: right;"><strong>${formatPrice(total)}</strong></td>
        </tr>
      </table>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://pnbazaar.shop/cart" class="button" style="color: white !important;">Return to Cart</a>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 16px;">
        You received this email because you visited PN Bazaar. If you have already completed your purchase, please ignore this email.
      </p>
    `
  );

  await transporter.sendMail({
    from: `"PN Bazaar" <noreply@pnbazaar.shop>`,
    to: email,
    subject,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: './public/logo.png',
        cid: 'pnbazaar-logo'
      }
    ]
  });
}

// 6. Send Order Delivered Email
export async function sendOrderDeliveredEmail(order: OrderEmailPayload) {
  const productsHtml = getProductRows(order.items);

  const html = getEmailWrapper(
    "Order Delivered - PN Bazaar",
    `
      <div class="badge badge-success">✓ Delivered</div>
      <h2 style="margin-top: 0; color: #1a1a1a;">Delivered! Your package has arrived.</h2>
      
      <!-- Celebratory Illustration Avatar placeholder structure -->
      <div style="text-align: center; margin: 20px 0;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>

      <p style="color: #4a5568; font-size: 15px; text-align: center;">We hope you enjoy your new essentials! If you have any feedback or want to request a replacement, our returns portal is open for 30 days.</p>
      
      <div style="text-align: center;">
        <a href="https://pnbazaar.shop/orders?id=${order.orderId}" class="button" style="color: white !important;">Rate & Review Items</a>
      </div>

      <div class="section-title">Delivery Details</div>
      <table class="product-table">
        <tbody>
          ${productsHtml}
        </tbody>
      </table>
      
      <div class="info-card">
        <h4>Receipt Summary</h4>
        <p style="margin: 0;">Total Paid: <strong>${formatPrice(order.total)}</strong> via ${order.paymentMethod.toUpperCase().replace("_", " ")}</p>
      </div>
    `
  );

  await transporter.sendMail({
    from: `"PN Bazaar" <noreply@pnbazaar.shop>`,
    to: order.customerEmail,
    subject: `Order Delivered: #${order.orderId} - PN Bazaar`,
    html,
    attachments: [
      {
        filename: 'logo.png',
        path: './public/logo.png',
        cid: 'pnbazaar-logo'
      }
    ]
  });
}
