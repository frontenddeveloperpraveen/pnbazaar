import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { sendAbandonedEmail } from "../../../../lib/email";
import { checkRateLimit, getGenericError } from "../../../../lib/security";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit("send-email:" + (request.headers.get("x-forwarded-for") || "unknown"), 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await request.json();
    const { visitorId, email, type } = body;

    if (!visitorId || !email || !type) {
      return NextResponse.json({ error: "visitorId, email, and type required" }, { status: 400 });
    }

    const db = await getDatabase();
    const session = await db.collection("sessions").findOne({ visitorId });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const name = session.checkoutData?.billingName || session.checkoutData?.name || "there";
    const items = session.items || [];
    const total = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);

    await sendAbandonedEmail(email, name, type, items, total);

    // Log the email in followUpLogs
    const logs = session.followUpLogs || [];
    logs.push({
      type: "email",
      sentAt: new Date().toISOString(),
      message: `Abandoned ${type} email sent to ${email}`,
    });

    await db.collection("sessions").updateOne(
      { visitorId },
      { $set: { followUpLogs: logs, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
