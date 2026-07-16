'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import RecommendationCarousel from './RecommendationCarousel';
import { RecommendedDestination } from '@/lib/types';
import { CITY_COORDS } from '@/lib/recommendationEngine';

export default function WeekendGetaways({
  items,
  loading,
  onRequestLocation,
  onSelectCity,
  usingLocation,
  city,
}: {
  items: RecommendedDestination[];
  loading?: boolean;
  onRequestLocation: () => void;
  onSelectCity: (city: string) => void;
  usingLocation: boolean;
  city?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-dusk-950 py-14">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-marigold-400" />
            <h2 className="font-display text-3xl font-medium text-rice">Weekend Getaways Near You</h2>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="rounded-full bg-dusk-800 px-4 py-2 text-xs font-medium text-rice/80 hover:text-rice"
            >
              {usingLocation ? 'Using your location' : city ? `Near ${city}` : 'Set your location'}
            </button>
            {open && (
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl bg-dusk-900 p-2 shadow-xl ring-1 ring-dusk-700">
                <button
                  onClick={() => {
                    onRequestLocation();
                    setOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rice/90 hover:bg-dusk-800"
                >
                  Use my location
                </button>
                <div className="my-1 h-px bg-dusk-700" />
                {Object.keys(CITY_COORDS).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onSelectCity(c);
                      setOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rice/70 hover:bg-dusk-800 hover:text-rice"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mb-6 max-w-xl text-sm text-rice/60">Within roughly 300 km, ranked by distance and fit.</p>
        <RecommendationCarousel items={items} loading={loading} />
      </div>
    </section>
  );
}
