import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const settings = await db.collection("settings").findOne({ key: "payment_config" });
    return NextResponse.json({
      prepaidEnabled: settings?.value?.prepaidEnabled ?? true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
