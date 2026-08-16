// app/api/homepage-highlights/route.js
//
// Powers three new AI-curated sections on the homepage (see
// public/legacy/js/homepage-highlights.js), inserted just above the
// "EcoVillage Live Updates" news section:
//
//   1. seasonalPicks  — "Best places to visit this season" (Accordion Gallery)
//   2. realityChecks  — "Real vs Reality" expectation/honesty pairs (Circular Gallery)
//   3. planYourVisit  — "Plan your visit" best-time-to-go cards (Depth Carousel)
//
// Honesty note on scope: there's no paid image-generation API configured in
// this project (no OpenAI/Stability key). Two of the three sections
// (seasonalPicks, planYourVisit) use real photography pulled live from
// Wikipedia/Wikimedia (same free, no-key approach as place-image/
// place-gallery) — deliberately real, since these are travel
// recommendations, not a place to show AI hallucinations. The third section
// (realityChecks) genuinely DOES use AI-generated images for its
// "expectation" side, via Pollinations.ai — a free, keyless text-to-image
// API — paired against the real Wikipedia photo for "reality".
// Groq (already used elsewhere in this app) writes all the copy in one
// structured call. If GROQ_API_KEY isn't set, falls back to hand-written
// copy so the sections still work either way.

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { fetchPlaceImage } from "@/lib/wikiImage";
import destinations from "@/data/destinations.json";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Without this, Next.js treats a plain GET route handler as static and
// prerenders it ONCE at build time — freezing "season" and the AI content
// forever until the next deployment, and making the in-memory cache below
// pointless. force-dynamic makes it a real per-request serverless function,
// so the 6h cache actually does its job (fresh content, but not on every
// single visit).
export const dynamic = "force-dynamic";

// Simple in-memory cache — survives while the serverless function stays warm.
// Avoids re-calling Groq + ~15 Wikipedia lookups on every homepage visit.
let cache = { data: null, ts: 0 };
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 hours

function currentSeason() {
  const month = new Date().getMonth(); // 0=Jan
  if (month <= 1 || month === 11) return "Winter";
  if (month >= 2 && month <= 4) return "Summer";
  if (month >= 5 && month <= 8) return "Monsoon";
  return "Autumn";
}

function allPlaces() {
  const out = [];
  for (const cat of destinations.categories || []) {
    for (const p of cat.places || []) {
      out.push({ name: p.title, tag: p.tag, category: cat.title });
    }
  }
  return out;
}

export async function GET() {
  try {
    if (cache.data && Date.now() - cache.ts < CACHE_MS) {
      return NextResponse.json({ success: true, ...cache.data, cached: true });
    }

    const season = currentSeason();
    const places = allPlaces();
    const content = groq ? await generateWithGroq(places, season) : fallbackContent(places, season);

    const withImages = await attachImages(content);
    cache = { data: { ...withImages, season }, ts: Date.now() };

    return NextResponse.json({ success: true, ...withImages, season, cached: false });
  } catch (err) {
    console.error("[homepage-highlights] failed:", err);
    // Fall back to hand-written content rather than showing nothing.
    const season = currentSeason();
    const content = fallbackContent(allPlaces(), season);
    const withImages = await attachImages(content).catch(() => content);
    return NextResponse.json({ success: true, ...withImages, season, source: "fallback-error" });
  }
}

