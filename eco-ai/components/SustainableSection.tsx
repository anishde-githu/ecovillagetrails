'use client';

import { Leaf } from 'lucide-react';
import RecommendationCarousel from './RecommendationCarousel';
import { RecommendedDestination } from '@/lib/types';

export default function SustainableSection({ items, loading }: { items: RecommendedDestination[]; loading?: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
      <div className="mb-6 flex items-center gap-2">
        <Leaf size={18} className="text-teal-600" />
        <h2 className="font-display text-3xl font-medium text-dusk-950">Sustainable Tourism Picks</h2>
      </div>
      <p className="mb-6 max-w-xl text-sm text-dusk-800/70">
        Places built around eco tourism, homestays, and community-run initiatives — ranked by sustainability score.
      </p>
      <RecommendationCarousel items={items} loading={loading} />
    </section>
  );
}
