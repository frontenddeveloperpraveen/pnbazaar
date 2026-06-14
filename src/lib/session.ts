"use client";

const VISITOR_KEY = "pn_visitor_id";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function clearVisitorId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(VISITOR_KEY);
  }
}

export interface SessionItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface SessionCheckoutData {
  name?: string;
  email?: string;
  phone?: string;
  billingName?: string;
  billingEmail?: string;
  billingPhone?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingLandmark?: string;
  billingState?: string;
  billingCity?: string;
  billingPincode?: string;
  shippingName?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingLandmark?: string;
  shippingState?: string;
  shippingCity?: string;
  shippingPincode?: string;
  sameAsBilling?: boolean;
  giftWrap?: boolean;
  giftNote?: string;
}

export interface Session {
  _id?: string;
  visitorId: string;
  items: SessionItem[];
  checkoutData: SessionCheckoutData | null;
  orderId?: string | null;
  lat?: number | null;
  lng?: number | null;
  ipLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
  followUpLogs?: { type: string; sentAt: string; message: string }[];
}

export async function upsertSession(data: Partial<Session>): Promise<Session | null> {
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function updateSession(visitorId: string, updates: Partial<Session>): Promise<boolean> {
  try {
    const res = await fetch("/api/sessions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, ...updates }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
