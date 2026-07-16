import { NextRequest, NextResponse } from 'next/server';
import { buildMockRecommendations } from '@/lib/recommendationEngine';
import { getAiRecommendations } from '@/lib/groq';
import { Category, Destination } from '@/lib/types';

export const dynamic = 'force-dynamic'; // recommendations depend on "now" — never statically cache

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const interestsParam = searchParams.get('interests');
  const interests = interestsParam
    ? (interestsParam.split(',').filter(Boolean) as Category[])
    : undefined;

  const budgetTier = (searchParams.get('budget') as Destination['budgetTier'] | null) || undefined;
  const lat = searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined;
  const lng = searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined;
  const city = searchParams.get('city') || undefined;

  const input = { interests, budgetTier, lat, lng, city };

  try {
    const ai = await getAiRecommendations(input);
    if (ai && Object.values(ai).some((v) => Array.isArray(v) && v.length > 0)) {
      return NextResponse.json(ai);
    }
  } catch (err) {
    console.error('Groq recommendation call failed, falling back to mock engine:', err);
  }

  const mock = buildMockRecommendations(input);
  return NextResponse.json(mock);
}
