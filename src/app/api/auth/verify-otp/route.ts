import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb";
import { signJwt } from "../../../../lib/jwt";

const JWT_SECRET = process.env.JWT_ADMIN_SECRET || "jwt_admin_super_secret_key_123456";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection("otp_requests");

    const record = await collection.findOne({ email, otp });

    if (!record) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    if (new Date(record.expiresAt) < new Date()) {
      await collection.deleteOne({ _id: record._id });
      return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
    }

    await collection.deleteOne({ _id: record._id });

    const token = signJwt({ email, name: record.name }, JWT_SECRET, 86400);

    return NextResponse.json({ success: true, token, email, name: record.name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
