import type { Metadata } from 'next';
import { Fraunces, Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-plex-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'EcoVillage Trails — AI Travel Picks for India',
  description:
    'AI-powered recommendations for eco, heritage, and offbeat travel across India — personalized, seasonal, and updated daily.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable} font-body bg-rice text-dusk-950`}>
        {children}
      </body>
    </html>
  );
}
