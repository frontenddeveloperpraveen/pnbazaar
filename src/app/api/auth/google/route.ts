import { NextResponse } from "next/server";
import { signJwt } from "../../../../lib/jwt";
import { getGenericError } from "../../../../lib/security";

const JWT_SECRET = process.env.JWT_ADMIN_SECRET || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

export async function POST(request: Request) {
  try {
    if (!JWT_SECRET || !GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Server configuration incomplete" }, { status: 500 });
    }
    const { credential } = await request.json();
    if (!credential) {
      return NextResponse.json({ error: "Google credential is required" }, { status: 400 });
    }

    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!resp.ok) {
      return NextResponse.json({ error: "Invalid Google credential" }, { status: 401 });
    }

    const payload = await resp.json();

    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Token audience mismatch" }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || email.split("@")[0];

    if (!email) {
      return NextResponse.json({ error: "Email not provided by Google" }, { status: 400 });
    }

    const token = signJwt({ email, name }, JWT_SECRET, 86400);

    return NextResponse.json({ success: true, token, email, name });
  } catch (error: any) {
    return NextResponse.json(getGenericError(), { status: 500 });
  }
}
