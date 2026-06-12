import { NextResponse } from "next/server";
import { signJwt, verifyJwt } from "../../../../lib/jwt";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@pnbazaar.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "adminpassword123";
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || "jwt_admin_super_secret_key_123456";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create short-lived access token (1 hour)
      const accessToken = signJwt({ role: "admin", email }, JWT_ADMIN_SECRET, 3600);
      
      // Create extremely long-lived refresh token (100 years to represent "forever")
      const refreshToken = signJwt({ role: "admin", email }, JWT_ADMIN_SECRET, 3153600000);

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const refreshHeader = request.headers.get("x-refresh-token");

    // Case 1: Client sends refresh token to obtain a new access token
    if (refreshHeader) {
      const decoded = verifyJwt(refreshHeader, JWT_ADMIN_SECRET);
      if (decoded && decoded.role === "admin") {
        const newAccessToken = signJwt({ role: "admin", email: decoded.email }, JWT_ADMIN_SECRET, 3600);
        const newRefreshToken = signJwt({ role: "admin", email: decoded.email }, JWT_ADMIN_SECRET, 3153600000);
        
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
      const decoded = verifyJwt(token, JWT_ADMIN_SECRET);
      if (decoded && decoded.role === "admin") {
        return NextResponse.json({ success: true, verified: true });
      }
    }

    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
