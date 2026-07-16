export type Category =
  | 'Nature'
  | 'Heritage'
  | 'Wildlife'
  | 'Spiritual'
  | 'Food'
  | 'Adventure'
  | 'Eco Tourism'
  | 'Villages';

export interface Destination {
  id: string;
  name: string;
  state: string;
  image: string;
  shortDescription: string;
  tags: Category[];
  sustainabilityScore: number; // 0-100
  popularity: number; // 0-100, base popularity used to seed trending
  budgetTier: 'Budget' | 'Mid-range' | 'Premium';
  bestSeasons: Array<'Summer' | 'Monsoon' | 'Winter'>;
  latitude: number;
  longitude: number;
  sustainablePractices?: string[];
}

export interface RecommendedDestination extends Destination {
  matchScore: number; // 0-100, the "AI Match Score"
  matchReason: string;
}

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  filters: {
    tags?: Category[];
    budgetTier?: Destination['budgetTier'];
    sustainabilityMin?: number;
  };
}

export interface RecommendationsResponse {
  meta: {
    generatedAt: string;
    month: string;
    season: 'Summer' | 'Monsoon' | 'Winter';
    upcomingFestival: { name: string; date: string } | null;
    source: 'ai' | 'mock';
  };
  personalized: RecommendedDestination[];
  trending: RecommendedDestination[];
  seasonal: RecommendedDestination[];
  festival: RecommendedDestination[];
  hiddenGems: RecommendedDestination[];
  sustainable: RecommendedDestination[];
  nearby: RecommendedDestination[];
}
