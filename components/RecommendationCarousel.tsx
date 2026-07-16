'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DestinationCard from './DestinationCard';
import { RecommendedDestination } from '@/lib/types';

function Skeleton() {
  return (
    <div className="h-[26.5rem] w-72 shrink-0 animate-pulse rounded-2xl bg-dusk-800/60" />
  );
}

export default function RecommendationCarousel({
  items,
  loading,
  autoScroll = false,
}: {
  items: RecommendedDestination[];
  loading?: boolean;
  autoScroll?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dx: number) => trackRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  return (
    <div className="relative">
      <button
        aria-label="Scroll left"
        onClick={() => scrollBy(-320)}
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-dusk-950/80 p-2 text-rice shadow-lg ring-1 ring-dusk-700 hover:bg-dusk-900 md:flex"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={trackRef}
        className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
          : items.map((item, i) => (
              <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
                <DestinationCard destination={item} index={i} />
              </div>
            ))}
        {!loading && items.length === 0 && (
          <p className="py-10 text-sm text-dusk-700">Nothing to show here yet — check back soon.</p>
        )}
      </div>

      <button
        aria-label="Scroll right"
        onClick={() => scrollBy(320)}
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-dusk-950/80 p-2 text-rice shadow-lg ring-1 ring-dusk-700 hover:bg-dusk-900 md:flex"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
