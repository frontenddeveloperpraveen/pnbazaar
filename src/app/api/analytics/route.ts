import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("analytics");

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

