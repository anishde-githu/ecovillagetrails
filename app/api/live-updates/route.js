// app/api/live-updates/route.js
// Ported from api/live-updates.js — same news-fetch + Groq classification
// logic, adapted from (req,res) to a Route Handler. See original file's
// comments (preserved below) for the /tmp caching caveat on serverless.

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // never statically cache this route

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const TMP_CACHE_PATH = path.join("/tmp", "ecovillage-live-updates.json");
const SEED_PATH = path.join(process.cwd(), "data", "liveUpdates.json");
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const CATEGORY_QUERIES = [
  { category: "Tourism News", query: "India tourism" },
  { category: "Festivals", query: "India festival tourism" },
  { category: "Weather Alerts", query: "India weather alert travel" },
  { category: "Travel Advisories", query: "India travel advisory tourists" },
  { category: "Eco Tourism", query: "India eco tourism sustainable travel" },
  { category: "Wildlife", query: "India wildlife sanctuary tiger reserve" },
  { category: "National Parks", query: "India national park safari" },
  { category: "Transport Updates", query: "India tourist transport train flight" },
  { category: "Hotel & Stay", query: "India hotel resort tourism" },
  { category: "Cultural Events", query: "India cultural event heritage" },
];

const CATEGORY_ICONS = {
  "Tourism News": "compass",
  Festivals: "sparkle",
  "Weather Alerts": "cloud",
  "Travel Advisories": "alert",
  "Eco Tourism": "leaf",
  Wildlife: "paw",
  "National Parks": "tree",
  "Transport Updates": "train",
  "Hotel & Stay": "bed",
  "Cultural Events": "landmark",
};

const HIGH_PRIORITY_CATEGORIES = new Set(["Weather Alerts", "Travel Advisories", "Wildlife"]);

function parseRssItems(xml, category, limitPerFeed = 4) {
  const items = [];
  const itemBlocks = xml.split("<item>").slice(1);

  for (const block of itemBlocks.slice(0, limitPerFeed)) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const description = extractTag(block, "description");

    if (title) {
      const decodedTitle = decodeEntities(title);
      const dashIdx = decodedTitle.lastIndexOf(" - ");
      const sourceName = dashIdx > -1 ? decodedTitle.slice(dashIdx + 3).trim() : "Google News";

      items.push({
        rawTitle: decodedTitle,
        rawDescription: decodeEntities(stripHtml(description || "")),
        link: link || "",
        sourceName,
        pubDate: pubDate || new Date().toUTCString(),
        sourceCategory: category,
      });
    }
  }
  return items;
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!match) return "";
  return match[1].replace("<![CDATA[", "").replace("]]>", "").trim();
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchFeed({ category, query }) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (EcoVillageLiveUpdates/1.0)" } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, category);
  } catch (err) {
    console.error(`Feed fetch failed for "${category}":`, err.message);
    return [];
  }
}

async function fetchAllFeeds() {
  const results = await Promise.all(CATEGORY_QUERIES.map(fetchFeed));
  return results.flat();
}

async function processWithGroq(rawItems) {
  if (rawItems.length === 0) return [];

  const CHUNK_SIZE = 15;
  const chunks = [];
  for (let i = 0; i < rawItems.length; i += CHUNK_SIZE) {
    chunks.push(rawItems.slice(i, i + CHUNK_SIZE));
  }

  const allProcessed = [];

  for (const chunk of chunks) {
    const articlesText = chunk
      .map(
        (a, i) =>
          `${i + 1}. [${a.sourceCategory}] "${a.rawTitle}" — ${a.rawDescription.slice(0, 300)} (published: ${a.pubDate})`
      )
      .join("\n");

    const systemPrompt = `You are a news-processing engine for an India tourism website called EcoVillage.

You will receive a numbered list of raw news headlines/snippets. For each ARTICLE that is genuinely tourism-relevant (travel, festivals, weather affecting travel, wildlife/national parks, transport for tourists, hotels/stays, cultural events, eco-tourism), produce one JSON object. IGNORE and DROP articles that are not tourism-relevant (e.g. pure politics, sports, finance) and DROP duplicate stories covering the same event (keep only the best-written one).

For every kept article return an object with EXACTLY these fields:
{
  "sourceIndex": the number of this article from the numbered list (integer, required — used to link back to the original source),
  "title": "short user-friendly title, max 12 words",
  "summary": "2-3 sentence plain-language summary a tourist would find useful",
  "category": "one of: Tourism News | Festivals | Weather Alerts | Travel Advisories | Eco Tourism | Wildlife | National Parks | Transport Updates | Hotel & Stay | Cultural Events",
  "state": "Indian state/UT this concerns, or \\"India\\" if nationwide/unclear",
  "location": "specific city/destination/park name if mentioned, else same as state",
  "date": "human readable date like 'Today', 'This week', or the article date",
  "importance": "high | medium | low"
}

Respond ONLY with a JSON object of the shape {"updates": [ ... ]} and nothing else — no markdown, no commentary, no code fences.`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: articlesText },
        ],
      });

      const raw = completion.choices[0].message.content;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.updates)) {
        for (const u of parsed.updates) {
          const original = chunk[(u.sourceIndex || 0) - 1];
          allProcessed.push({
            ...u,
            link: original?.link || "",
            sourceName: original?.sourceName || "Google News",
          });
        }
      }
    } catch (err) {
      console.error("Groq processing failed for a chunk:", err.message);
    }
  }

  return allProcessed
    .filter((u) => u && u.title && u.summary)
    .map((u, idx) => ({
      id: `upd_${Date.now()}_${idx}`,
      icon: CATEGORY_ICONS[u.category] || "",
      title: u.title,
      summary: u.summary,
      category: u.category || "Tourism News",
      state: u.state || "India",
      location: u.location || u.state || "India",
      date: u.date || "Today",
      importance: u.importance || "medium",
      priority: HIGH_PRIORITY_CATEGORIES.has(u.category) ? "high" : "normal",
      link: u.link || "",
      sourceName: u.sourceName || "Google News",
    }))
    .slice(0, 10);
}

function readCache() {
  try {
    const stat = fs.statSync(TMP_CACHE_PATH);
    const isFresh = Date.now() - stat.mtimeMs < CACHE_TTL_MS;
    if (isFresh) {
      return JSON.parse(fs.readFileSync(TMP_CACHE_PATH, "utf-8"));
    }
  } catch {
    // no cache yet
  }
  return null;
}

function writeCache(data) {
  try {
    fs.writeFileSync(TMP_CACHE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Could not write /tmp cache:", err.message);
  }
}

function readSeed() {
  try {
    return JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
  } catch {
    return { updates: [], generatedAt: null };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wantsRefresh = searchParams.get("refresh") === "1";

  if (wantsRefresh) {
    const secret = searchParams.get("secret");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
      const rawItems = await fetchAllFeeds();
      const updates = await processWithGroq(rawItems);
      const payload = { updates, generatedAt: new Date().toISOString() };
      writeCache(payload);
      return NextResponse.json({ success: true, ...payload });
    } catch (err) {
      console.error("Refresh failed:", err);
      return NextResponse.json({ success: false, error: "Refresh failed" }, { status: 500 });
    }
  }

  const cached = readCache();
  const payload = cached || readSeed();
  return NextResponse.json({ success: true, ...payload });
}
