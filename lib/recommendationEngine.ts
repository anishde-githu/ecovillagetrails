import { Destination, RecommendedDestination, Category } from './types';
import { destinations } from './destinations';

export type Season = 'Summer' | 'Monsoon' | 'Winter';

// India's tourism seasons, by month (0 = Jan). Approximate on purpose —
// real deployments should refine this per-region using live weather data.
export function getSeason(date: Date): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 5) return 'Summer';   // Mar–Jun
  if (m >= 6 && m <= 8) return 'Monsoon';  // Jul–Sep
  return 'Winter';                          // Oct–Feb
}

// Approximate festival calendar. Lunar-calendar festivals shift every year —
// swap this for a panchang/festival-calendar API in production. Dates below
// are illustrative anchors for 2026 so "upcoming festival" has something to detect.
interface FestivalEntry {
  name: string;
  date: string; // ISO date, illustrative for the current year
  destinationIds: string[];
}

const FESTIVAL_CALENDAR: FestivalEntry[] = [
  { name: 'Holi', date: '2026-03-04', destinationIds: ['vrindavan', 'mathura'] },
  { name: 'Pushkar Fair', date: '2026-11-20', destinationIds: ['pushkar'] },
  { name: 'Durga Puja', date: '2026-10-17', destinationIds: ['kolkata', 'kumartuli', 'dakshineswar'] },
  { name: 'Mysore Dasara', date: '2026-10-20', destinationIds: ['mysuru'] },
  { name: 'Diwali', date: '2026-11-08', destinationIds: ['varanasi', 'ayodhya', 'jaipur'] },
  { name: 'Hornbill Festival', date: '2026-12-01', destinationIds: ['nagaland'] },
];

export function getUpcomingFestival(date: Date): FestivalEntry | null {
  const upcoming = FESTIVAL_CALENDAR
    .map((f) => ({ f, diff: new Date(f.date).getTime() - date.getTime() }))
    .filter((x) => x.diff > -1000 * 60 * 60 * 24 * 3) // include festivals up to 3 days past
    .sort((a, b) => a.diff - b.diff);
  return upcoming[0]?.f ?? null;
}

// Deterministic "rotates every N days" seed — same for every request within
// a window, different once the window passes. This is what makes Hidden
// Gems / Trending feel alive without needing a real analytics pipeline yet.
export function dayBucket(date: Date, windowDays: number): number {
  const epochDays = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return Math.floor(epochDays / windowDays);
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = seededRandom(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clampScore(n: number) {
  return Math.max(38, Math.min(99, Math.round(n)));
}

interface ScoreContext {
  interests?: Category[];
  season?: Season;
  festivalIds?: string[];
  budgetTier?: Destination['budgetTier'];
  originLat?: number;
  originLng?: number;
}

function score(d: Destination, ctx: ScoreContext): { score: number; reason: string } {
  let s = 40;
  const reasons: string[] = [];

  if (ctx.interests?.length) {
    const overlap = d.tags.filter((t) => ctx.interests!.includes(t)).length;
    if (overlap > 0) {
      s += overlap * 12;
      reasons.push(`matches your interest in ${d.tags.find((t) => ctx.interests!.includes(t))}`);
    }
  }
  if (ctx.season && d.bestSeasons.includes(ctx.season)) {
    s += 14;
    reasons.push(`ideal in ${ctx.season.toLowerCase()}`);
  }
  if (ctx.festivalIds?.includes(d.id)) {
    s += 20;
    reasons.push('hosting a festival soon');
  }
  if (ctx.budgetTier && d.budgetTier === ctx.budgetTier) {
    s += 8;
    reasons.push('fits your budget');
  }
  s += d.sustainabilityScore * 0.08;
  s += d.popularity * 0.06;

  if (ctx.originLat != null && ctx.originLng != null) {
    const km = haversineKm(ctx.originLat, ctx.originLng, d.latitude, d.longitude);
    if (km <= 300) {
      s += 10;
      reasons.push(`${Math.round(km)} km from you`);
    }
  }

  if (reasons.length === 0) reasons.push('trending with travelers like you');
  return { score: clampScore(s), reason: reasons.slice(0, 2).join(' · ') };
}

function toRecommended(list: Destination[], ctx: ScoreContext): RecommendedDestination[] {
  return list
    .map((d) => {
      const { score: matchScore, reason } = score(d, ctx);
      return { ...d, matchScore, matchReason: reason };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export interface EngineInput {
  interests?: Category[];
  budgetTier?: Destination['budgetTier'];
  lat?: number;
  lng?: number;
  city?: string;
  now?: Date;
}

// City fallback coordinates for "Weekend Getaways Near You" when geolocation
// permission isn't granted.
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Guwahati: { lat: 26.1445, lng: 91.7362 },
};

export function buildMockRecommendations(input: EngineInput) {
  const now = input.now ?? new Date();
  const season = getSeason(now);
  const festival = getUpcomingFestival(now);
  const bucketDay = dayBucket(now, 1);
  const bucketWeek = dayBucket(now, 7);
  const bucketFewDays = dayBucket(now, 3);

  const origin =
    input.lat != null && input.lng != null
      ? { lat: input.lat, lng: input.lng }
      : input.city && CITY_COORDS[input.city]
      ? CITY_COORDS[input.city]
      : undefined;

  const ctx: ScoreContext = {
    interests: input.interests,
    season,
    festivalIds: festival?.destinationIds,
    budgetTier: input.budgetTier,
    originLat: origin?.lat,
    originLng: origin?.lng,
  };

  const personalized = toRecommended(destinations, ctx).slice(0, 8);

  const trendingPool = seededShuffle(destinations, bucketWeek + 101);
  const trending = toRecommended(trendingPool, ctx).slice(0, 10);

  const seasonalPool = destinations.filter((d) => d.bestSeasons.includes(season));
  const seasonal = toRecommended(seasonalPool, ctx).slice(0, 8);

  const festivalPool = festival
    ? destinations.filter((d) => festival.destinationIds.includes(d.id))
    : [];
  const festivalRecs = toRecommended(festivalPool, ctx);

  const gemPool = seededShuffle(
    destinations.filter((d) => d.popularity < 60),
    bucketFewDays + 7
  ).slice(0, 6);
  const hiddenGems = toRecommended(gemPool, ctx);

  const sustainablePool = destinations
    .filter((d) => d.sustainabilityScore >= 78)
    .sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);
  const sustainable = toRecommended(sustainablePool, ctx).slice(0, 8);

  const nearbyPool = origin
    ? destinations
        .map((d) => ({ d, km: haversineKm(origin.lat, origin.lng, d.latitude, d.longitude) }))
        .filter((x) => x.km <= 300)
        .sort((a, b) => a.km - b.km)
        .map((x) => x.d)
    : seededShuffle(destinations, bucketDay + 3).slice(0, 6);
  const nearby = toRecommended(nearbyPool, ctx).slice(0, 8);

  return {
    meta: {
      generatedAt: now.toISOString(),
      month: now.toLocaleString('en-IN', { month: 'long' }),
      season,
      upcomingFestival: festival ? { name: festival.name, date: festival.date } : null,
      source: 'mock' as const,
    },
    personalized,
    trending,
    seasonal,
    festival: festivalRecs,
    hiddenGems,
    sustainable,
    nearby,
  };
}
