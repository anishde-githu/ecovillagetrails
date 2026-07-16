'use client';

import { TrendingUp } from 'lucide-react';
import RecommendationCarousel from './RecommendationCarousel';
import { RecommendedDestination } from '@/lib/types';

export default function TrendingSection({ items, loading }: { items: RecommendedDestination[]; loading?: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
      <div className="mb-6 flex items-center gap-2">
        <TrendingUp size={18} className="text-rani" />
        <h2 className="font-display text-3xl font-medium text-dusk-950">Trending This Week</h2>
      </div>
      <p className="mb-6 max-w-xl text-sm text-dusk-800/70">
        Rising in searches and bookings across EcoVillage Trails right now — this list refreshes weekly.
      </p>
      <RecommendationCarousel items={items} loading={loading} />
    </section>
  );
}
