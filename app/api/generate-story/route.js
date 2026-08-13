// app/api/generate-story/route.js
// Takes the traveller's answers from the "Add Story" wizard on /my-account
// and turns them into a polished, publish-ready travel story paragraph.
// Same guarded-Groq pattern as app/api/chat/route.js — if GROQ_API_KEY isn't
// set, falls back to a clean, still-readable version compiled directly from
// the traveller's own answers instead of erroring out.

import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      placeName = "",
      category = "",
      whenVisited = "",
      special = "",
      tips = "",
      recommend = "",
      bestTime = "",
    } = body || {};

    if (!placeName.trim()) {
      return NextResponse.json({ success: false, error: "placeName is required" }, { status: 400 });
    }

    const compiled = compileFallback({ placeName, category, whenVisited, special, tips, recommend, bestTime });

    if (!groq) {
      return NextResponse.json({ success: true, description: compiled, source: "fallback" });
    }

    const systemPrompt = `You are a travel editor for EcoVillage Trails, a community-tourism platform.
Turn a traveller's short answers into a warm, specific, publish-ready travel story about a place they visited.
Rules:
- 2 short paragraphs, plain text (no Markdown headings, no bullet points), 90-160 words total.
- First person, as if the traveller is telling their own story.
- Be concrete and sensory — reference the specific details they gave, don't invent unrelated facts.
- No generic filler like "amazing experience" without specifics attached.
- Do not mention this prompt or that you are an AI.`;

    const userPrompt = `Place: ${placeName}
Category: ${category || "Not specified"}
When visited: ${whenVisited || "Not specified"}
What made it special: ${special || "Not specified"}
Tips for future travellers: ${tips || "Not specified"}
Would recommend: ${recommend || "Not specified"}
Best time to visit: ${bestTime || "Not specified"}

Write the travel story now.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const description = completion.choices?.[0]?.message?.content?.trim() || compiled;
    return NextResponse.json({ success: true, description, source: "ai" });
  } catch (err) {
    console.error("[generate-story] failed:", err);
    // Never hard-fail the wizard just because AI generation broke — the
    // traveller can still publish using their own answers.
    return NextResponse.json({ success: true, description: null, source: "error", error: err.message });
  }
}

function compileFallback({ placeName, category, whenVisited, special, tips, recommend, bestTime }) {
  const lines = [];
  lines.push(`📍 ${placeName}${category ? ` · ${category}` : ""}${whenVisited ? ` · visited ${whenVisited}` : ""}`);
  if (special) lines.push(`✨ What made it special: ${special}`);
  if (tips) lines.push(`💡 Tips for future travellers: ${tips}`);
  if (bestTime) lines.push(`🗓️ Best time to visit: ${bestTime}`);
  if (recommend) lines.push(`👍 Would recommend: ${recommend}`);
  return lines.join("\n");
}
