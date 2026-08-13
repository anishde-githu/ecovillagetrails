// app/api/place-gallery/route.js
// Ported from api/place-gallery.js — unchanged logic, GET with ?name= query.

import { NextResponse } from "next/server";

const UA = "EcoVillageTrails/1.0 (https://ecovillagetrails.vercel.app)";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ success: false, error: "Missing place name." }, { status: 400 });
  }

  try {
    const categoryTitle = await findBestCategory(name);
    let images = [];

    if (categoryTitle) {
      images = await imagesInCategory(categoryTitle, 40);
    }

    if (images.length < 4) {
      const searched = await searchImages(name, 24);
      images = dedupe([...images, ...searched]);
    }

    return NextResponse.json({ success: true, images: images.slice(0, 40) });
  } catch (err) {
    console.error("place-gallery error:", err);
    return NextResponse.json({ success: true, images: [] });
  }
}

async function findBestCategory(name) {
  const url =
    `${COMMONS_API}?action=query&list=search&srnamespace=14` +
    `&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return null;
  const data = await r.json();
  const hit = data?.query?.search?.[0];
  return hit ? hit.title : null;
}

async function imagesInCategory(categoryTitle, limit) {
  const url =
    `${COMMONS_API}?action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(categoryTitle)}` +
    `&gcmtype=file&gcmlimit=${limit}&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json&origin=*`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  const data = await r.json();
  const pages = data?.query?.pages || {};
  return Object.values(pages)
    .map((p) => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url)
    .filter((u) => u && isPhoto(u));
}

async function searchImages(name, limit) {
  const url =
    `${COMMONS_API}?action=query&generator=search&gsrnamespace=6` +
    `&gsrsearch=${encodeURIComponent(name)}&gsrlimit=${limit}` +
    `&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json&origin=*`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) return [];
  const data = await r.json();
  const pages = data?.query?.pages || {};
  return Object.values(pages)
    .map((p) => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url)
    .filter((u) => u && isPhoto(u));
}

function isPhoto(url) {
  return /\.(jpe?g|png)$/i.test(url.split("?")[0]);
}

function dedupe(arr) {
  return [...new Set(arr)];
}
