'use client';

import { Sparkles } from 'lucide-react';
import RecommendationCarousel from './RecommendationCarousel';
import { RecommendedDestination, Category } from '@/lib/types';

const ALL_INTERESTS: Category[] = [
  'Nature', 'Heritage', 'Wildlife', 'Spiritual', 'Food', 'Adventure', 'Eco Tourism', 'Villages',
];

export default function AIPicksSection({
  items,
  loading,
  selected,
  onToggle,
}: {
  items: RecommendedDestination[];
  loading?: boolean;
  selected: Category[];
  onToggle: (c: Category) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 md:px-10">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles size={18} className="text-marigold-500" />
        <h2 className="font-display text-3xl font-medium text-dusk-950">AI Picks For You</h2>
      </div>
      <p className="mb-5 max-w-xl text-sm text-dusk-800/70">
        Tell the engine what you're into — it re-ranks every card below in real time.
      </p>

      <div className="mb-7 flex flex-wrap gap-2">
        {ALL_INTERESTS.map((interest) => {
          const active = selected.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => onToggle(interest)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'border-marigold-500 bg-marigold-500 text-dusk-950'
                  : 'border-dusk-700/30 bg-transparent text-dusk-800/80 hover:border-marigold-500/60'
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>

      <RecommendationCarousel items={items} loading={loading} />
    </section>
  );
}
