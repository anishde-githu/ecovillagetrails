'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Navbar from './Navbar';

export default function Hero({ month, season }: { month?: string; season?: string }) {
  return (
    <section className="relative flex min-h-[88vh] items-end overflow-hidden bg-dusk-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url('https://picsum.photos/seed/heroindia/1800/1200')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-dusk-950 via-dusk-950/50 to-dusk-950/10" />
      <Navbar />

      <div className="relative z-10 w-full px-6 pb-16 md:px-10 md:pb-24">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-marigold-400"
        >
          {season ? `${season} in India · ${month}` : 'Loading today\u2019s picks\u2026'}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl font-display text-5xl font-medium leading-[1.05] text-rice md:text-7xl"
        >
          Where should India take you this week?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 max-w-xl text-lg text-rice/70"
        >
          Recommendations that shift with the season, the calendar, and what you tell us — not a fixed list of the same ten places.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex max-w-md items-center gap-2 rounded-full bg-rice/95 p-1.5 pl-4 shadow-2xl"
        >
          <Search size={18} className="text-dusk-800/60" />
          <input
            placeholder="Try 'quiet monsoon village near a river'"
            className="w-full bg-transparent py-2 text-sm text-dusk-950 outline-none placeholder:text-dusk-800/40"
          />
          <button className="rounded-full bg-dusk-950 px-5 py-2.5 text-sm font-semibold text-rice hover:bg-dusk-800">
            Ask AI
          </button>
        </motion.div>
      </div>
    </section>
  );
}

