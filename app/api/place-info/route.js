// app/api/place-info/route.js
// Ported from api/place-info.js — unchanged logic, POST with mode "detail" | "suggest".

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function POST(request) {
  if (!groq) {
    return NextResponse.json(
      { success: false, error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { mode } = body || {};

  try {
    if (mode === "suggest") {
      return await handleSuggest(body);
    }
    return await handleDetail(body);
  } catch (err) {
    console.error("place-info error:", err);
    return NextResponse.json({ success: false, error: "AI request failed." }, { status: 500 });
  }
}

async function handleDetail(body) {
  const { name, tag, category } = body || {};
  if (!name) {
    return NextResponse.json({ success: false, error: "Missing place name." }, { status: 400 });
  }

  const systemPrompt = `You are a travel writer for EcoVillage, a site about offbeat Indian destinations.
Write a short travel report about the place given by the user, in the same spirit as a trip-planning app.
Respond ONLY with a JSON object shaped exactly like this — no markdown, no commentary, no code fences:
{
  "overview": "2-3 sentence evocative but factual description of the place",
  "bestSeason": "short best time to visit, e.g. 'October to April'",
  "howToReach": "one short sentence on how travellers typically get there",
  "highlights": ["3 to 4 short highlight phrases, each under 5 words"],
  "itinerary": ["2 to 3 short day-plan lines, each starting with 'Day 1:', 'Day 2:' etc"],
  "thingsToDo": ["3 short activity suggestions, each under 8 words"],
  "foodTip": "one sentence about a local dish or food experience worth trying",
  "sustainabilityTip": "one sentence on how to visit responsibly / support the local community"
}`;

  const userPrompt = `Place: ${name}\nTheme/tag: ${tag || ""}\nCategory: ${category || ""}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.6,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return NextResponse.json({
    success: true,
    name,
    overview: parsed.overview || "",
    description: parsed.overview || "",
    bestSeason: parsed.bestSeason || "",
    howToReach: parsed.howToReach || "",
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 4) : [],
    itinerary: Array.isArray(parsed.itinerary) ? parsed.itinerary.slice(0, 3) : [],
    thingsToDo: Array.isArray(parsed.thingsToDo) ? parsed.thingsToDo.slice(0, 3) : [],
    foodTip: parsed.foodTip || "",
    sustainabilityTip: parsed.sustainabilityTip || "",
  });
}

async function handleSuggest(body) {
  const { category, exclude } = body || {};
  if (!category) {
    return NextResponse.json({ success: false, error: "Missing category." }, { status: 400 });
  }
  const excludeList = Array.isArray(exclude) ? exclude : [];

  const systemPrompt = `You are a travel researcher for EcoVillage, a site about offbeat Indian destinations.
The user will give you a theme/category and a list of places already featured. Suggest 3 NEW real Indian places
in that same theme that are NOT in the excluded list and are genuinely offbeat (avoid extremely famous tourist spots).
Respond ONLY with a JSON object shaped exactly like:
{
  "places": [
    { "name": "Place Name", "tag": "short 2-5 word theme tag", "oneLiner": "one enticing sentence, under 20 words" }
  ]
}
Exactly 3 entries. No markdown, no commentary, no code fences — JSON only.`;

  const userPrompt = `Category: ${category}\nAlready featured (do not repeat these): ${excludeList.join(", ") || "none"}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  const places = Array.isArray(parsed.places) ? parsed.places.slice(0, 3) : [];
  return NextResponse.json({ success: true, places });
}
