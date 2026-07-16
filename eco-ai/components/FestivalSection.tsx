'use client';

import { PartyPopper } from 'lucide-react';
import RecommendationCarousel from './RecommendationCarousel';
import { RecommendedDestination } from '@/lib/types';

export default function FestivalSection({
  festival,
  items,
  loading,
}: {
  festival: { name: string; date: string } | null;
  items: RecommendedDestination[];
  loading?: boolean;
}) {
  if (!loading && !festival) return null;

  const dateLabel = festival
    ? new Date(festival.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
    : '';

  return (
    <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
      <div className="mb-6 flex items-center gap-2">
        <PartyPopper size={18} className="text-rani" />
        <h2 className="font-display text-3xl font-medium text-dusk-950">
          Festival Special{festival ? `: ${festival.name}` : ''}
        </h2>
      </div>
      <p className="mb-6 max-w-xl text-sm text-dusk-800/70">
        {festival ? `${festival.name} lands on ${dateLabel} — here's where to be for it.` : 'Loading upcoming festivals\u2026'}
      </p>
      <RecommendationCarousel items={items} loading={loading} />
    </section>
  );
}
