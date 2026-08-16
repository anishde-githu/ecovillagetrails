// lib/wikiImage.js
// Free, no-API-key real photo lookup via Wikipedia/Wikimedia — shared by
// app/api/place-image/route.js and app/api/homepage-highlights/route.js.
// Route files in the App Router can only export HTTP method handlers, so
// this logic lives here instead of being re-exported from a route.

const UA = "EcoVillageTrails/1.0 (https://ecovillagetrails.vercel.app)";

export async function fetchSummaryImage(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.type === "disambiguation") return null;
    return data.originalimage?.source || data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

export async function searchBestTitle(name) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      name
    )}&srlimit=1&format=json&origin=*`;
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const data = await r.json();
    const hit = data?.query?.search?.[0];
    return hit ? hit.title : null;
  } catch {
    return null;
  }
}

/** Real photo for a place name, e.g. "Chitkul, Himachal Pradesh" helps disambiguate. */
export async function fetchPlaceImage(name) {
  let image = await fetchSummaryImage(name);
  if (!image) {
    const bestTitle = await searchBestTitle(name);
    if (bestTitle) image = await fetchSummaryImage(bestTitle);
  }
  return image;
}
