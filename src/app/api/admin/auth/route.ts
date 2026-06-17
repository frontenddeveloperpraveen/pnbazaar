import { NextResponse } from "next/server";
import { signJwt, verifyJwt } from "../../../../lib/jwt";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;

export async function POST(request: Request) {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !JWT_ADMIN_SECRET) {
      return NextResponse.json({ error: "Server configuration incomplete" }, { status: 500 });
    }
    const secret = JWT_ADMIN_SECRET;

    const { email, password } = await request.json();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const accessToken = signJwt({ role: "admin", email }, secret, 3600);
      const refreshToken = signJwt({ role: "admin", email }, secret, 604800);

      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid admin credentials." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const refreshHeader = request.headers.get("x-refresh-token");

    // Case 1: Client sends refresh token to obtain a new access token
    if (!JWT_ADMIN_SECRET) {
      return NextResponse.json({ error: "Server configuration incomplete" }, { status: 500 });
    }
    const secret = JWT_ADMIN_SECRET;
    if (refreshHeader) {
      const decoded = verifyJwt(refreshHeader, secret);
      if (decoded && decoded.role === "admin") {
        const newAccessToken = signJwt({ role: "admin", email: decoded.email }, secret, 3600);
        const newRefreshToken = signJwt({ role: "admin", email: decoded.email }, secret, 604800);
        
        return NextResponse.json({
          success: true,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        });
      }
      return NextResponse.json({ success: false, error: "Invalid refresh token." }, { status: 401 });
    }

    // Case 2: Client simply validates current access token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyJwt(token, secret);
      if (decoded && decoded.role === "admin") {
        return NextResponse.json({ success: true, verified: true });
      }
    }

    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
