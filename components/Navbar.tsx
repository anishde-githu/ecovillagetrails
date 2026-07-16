'use client';

import { Leaf } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 md:px-10">
      <div className="flex items-center gap-2 text-rice">
        <Leaf size={20} className="text-marigold-400" />
        <span className="font-display text-xl font-medium tracking-tight">EcoVillage Trails</span>
      </div>
      <nav className="hidden items-center gap-8 text-sm text-rice/80 md:flex">
        <a href="#picks" className="hover:text-rice">AI Picks</a>
        <a href="#trending" className="hover:text-rice">Trending</a>
        <a href="#mood" className="hover:text-rice">Mood</a>
        <a href="#sustainable" className="hover:text-rice">Sustainable</a>
      </nav>
      <button className="rounded-full bg-marigold-500 px-5 py-2 text-sm font-semibold text-dusk-950 hover:bg-marigold-400">
        Plan a Trip
      </button>
    </header>
  );
}
