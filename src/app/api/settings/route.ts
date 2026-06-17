import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { verifyAdminAuth, checkRateLimit, checkOrigin, getGenericError } from "../../../lib/security";

export async function GET() {
  if (!checkRateLimit("settings-get:" + "global", 30, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const db = await getDatabase();
    const settings = await db.collection("settings").findOne({ key: "payment_config" });
    return NextResponse.json({
      prepaidEnabled: settings?.value?.prepaidEnabled ?? true,
    });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkRateLimit("settings:" + (request.headers.get("x-forwarded-for") || "unknown"), 10, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const { prepaidEnabled } = body;

    if (typeof prepaidEnabled !== "boolean") {
      return NextResponse.json({ error: "prepaidEnabled must be a boolean" }, { status: 400 });
    }

    const db = await getDatabase();
    await db.collection("settings").updateOne(
      { key: "payment_config" },
      { $set: { value: { prepaidEnabled }, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, prepaidEnabled });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
