// ============================================================
// calendarController.js
// Business logic for the AI Smart Travel Calendar.
// Builds the prompt sent to Groq, parses/validates the response,
// and returns a clean JSON payload the frontend can render directly.
// ============================================================

import { callGroq } from './groqService.js';

// The system prompt locks the model into a strict JSON contract.
// Every key here maps 1:1 to a collapsible card on the frontend.
const SYSTEM_PROMPT = `
You are an expert local travel guide, cultural historian, and trip planner for eco-tourism
destinations in India. You ALWAYS respond with a single valid JSON object and nothing else —
no markdown, no code fences, no commentary outside the JSON.

The JSON object must follow this exact shape:

{
  "festivalGuide": {
    "name": string, "history": string, "importance": string, "traditions": string,
    "activities": string, "localCulture": string, "food": string, "duration": string,
    "location": string, "nearbyAttractions": string, "safetyTips": string,
    "interestingFacts": string, "bestTime": string, "travelTips": string
  },
  "itinerary": {
    "tripSummary": string,
    "days": [
      { "day": number, "morning": string, "afternoon": string, "evening": string, "night": string }
    ],
    "mapSuggestions": {
      "sunriseSpot": string, "sunsetSpot": string, "hiddenVillage": string,
      "natureWalk": string, "localExperience": string, "ecoStay": string
    }
  },
  "budget": {
    "transportation": string, "accommodation": string, "food": string, "shopping": string,
    "entryTickets": string, "activities": string, "emergencyFund": string, "grandTotal": string
  },
  "weather": {
    "temperature": string, "humidity": string, "rainChance": string, "wind": string,
    "uvIndex": string, "travelAdvice": string
  },
  "news": [ { "headline": string, "summary": string, "category": string } ],
  "transport": {
    "nearestAirport": string, "nearestRailway": string, "busServices": string,
    "taxi": string, "roadConditions": string, "travelTime": string, "suggestedRoute": string
  },
  "photography": {
    "goldenHour": string, "bestSunrise": string, "bestSunset": string, "droneRules": string,
    "photographySpots": string, "wildlifeSpots": string, "cameraTips": string
  },
  "food": {
    "mustTry": string, "traditionalDishes": string, "localRestaurants": string,
    "streetFood": string, "organicFood": string, "seasonalSpecial": string
  },
  "shopping": {
    "handicrafts": string, "localMarkets": string, "souvenirs": string,
    "textiles": string, "pottery": string, "terracotta": string, "bambooCrafts": string
  },
  "sustainability": {
    "ecoFriendlyPractices": string, "plasticFreeTips": string,
    "supportLocalBusinesses": string, "responsibleTourism": string, "natureProtection": string
  },
  "hiddenGems": {
    "lessCrowdedPlaces": string, "secretViewpoints": string, "waterfalls": string,
    "forestTrails": string, "unknownVillages": string, "photographyLocations": string
  },
  "nearbyEvents": [ { "name": string, "date": string, "type": string, "description": string } ]
}

Keep each string field concise but genuinely useful (2-5 sentences, not filler).
If exact real-world data isn't available, give a realistic, clearly-labeled estimate
rather than inventing precise fake statistics. Never leave a field empty — always give
useful, specific-sounding guidance appropriate to the location and season given.
`.trim();

/**
 * POST /api/calendar-ai
 * Body: { date: 'YYYY-MM-DD', eventName: string, location: string, eventType?: string }
 */
async function generateCalendarInsights(req, res) {
  try {
    const { date, eventName, location, eventType } = req.body;

    if (!date || !eventName || !location) {
      return res.status(400).json({
        success: false,
        error: 'date, eventName, and location are required fields.',
      });
    }

    const userPrompt = `
Generate a complete travel intelligence report for the following selection:
- Date: ${date}
- Event / Occasion: ${eventName}
- Event type: ${eventType || 'general'}
- Location: ${location}

Tailor every section (festival guide, itinerary, budget, weather, news, transport,
photography, food, shopping, sustainability, hidden gems, nearby events) specifically
to this date, location, and event. Respond with ONLY the JSON object described in your
instructions.
`.trim();

    const rawText = await callGroq(SYSTEM_PROMPT, userPrompt);

    // Defensive parsing: strip accidental code fences if the model adds them anyway.
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[calendarController] Failed to parse Groq JSON:', parseErr.message);
      return res.status(502).json({
        success: false,
        error: 'AI response could not be parsed. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      date,
      eventName,
      location,
      data,
    });
  } catch (err) {
    console.error('[calendarController] generateCalendarInsights error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong while generating your travel insights. Please try again.',
    });
  }
}

export { generateCalendarInsights };