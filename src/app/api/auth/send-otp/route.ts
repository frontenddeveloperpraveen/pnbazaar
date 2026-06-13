import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { sendOtpEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const db = await getDatabase();
    const collection = db.collection("otp_requests");

    await collection.deleteMany({ email });
    await collection.insertOne({ email, otp, name, expiresAt, createdAt: new Date() });

    await sendOtpEmail(email, otp, name);

    return NextResponse.json({ success: true, message: "OTP sent to email" });
  } catch (error: any) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
