'use client';

import { useEffect, useState, useCallback } from 'react';
import Hero from '@/components/Hero';
import AIPicksSection from '@/components/AIPicksSection';
import TrendingSection from '@/components/TrendingSection';
import SeasonSection from '@/components/SeasonSection';
import FestivalSection from '@/components/FestivalSection';
import HiddenGemSection from '@/components/HiddenGemSection';
import SustainableSection from '@/components/SustainableSection';
import WeekendGetaways from '@/components/WeekendGetaways';
import MoodExplorer from '@/components/MoodExplorer';
import { RecommendationsResponse, Category } from '@/lib/types';

export default function HomePage() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<Category[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [usingLocation, setUsingLocation] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (interests.length) params.set('interests', interests.join(','));
    if (coords) {
      params.set('lat', String(coords.lat));
      params.set('lng', String(coords.lng));
    } else if (city) {
      params.set('city', city);
    }
    try {
      const res = await fetch(`/api/recommendations?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load recommendations', e);
    } finally {
      setLoading(false);
    }
  }, [interests, coords, city]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const toggleInterest = (c: Category) => {
    setInterests((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const applyMood = (tags?: Category[]) => {
    setInterests(tags && tags.length ? tags : []);
    document.getElementById('picks')?.scrollIntoView({ behavior: 'smooth' });
  };

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUsingLocation(true);
        setCity(undefined);
      },
      () => {
        // permission denied — caller keeps the city fallback UI
      }
    );
  };

  const selectCity = (c: string) => {
    setCity(c);
    setCoords(null);
    setUsingLocation(false);
  };

  return (
    <main className="bg-rice">
      <Hero month={data?.meta.month} season={data?.meta.season} />

      <div id="picks">
        <AIPicksSection
          items={data?.personalized ?? []}
          loading={loading}
          selected={interests}
          onToggle={toggleInterest}
        />
      </div>

      <div id="trending">
        <TrendingSection items={data?.trending ?? []} loading={loading} />
      </div>

      <SeasonSection season={data?.meta.season ?? 'Summer'} items={data?.seasonal ?? []} loading={loading} />

      <FestivalSection festival={data?.meta.upcomingFestival ?? null} items={data?.festival ?? []} loading={loading} />

      <HiddenGemSection items={data?.hiddenGems ?? []} loading={loading} />

      <div id="sustainable">
        <SustainableSection items={data?.sustainable ?? []} loading={loading} />
      </div>

      <WeekendGetaways
        items={data?.nearby ?? []}
        loading={loading}
        onRequestLocation={requestLocation}
        onSelectCity={selectCity}
        usingLocation={usingLocation}
        city={city}
      />

      <div id="mood">
        <MoodExplorer onPickMood={applyMood} />
      </div>

      <footer className="border-t border-dusk-700/10 px-6 py-10 text-center text-xs text-dusk-800/50 md:px-10">
        EcoVillage Trails · recommendations regenerate daily from live season, festival, and trending signals
        {data?.meta.source === 'mock' ? ' (mock data — add GROQ_API_KEY for live AI picks)' : ' (live AI picks)'}
      </footer>
    </main>
  );
}
