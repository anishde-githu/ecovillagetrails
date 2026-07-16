import Groq from 'groq-sdk';
import { destinations } from './destinations';
import { Destination, RecommendedDestination } from './types';
import { EngineInput, getSeason, getUpcomingFestival } from './recommendationEngine';

// IMPORTANT: the key is read server-side from an environment variable.
// It must never appear in a NEXT_PUBLIC_* variable or in any client component —
// that's the difference between "server secret" and "shipped to every visitor".
const apiKey = process.env.GROQ_API_KEY;

const SECTION_KEYS = [
  'personalized',
  'trending',
  'seasonal',
  'festival',
  'hiddenGems',
  'sustainable',
  'nearby',
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

// Trim the catalog down to fields the model actually needs — keeps the prompt
// small and stops the model from inventing details we didn't give it.
function catalogForPrompt() {
  return destinations.map((d) => ({
    id: d.id,
    name: d.name,
    state: d.state,
    tags: d.tags,
    sustainabilityScore: d.sustainabilityScore,
    popularity: d.popularity,
    budgetTier: d.budgetTier,
    bestSeasons: d.bestSeasons,
  }));
}

interface AiSelection {
  sections: Record<SectionKey, Array<{ id: string; matchScore: number; matchReason: string }>>;
}

export async function getAiRecommendations(input: EngineInput) {
  if (!apiKey) return null; // no key configured — caller falls back to mock engine

  const now = input.now ?? new Date();
  const season = getSeason(now);
  const festival = getUpcomingFestival(now);

  const groq = new Groq({ apiKey });

  const prompt = `You are the recommendation engine for an Indian eco-tourism site.
Today: ${now.toDateString()}. Season: ${season}. Upcoming festival: ${festival ? `${festival.name} on ${festival.date}` : 'none nearby'}.
User interests: ${input.interests?.join(', ') || 'none specified'}. Budget tier: ${input.budgetTier || 'any'}.
User location: ${input.lat != null ? `${input.lat},${input.lng}` : input.city || 'unknown'}.

Here is the ONLY catalog of real destinations you may recommend (JSON):
${JSON.stringify(catalogForPrompt())}

Choose destination ids from this catalog only — never invent a destination that isn't listed.
Return STRICT JSON only, no prose, matching exactly this shape:
{
  "sections": {
    "personalized": [{"id": "...", "matchScore": 0-100, "matchReason": "short phrase"}],
    "trending": [...],
    "seasonal": [...],
    "festival": [...],
    "hiddenGems": [...],
    "sustainable": [...],
    "nearby": [...]
  }
}
Each section: 4-8 items, ranked best-first. "festival" can be empty if no destinationIds fit the upcoming festival. "hiddenGems" should favor low-popularity, high-sustainability entries. "sustainable" only entries with sustainabilityScore >= 75.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;

  let parsed: AiSelection;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null; // malformed JSON — caller falls back to mock engine
  }

  const byId = new Map<string, Destination>(destinations.map((d) => [d.id, d]));

  function hydrate(section?: Array<{ id: string; matchScore: number; matchReason: string }>): RecommendedDestination[] {
    if (!section) return [];
    return section
      .map((item) => {
        const base = byId.get(item.id);
        if (!base) return null; // ignore ids the model hallucinated
        return {
          ...base,
          matchScore: Math.max(0, Math.min(100, Math.round(item.matchScore ?? 70))),
          matchReason: item.matchReason || 'recommended for you',
        };
      })
      .filter((x): x is RecommendedDestination => x !== null);
  }

  const sections = parsed.sections || ({} as AiSelection['sections']);

  return {
    meta: {
      generatedAt: now.toISOString(),
      month: now.toLocaleString('en-IN', { month: 'long' }),
      season,
      upcomingFestival: festival ? { name: festival.name, date: festival.date } : null,
      source: 'ai' as const,
    },
    personalized: hydrate(sections.personalized),
    trending: hydrate(sections.trending),
    seasonal: hydrate(sections.seasonal),
    festival: hydrate(sections.festival),
    hiddenGems: hydrate(sections.hiddenGems),
    sustainable: hydrate(sections.sustainable),
    nearby: hydrate(sections.nearby),
  };
}
