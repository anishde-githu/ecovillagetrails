// app/api/place-image/route.js
// Real photo lookup for a place name via Wikipedia (free, no API key).
// Shared fetch logic lives in lib/wikiImage.js (also used by
// app/api/homepage-highlights/route.js).

import { NextResponse } from "next/server";
import { fetchPlaceImage } from "@/lib/wikiImage";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ success: false, error: "Missing place name." }, { status: 400 });
  }

  try {
    const image = await fetchPlaceImage(name);
    if (image) {
      return NextResponse.json({ success: true, image });
    }
    return NextResponse.json({ success: false });
  } catch (err) {
    console.error("place-image error:", err);
    return NextResponse.json({ success: false });
  }
}
