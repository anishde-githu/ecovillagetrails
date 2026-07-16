'use client';

import { motion } from 'framer-motion';
import { moods } from '@/lib/destinations';
import { Category } from '@/lib/types';

export default function MoodExplorer({ onPickMood }: { onPickMood: (tags?: Category[]) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
      <h2 className="font-display text-3xl font-medium text-dusk-950">Search by Mood</h2>
      <p className="mb-7 max-w-xl text-sm text-dusk-800/70">
        Pick a mood and the AI Planner filters itself to match — no forms to fill in.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {moods.map((mood, i) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPickMood(mood.filters.tags as Category[] | undefined)}
            className="flex flex-col items-start gap-3 rounded-2xl bg-dusk-900 p-5 text-left shadow-md transition hover:shadow-xl"
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="font-display text-lg font-medium text-rice">{mood.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
