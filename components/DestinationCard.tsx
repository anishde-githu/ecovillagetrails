'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bookmark, Share2 } from 'lucide-react';
import { useState } from 'react';
import { RecommendedDestination } from '@/lib/types';

export default function DestinationCard({
  destination,
  index = 0,
}: {
  destination: RecommendedDestination;
  index?: number;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -4 }}
      className="group relative w-72 shrink-0 overflow-hidden rounded-2xl bg-dusk-900 shadow-lg shadow-dusk-950/20 ring-1 ring-dusk-700/40"
    >
      <div className="relative h-80 w-full overflow-hidden">
        <Image
          src={destination.image}
          alt={`${destination.name}, ${destination.state}`}
          fill
          sizes="288px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="glass absolute inset-0" />

        {/* AI Match ring — signature element */}
        <div
          className="match-ring absolute right-3 top-3 flex h-14 w-14 items-center justify-center"
          style={{ ['--pct' as string]: destination.matchScore }}
        >
          <span className="relative z-10 font-mono text-[13px] font-medium text-marigold-400">
            {destination.matchScore}%
          </span>
        </div>

        <div className="absolute left-3 top-3 flex gap-1.5">
          {destination.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-dusk-950/70 px-2.5 py-1 text-[11px] font-medium text-rice/90 backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-marigold-400">{destination.state}</p>
          <h3 className="font-display text-2xl font-medium leading-tight text-rice">{destination.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-rice/75">{destination.shortDescription}</p>
          <p className="mt-2 text-xs italic text-teal-400">{destination.matchReason}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button className="rounded-full bg-marigold-500 px-4 py-2 text-sm font-semibold text-dusk-950 transition hover:bg-marigold-400">
          View Details
        </button>
        <div className="flex gap-1">
          <button
            aria-label="Bookmark"
            onClick={() => setSaved((s) => !s)}
            className={`rounded-full p-2 transition ${saved ? 'bg-rani text-rice' : 'bg-dusk-800 text-rice/70 hover:text-rice'}`}
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button aria-label="Share" className="rounded-full bg-dusk-800 p-2 text-rice/70 transition hover:text-rice">
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
