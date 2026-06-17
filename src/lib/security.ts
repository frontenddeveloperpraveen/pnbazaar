import crypto from "crypto";
import { verifyJwt } from "./jwt";

export function secureToken(length = 20) {
  return crypto.randomBytes(Math.ceil(length * 3 / 4)).toString("base64url").slice(0, length);
}

export function secureOrderId() {
  return "ORD-" + crypto.randomBytes(5).toString("hex").toUpperCase();
}

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

export function verifyAdminAuth(request: Request): boolean {
  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret) return false;

  // Check x-admin-token header first (used by admin client)
  const token = request.headers.get("x-admin-token");
  if (token) {
    const payload = verifyJwt(token, secret);
    if (payload && payload.role === "admin") return true;
  }

  // Check Authorization: Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = verifyJwt(authHeader.slice(7), secret);
    if (payload && payload.role === "admin") return true;
  }

  return false;
}

export function checkOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) return false;
  const allowedDomains = ["pnbazaar.shop", "localhost:3000", "192.168.29.104:3000"];
  const check = (url: string | null) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return allowedDomains.some(d => u.host === d || u.host.endsWith("." + d));
    } catch {
      return false;
    }
  };
  return check(origin) || check(referer);
}

export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function getGenericError() {
  return { error: "An error occurred. Please try again later." };
}
