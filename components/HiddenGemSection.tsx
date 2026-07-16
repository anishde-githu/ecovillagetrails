'use client';

import { Gem } from 'lucide-react';
import RecommendationCarousel from './RecommendationCarousel';
import { RecommendedDestination } from '@/lib/types';

export default function HiddenGemSection({ items, loading }: { items: RecommendedDestination[]; loading?: boolean }) {
  return (
    <section className="bg-riceDim py-14">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-6 flex items-center gap-2">
          <Gem size={18} className="text-teal-600" />
          <h2 className="font-display text-3xl font-medium text-dusk-950">Hidden Gems</h2>
        </div>
        <p className="mb-6 max-w-xl text-sm text-dusk-800/70">
          Lesser-known places most itineraries skip. This shortlist rotates every few days.
        </p>
        <RecommendationCarousel items={items} loading={loading} />
      </div>
    </section>
  );
}