async function generateWithGroq(places, season) {
  const placeList = places.map((p) => `${p.name} (${p.tag}, ${p.category})`).join("\n");

  const systemPrompt = `You are the travel curator for EcoVillage Trails, a community-run eco-tourism platform in India.
You will be given a fixed list of real destinations already on the platform. Only use place names EXACTLY as given — never invent new places.
Respond with STRICT JSON only, no markdown fences, no commentary, matching this exact shape:
{
  "seasonalPicks": [ { "name": "string (exact from list)", "blurb": "one punchy sentence, under 18 words, on why it's great to visit right now" } ],
  "realityChecks": [ { "name": "string (exact from list)", "expectation": "one short phrase, Instagram-caption style, under 10 words", "reality": "one short, honest, slightly funny phrase, under 14 words" } ],
  "planYourVisit": [ { "name": "string (exact from list)", "bestTime": "short season/month range, under 6 words", "tip": "one practical planning tip, under 16 words" } ]
}
Rules:
- seasonalPicks: exactly 10 items, varied across categories, framed for ${season} in India.
- realityChecks: exactly 6 items. "expectation" is the glossy social-media version; "reality" is warm and honest, not mean — think gentle, funny truth, not a complaint.
- planYourVisit: exactly 8 items, different from the realityChecks picks where possible.
- No two lists should be identical in place selection if avoidable.
- Do not mention that you are an AI.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.85,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Destinations:\n${placeList}\n\nCurrent season: ${season}. Generate the JSON now.` },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  const parsed = JSON.parse(raw);

  // Guard against a malformed/partial response — validate shape, else fall back.
  if (
    !Array.isArray(parsed.seasonalPicks) ||
    !Array.isArray(parsed.realityChecks) ||
    !Array.isArray(parsed.planYourVisit)
  ) {
    throw new Error("Malformed Groq response shape");
  }

  return {
    seasonalPicks: parsed.seasonalPicks.slice(0, 10),
    realityChecks: parsed.realityChecks.slice(0, 6),
    planYourVisit: parsed.planYourVisit.slice(0, 8),
    source: "ai",
  };
}

function fallbackContent(places, season) {
  const pick = (n, offset = 0) =>
    Array.from({ length: n }, (_, i) => places[(i + offset) % places.length]);

  return {
    seasonalPicks: pick(10, 0).map((p) => ({
      name: p.name,
      blurb: `${p.tag} — a favourite for ${season.toLowerCase()} travel.`,
    })),
    realityChecks: pick(6, 4).map((p) => ({
      name: p.name,
      expectation: `Postcard-perfect ${p.name} 📸`,
      reality: `Still stunning — just bring layers and patience for the last stretch of road.`,
    })),
    planYourVisit: pick(8, 10).map((p) => ({
      name: p.name,
      bestTime: season,
      tip: `Best enjoyed slowly — plan at least two nights with a local host family.`,
    })),
    source: "fallback",
  };
}

async function attachImages(content) {
  const allNames = [
    ...content.seasonalPicks.map((x) => x.name),
    ...content.realityChecks.map((x) => x.name),
    ...content.planYourVisit.map((x) => x.name),
  ];
  const uniqueNames = [...new Set(allNames)];

  const imageEntries = await Promise.all(
    uniqueNames.map(async (name) => [name, (await fetchPlaceImage(`${name}, India`)) || (await fetchPlaceImage(name))])
  );
  const imageMap = Object.fromEntries(imageEntries);

  const withImage = (arr) => arr.map((item) => ({ ...item, image: imageMap[item.name] || null }));

  // "Real vs Reality" pairs a real Wikipedia photo with a genuinely
  // AI-generated dreamy/idealized image for the same place — via
  // Pollinations.ai, a free, keyless text-to-image API (no signup, no
  // secret needed). This is real image generation, not a second stock
  // photo — the URL itself IS the generated image (Pollinations renders
  // on request), so no extra fetch/upload step is needed here.
  const realityChecksWithBoth = content.realityChecks.map((item) => {
    const prompt = encodeURIComponent(
      `dreamy idealized travel poster of ${item.name} India, golden hour, vibrant saturated colours, ` +
        `wide angle, professional travel photography style, no text, no watermark`
    );
    // Fixed seed per place so the "expectation" image stays stable across
    // repeat homepage loads within the 6h cache window, rather than
    // re-rolling a different image every request.
    const seed = Math.abs(hashCode(item.name));
    return {
      ...item,
      image: imageMap[item.name] || null, // "reality" = real photo
      aiImage: `https://image.pollinations.ai/prompt/${prompt}?width=640&height=640&seed=${seed}&nologo=true`, // "expectation" = AI-generated
    };
  });

  return {
    seasonalPicks: withImage(content.seasonalPicks),
    realityChecks: realityChecksWithBoth,
    planYourVisit: withImage(content.planYourVisit),
    source: content.source,
  };
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
