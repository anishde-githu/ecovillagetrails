'use client';

import { Sun, CloudRain, Snowflake } from 'lucide-react';
import RecommendationCarousel from './RecommendationCarousel';
import { RecommendedDestination } from '@/lib/types';

const SEASON_META = {
  Summer: { icon: Sun, blurb: 'Cool hill stations and high-altitude escapes for peak heat.' },
  Monsoon: { icon: CloudRain, blurb: 'Waterfalls, green valleys, and coastlines that come alive with rain.' },
  Winter: { icon: Snowflake, blurb: 'Snow, deserts, and festival season — the country\u2019s busiest months.' },
} as const;

export default function SeasonSection({
  season,
  items,
  loading,
}: {
  season: 'Summer' | 'Monsoon' | 'Winter';
  items: RecommendedDestination[];
  loading?: boolean;
}) {
  const meta = SEASON_META[season];
  const Icon = meta.icon;
  return (
    <section className="bg-dusk-950 py-14">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-6 flex items-center gap-2">
          <Icon size={18} className="text-marigold-400" />
          <h2 className="font-display text-3xl font-medium text-rice">Right Now: {season} in India</h2>
        </div>
        <p className="mb-6 max-w-xl text-sm text-rice/60">{meta.blurb}</p>
        <RecommendationCarousel items={items} loading={loading} />
      </div>
    </section>
  );
}
