// app/api/travel-options/route.js
// Ported from api/travel-options.js — unchanged logic.

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function POST(request) {
  if (!groq) {
    return NextResponse.json({ success: false, error: "GROQ_API_KEY is not configured." }, { status: 500 });
  }

  const { place, region } = await request.json().catch(() => ({}));
  if (!place) {
    return NextResponse.json({ success: false, error: "Missing place name." }, { status: 400 });
  }

  const systemPrompt = `You are a travel-logistics assistant for EcoVillage, an Indian offbeat-travel site.
Give GENERAL guidance on reaching the named place. Do NOT invent specific train numbers, flight numbers,
exact departure times, or exact prices — those change constantly and must come from live booking sites, not you.
Respond ONLY with a JSON object shaped exactly like this — no markdown, no commentary, no code fences:
{
  "nearestRailwayStation": "name of nearest major railway station and approx distance, e.g. 'Kolkata (120 km)'",
  "nearestAirport": "name of nearest airport and approx distance",
  "nearestBusHub": "name of nearest major bus terminus/town and approx distance",
  "trainGuidance": "1-2 sentences on typical train connectivity, in general terms, no specific train numbers/times",
  "busGuidance": "1-2 sentences on typical bus/road connectivity, in general terms",
  "flightGuidance": "1-2 sentences on typical flight connectivity, in general terms",
  "roadRoute": "1 sentence on the typical driving route from the nearest major city"
}`;

  const userPrompt = `Place: ${place}\nRegion/state: ${region || ""}`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json({ success: true, ...parsed });
  } catch (err) {
    console.error("travel-options error:", err);
    return NextResponse.json({ success: false, error: "AI request failed." }, { status: 500 });
  }
}
