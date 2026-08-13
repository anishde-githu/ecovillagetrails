// app/api/calendar-ai/route.js
// Ported from api/calendar-ai.js — logic unchanged, just adapted to a Route Handler.

import { NextResponse } from "next/server";
import { generateTravelReport } from "@/lib/groqCalendar";

export async function POST(request) {
  try {
    const { date, eventName, location, eventType } = await request.json();

    if (!date || !eventName || !location) {
      return NextResponse.json(
        { success: false, error: "date, eventName, and location are required fields." },
        { status: 400 }
      );
    }

    const data = await generateTravelReport({ date, eventName, location, eventType });

    return NextResponse.json({ success: true, date, eventName, location, data });
  } catch (err) {
    console.error("[api/calendar-ai] error:", err.message);
    return NextResponse.json(
      { success: false, error: "Something went wrong while generating your travel insights. Please try again." },
      { status: 500 }
    );
  }
}
