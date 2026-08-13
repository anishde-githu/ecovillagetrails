// ============================================================
// lib/groqCalendar.js
// Shared logic for building the Groq prompt and calling the API.
// Imported by api/calendar-ai.js — kept separate so the handler
// file stays short and easy to read.
// ============================================================

import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

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
rather than inventing precise fake statistics. Never leave a field empty.
`.trim();

/**
 * Calls Groq and returns the parsed JSON travel report.
 * @param {{date: string, eventName: string, location: string, eventType?: string}} selection
 */
function buildFallbackTravelReport({ date, eventName, location, eventType }) {
 const dateLabel = date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'selected date';
 const locationLabel = location || 'your destination';
 const eventLabel = eventName || eventType || 'this itinerary';

 return {
 festivalGuide: {
 name: `${eventLabel} at ${locationLabel}`,
 history: `A locally rooted celebration that blends heritage, community gatherings, and seasonal travel rhythms around ${locationLabel}.`,
 importance: `This event is especially suitable for travellers looking for a cultural and immersive experience on ${dateLabel}.`,
 traditions: 'Expect community-led performances, local food stalls, and hands-on cultural activities that reflect village traditions.',
 activities: 'Join guided walks, heritage talks, craft demonstrations, and evening storytelling sessions to understand the place more deeply.',
 localCulture: `The experience is shaped by local customs, traditions, and hospitality that make ${locationLabel} feel welcoming and authentic.`,
 food: 'Sample regional curries, seasonal snacks, and village-style meals prepared with local ingredients.',
 duration: 'Plan for a half-day to full-day visit depending on how much of the cultural programming you want to experience.',
 location: locationLabel,
 nearbyAttractions: 'Add a short detour to nearby viewpoints, village lanes, or community-run markets for a fuller day out.',
 safetyTips: 'Carry water, wear light footwear, and check local weather updates before heading out for the day.',
 interestingFacts: 'Many rural festivals strengthen local economies by encouraging community-led tourism and craft sales.',
 bestTime: 'Aim to arrive early in the day to enjoy the most relaxed pace and best lighting for photos.',
 travelTips: 'Book transport ahead if you are arriving during a weekend or public-event cluster around the same region.'
 },
 itinerary: {
 tripSummary: `A balanced day plan around ${eventLabel} that combines culture, food, scenic stops, and a slower pace for ${locationLabel}.`,
 days: [
 { day: 1, morning: `Start with breakfast and a short village walk before heading to ${eventLabel}.`, afternoon: 'Enjoy a local lunch and spend time with artisans, performers, or community hosts.', evening: 'Wind down with a quiet dinner and rest near your stay.', night: 'Take the time to enjoy a calm evening under the stars or in a local homestay courtyard.' }
 ],
 mapSuggestions: {
 sunriseSpot: 'Look for a calm ridge, riverbank, or village viewpoint for early-morning photos.',
 sunsetSpot: 'Choose a scenic riverfront or hilltop area to end the day with a slower atmosphere.',
 hiddenVillage: 'Ask locals for lesser-known lanes or adjacent hamlets that feel more intimate and less crowded.',
 natureWalk: 'Include a short trail or garden loop if you want an easy outdoor experience.',
 localExperience: 'Choose a community-led workshop or tasting stop to connect directly with local culture.',
 ecoStay: 'Prefer a homestay or small eco-lodge that supports local families and reduces your footprint.'
 }
 },
 budget: {
 transportation: 'Set aside a moderate amount for local transfer, taxis, or shared transport depending on your arrival point.',
 accommodation: 'Budget for a simple homestay or community lodge that is comfortable yet locally run.',
 food: 'Plan for a few local meals and snacks so you can sample regional dishes without overcommitting.',
 shopping: 'Leave some room for handmade items, local snacks, or small souvenirs from the event.',
 entryTickets: 'Check whether the venue has a nominal entry or local access fee before you arrive.',
 activities: 'Allocate funds for guided walks, workshops, or community experiences if you want extra depth.',
 emergencyFund: 'Keep a small buffer for delays, internet issues, or last-minute transport changes.',
 grandTotal: 'A comfortable mid-range plan should still remain affordable for most travellers visiting this area.'
 },
 weather: {
 temperature: 'Expect mild to warm temperatures depending on the season and altitude.',
 humidity: 'Humidity may rise later in the day, especially in greener or river-adjacent areas.',
 rainChance: 'Carry a light rain layer if the forecast suggests showers or a humid evening.',
 wind: 'A light breeze is typical in open landscapes and elevated viewpoints.',
 uvIndex: 'UV can be moderate, so sunscreen and a hat are useful during daytime hours.',
 travelAdvice: 'Plan outdoor activities earlier in the day when the weather is usually easier to manage.'
 },
 news: [
 { headline: `Local updates for ${locationLabel} are worth checking before your trip.`, summary: 'Watch for weather alerts, road advisories, and public-event notices in the area.', category: 'Advisory' }
 ],
 transport: {
 nearestAirport: 'Use the nearest major airport and then continue by road or shared transfer to the village or event area.',
 nearestRailway: 'A nearby railway station is usually the easiest hub for reaching the region before a final road transfer.',
 busServices: 'State-run and private buses are often available, but schedules can vary around holidays.',
 taxi: 'Local taxis or pre-booked cabs are practical for short hops and flexible timings.',
 roadConditions: 'Road conditions can change quickly, so it is wise to confirm the route the day before travel.',
 travelTime: 'Allow extra time on the road when travelling during peak festival or weekend periods.',
 suggestedRoute: 'Aim for the most direct route from your arrival point and leave buffer time for traffic or village roads.'
 },
 photography: {
 goldenHour: 'Photographers will usually get the best light in the early morning or near sunset.',
 bestSunrise: 'Try a sunrise walk to capture calm landscapes and soft light before the crowd gathers.',
 bestSunset: 'A ridge, riverbank, or open field often offers the clearest evening light.',
 droneRules: 'Check local restrictions before flying a drone, especially near settlements or protected areas.',
 photographySpots: 'Village streets, community courtyards, market stalls, and nearby viewpoints are all strong choices.',
 wildlifeSpots: 'Watch for birds, butterflies, or scenic boundaries around forest edges if you are exploring nearby nature.',
 cameraTips: 'Use a lens that can handle both portraits and wider environmental shots to preserve atmosphere.'
 },
 food: {
 mustTry: 'Try seasonal local dishes cooked fresh by village hosts or community-run food stalls.',
 traditionalDishes: 'Look for regional specialties tied to the season and any local festival ingredients.',
 localRestaurants: 'A homestay kitchen or community-eatery stop is often the most authentic option.',
 streetFood: 'Small roadside stalls can offer a memorable taste of the region if they are busy and well-maintained.',
 organicFood: 'Ask about local produce, home-grown spices, and seasonal ingredients from nearby farms.',
 seasonalSpecial: 'The best dishes are often the ones tied directly to the current harvest or celebration.'
 },
 shopping: {
 handicrafts: 'Village markets may offer handmade crafts, baskets, woven goods, or small art pieces.',
 localMarkets: 'A community market near the event is a good place to pick up souvenirs and local produce.',
 souvenirs: 'Choose small, practical items that reflect craftsmanship rather than generic tourist merchandise.',
 textiles: 'Look for woven fabrics and hand-printed materials that connect to the region.',
 pottery: 'Some regions produce pottery or terracotta pieces that make strong keepsakes.',
 terracotta: 'Terracotta items can be beautiful, but make sure they are shipped safely if you buy them.',
 bambooCrafts: 'Bamboo products are often a sustainable and locally relevant souvenir choice.'
 },
 sustainability: {
 ecoFriendlyPractices: 'Support small businesses that reuse materials, source locally, and minimise waste.',
 plasticFreeTips: 'Carry a bottle, reuse bag, and avoid single-use packaging when possible.',
 supportLocalBusinesses: 'Choose local guides, shops, and food vendors so the visit benefits the community directly.',
 responsibleTourism: 'Respect local customs, ask before photographing people, and leave spaces as you found them.',
 natureProtection: 'Stay on marked routes and avoid disturbing wildlife or fragile vegetation.',
 },
 hiddenGems: {
 lessCrowdedPlaces: 'Ask for smaller lanes, less busy viewpoints, or nearby village compounds that are less crowded.',
 secretViewpoints: 'A short walk uphill or along a rural road can reveal a peaceful landscape view.',
 waterfalls: 'Check with locals for nearby seasonal waterfalls that can be accessed on a short outing.',
 forestTrails: 'A short forest trail or nature loop can add a calm contrast to the main event.',
 unknownVillages: 'Nearby hamlets are often a more intimate way to experience daily life.',
 photographyLocations: 'Village edges, old homes, market paths, and riverbanks usually offer strong visual variety.'
 },
 nearbyEvents: [
 { name: `Community walk around ${locationLabel}`, date: dateLabel, type: 'Local', description: 'A relaxed outing around nearby streets, viewpoints, or a village market.' }
 ]
 };
}

export async function generateTravelReport({ date, eventName, location, eventType }) {
 const userPrompt = `
Generate a complete travel intelligence report for the following selection:
- Date: ${date}
- Event / Occasion: ${eventName}
- Event type: ${eventType || 'general'}
- Location: ${location}

Tailor every section specifically to this date, location, and event.
Respond with ONLY the JSON object described in your instructions.
`.trim();

 if (!process.env.GROQ_API_KEY || !groq) {
 console.warn('[groqCalendar] GROQ_API_KEY missing; using built-in fallback travel report.');
 return buildFallbackTravelReport({ date, eventName, location, eventType });
 }

 try {
 const completion = await groq.chat.completions.create({
 model: MODEL,
 messages: [
 { role: 'system', content: SYSTEM_PROMPT },
 { role: 'user', content: userPrompt },
 ],
 temperature: 0.7,
 max_tokens: 4096,
 response_format: { type: 'json_object' },
 });

 const raw = completion?.choices?.[0]?.message?.content;
 if (!raw) throw new Error('Groq API returned an empty response.');

 const cleaned = raw.replace(/```json|```/g, '').trim();
 return JSON.parse(cleaned);
 } catch (err) {
 console.warn('[groqCalendar] Groq request failed; using fallback travel report.', err.message);
 return buildFallbackTravelReport({ date, eventName, location, eventType });
 }
}
