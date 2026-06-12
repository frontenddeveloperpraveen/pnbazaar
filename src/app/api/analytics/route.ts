import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("analytics");

    // Seed default analytics data if empty to ensure dashboard has beautiful initial visual data
    const count = await collection.countDocuments();
    if (count === 0) {
      const seedEvents = [
        { type: "pageview", page: "/", location: "Delhi", timestamp: new Date(Date.now() - 3600000 * 2), buttonText: "", sessionId: "sess_seed_1", duration: 12 },
        { type: "pageview", page: "/product/classic-minimalist-backpack", location: "Maharashtra", timestamp: new Date(Date.now() - 3600000 * 1.8), buttonText: "", sessionId: "sess_seed_2", duration: 45 },
        { type: "click", page: "/product/classic-minimalist-backpack", location: "Maharashtra", timestamp: new Date(Date.now() - 3600000 * 1.7), buttonText: "Add to Cart: Classic Minimalist Backpack (Qty: 1)", sessionId: "sess_seed_2", duration: 0 },
        { type: "pageview", page: "/cart", location: "Maharashtra", timestamp: new Date(Date.now() - 3600000 * 1.6), buttonText: "", sessionId: "sess_seed_2", duration: 15 },
        { type: "click", page: "/cart", location: "Maharashtra", timestamp: new Date(Date.now() - 3600000 * 1.5), buttonText: "Apply Coupon: WELCOME10", sessionId: "sess_seed_2", duration: 0 },
        { type: "click", page: "/cart", location: "Maharashtra", timestamp: new Date(Date.now() - 3600000 * 1.4), buttonText: "Checkout Success: Order ₹4200", sessionId: "sess_seed_2", duration: 0 },
        { type: "pageview", page: "/", location: "Karnataka", timestamp: new Date(Date.now() - 3600000 * 1.2), buttonText: "", sessionId: "sess_seed_3", duration: 8 },
        { type: "pageview", page: "/product/insulated-tumbler", location: "Karnataka", timestamp: new Date(Date.now() - 3600000 * 1.1), buttonText: "", sessionId: "sess_seed_3", duration: 32 },
        { type: "pageview", page: "/product/matte-ceramic-mugs", location: "Delhi", timestamp: new Date(Date.now() - 3000000), buttonText: "", sessionId: "sess_seed_4", duration: 19 },
        { type: "click", page: "/product/matte-ceramic-mugs", location: "Delhi", timestamp: new Date(Date.now() - 2800000), buttonText: "Add to Cart: Matte Ceramic Mugs (Qty: 2)", sessionId: "sess_seed_4", duration: 0 },
        { type: "pageview", page: "/product/classic-minimalist-backpack", location: "Tamil Nadu", timestamp: new Date(Date.now() - 1800000), buttonText: "", sessionId: "sess_seed_5", duration: 25 },
        { type: "click", page: "/product/classic-minimalist-backpack", location: "Tamil Nadu", timestamp: new Date(Date.now() - 1700000), buttonText: "Add to Cart: Classic Minimalist Backpack (Qty: 1)", sessionId: "sess_seed_5", duration: 0 }
      ];
      await collection.insertMany(seedEvents);
    }

    const events = await collection.find({}).sort({ timestamp: -1 }).limit(200).toArray();

    // Perform overall aggregations
    const totalViews = await collection.countDocuments({ type: "pageview" });
    const totalClicks = await collection.countDocuments({ type: "click" });

    // Page views aggregation
    const pageViewsGroup = await collection.aggregate([
      { $match: { type: "pageview" } },
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Button clicks aggregation
    const buttonClicksGroup = await collection.aggregate([
      { $match: { type: "click" } },
      { $group: { _id: "$buttonText", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Area/Location aggregation
    const locationsGroup = await collection.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Dwell times aggregation
    const dwellTimesGroup = await collection.aggregate([
      { $match: { type: "dwell" } },
      { $group: { _id: "$page", avgDuration: { $avg: "$duration" }, count: { $sum: 1 } } },
      { $sort: { avgDuration: -1 } }
    ]).toArray();

    // Group events by sessionId for Clickstream Timelines
    const sessionsMap: { [key: string]: { sessionId: string; location: string; timestamp: string; events: any[] } } = {};
    const chronologicalEvents = [...events].reverse();

    chronologicalEvents.forEach(e => {
      const sessId = e.sessionId || "anonymous";
      if (!sessionsMap[sessId]) {
        sessionsMap[sessId] = {
          sessionId: sessId,
          location: e.location || "Delhi",
          timestamp: new Date(e.timestamp).toISOString(),
          events: []
        };
      }
      sessionsMap[sessId].events.push({
        type: e.type,
        page: e.page,
        buttonText: e.buttonText || "",
        duration: e.duration || 0,
        timestamp: new Date(e.timestamp).toISOString()
      });
      if (new Date(e.timestamp) < new Date(sessionsMap[sessId].timestamp)) {
        sessionsMap[sessId].timestamp = new Date(e.timestamp).toISOString();
      }
    });

    const clickstreams = Object.values(sessionsMap).sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const formattedEvents = events.map(e => {
      const { _id, ...rest } = e;
      return { ...rest };
    });

    return NextResponse.json({
      totalViews,
      totalClicks,
      events: formattedEvents,
      pageViews: pageViewsGroup,
      buttonClicks: buttonClicksGroup,
      locations: locationsGroup,
      dwellTimes: dwellTimesGroup,
      clickstreams
    });
  } catch (error: any) {
    console.error("GET analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDatabase();
    const collection = db.collection("analytics");
    const body = await request.json();

    const newEvent = {
      type: body.type || "pageview",
      page: body.page || "/",
      location: body.location || "Delhi",
      buttonText: body.buttonText || "",
      sessionId: body.sessionId || "anonymous",
      duration: body.duration ? parseInt(body.duration, 10) : 0,
      timestamp: new Date()
    };

    await collection.insertOne(newEvent);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("POST analytics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

