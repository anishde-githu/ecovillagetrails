// app/api/place-image/route.js
// Ported from api/place-image.js — unchanged logic.

import { NextResponse } from "next/server";

const UA = "EcoVillageTrails/1.0 (https://ecovillagetrails.vercel.app)";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ success: false, error: "Missing place name." }, { status: 400 });
  }

  try {
    let image = await fetchSummaryImage(name);

    if (!image) {
      const bestTitle = await searchBestTitle(name);
      if (bestTitle) image = await fetchSummaryImage(bestTitle);
    }

    if (image) {
      return NextResponse.json({ success: true, image });
    }
    return NextResponse.json({ success: false });
  } catch (err) {
    console.error("place-image error:", err);
    return NextResponse.json({ success: false });
  }
}

async function fetchSummaryImage(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const data = await r.json();
  if (data.type === "disambiguation") return null;
  const src = data.originalimage?.source || data.thumbnail?.source;
  return src || null;
}

async function searchBestTitle(name) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    name
  )}&srlimit=1&format=json&origin=*`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const data = await r.json();
  const hit = data?.query?.search?.[0];
  return hit ? hit.title : null;
}
