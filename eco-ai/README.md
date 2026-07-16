# EcoVillage Trails — AI Homepage

An AI-powered recommendation homepage for EcoVillage Trails, built with Next.js 14 (App Router), Tailwind CSS, and Framer Motion, per the redesign brief.

## Quick start

```bash
npm install
cp .env.example .env.local   # add your own GROQ_API_KEY here — never commit this file
npm run dev
```

Open http://localhost:3000.

**No `GROQ_API_KEY`?** The app still works. `/api/recommendations` falls back to a deterministic mock engine (`lib/recommendationEngine.ts`) that computes season, upcoming festival, trending, hidden gems, and match scores algorithmically — no AI call required. Add the key later and live AI ranking (`lib/groq.ts`) switches on automatically, with the mock engine as its fallback if the AI call ever fails.

## Security note

Never hardcode API keys (Groq, Gemini, OpenAI, etc.) in any file, especially client components — anything shipped to the browser is public. Keys belong in `.env.local` locally, and in your host's environment-variable settings (Vercel/Render/etc.) in production. If a real key was ever pasted into a chat, a doc, or committed to git history, treat it as compromised and rotate it immediately.

## Structure

```
app/
  page.tsx                    homepage — fetches /api/recommendations, wires all sections
  api/recommendations/route.ts   GET endpoint: tries Groq AI, falls back to mock engine
  layout.tsx, globals.css
components/
  Hero.tsx, Navbar.tsx
  RecommendationCarousel.tsx  reusable horizontal carousel w/ skeleton loaders
  DestinationCard.tsx         glassmorphism card w/ AI match ring, bookmark, share
  AIPicksSection.tsx          personalized picks + interest chip filters
  TrendingSection.tsx
  SeasonSection.tsx
  FestivalSection.tsx
  HiddenGemSection.tsx
  SustainableSection.tsx
  WeekendGetaways.tsx         geolocation or city-based "near you"
  MoodExplorer.tsx            mood cards that pre-fill AI Picks filters
lib/
  types.ts                    Destination / RecommendedDestination / API response shapes
  destinations.ts             mock catalog of ~30 Indian destinations (swap for a DB later)
  recommendationEngine.ts     season detection, festival calendar, scoring, seeded rotation
  groq.ts                     server-only Groq wrapper (never runs client-side)
```

## How "the homepage feels alive" is implemented

- **Season** — detected from the current month (`getSeason`), no hardcoding per visit.
- **Festivals** — `FESTIVAL_CALENDAR` in `recommendationEngine.ts` holds illustrative 2026 dates; swap for a real panchang/festival API when available (lunar festival dates shift yearly).
- **Trending / Hidden Gems** — deterministically shuffled using a day-of-year "bucket" (`dayBucket`), so the order is stable within a day/week/3-day window and changes automatically once the window rolls over — no cron job needed for the mock engine.
- **AI Match Score** — computed from interest overlap, seasonal fit, festival relevance, budget fit, sustainability, popularity, and (if available) distance from the user.
- **Nearby** — uses the browser Geolocation API if granted, otherwise a city picker with fixed coordinates for major Indian cities.

## Swapping in a real backend later

`lib/destinations.ts` is intentionally shaped like a database table. To move off mock data:
1. Replace the static array with a DB query (Postgres/Mongo) returning the same `Destination` shape.
2. `recommendationEngine.ts` and `groq.ts` don't need to change — they only depend on the `Destination[]` shape, not where it comes from.
3. For live trending, replace `dayBucket`-based shuffling with a real analytics query (e.g. search/booking counts over the last 7 days).
