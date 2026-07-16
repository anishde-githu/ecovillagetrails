import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens — grounded in Indian eco-travel: dusk over terraced
        // hills, marigold festival colour, rice-paper paper stock, dyed indigo.
        dusk: {
          950: '#0E1A16', // near-black forest night
          900: '#132420',
          800: '#1B342C',
          700: '#254539',
        },
        rice: '#F4EEDD',       // warm paper background (light sections)
        riceDim: '#EAE1C8',
        marigold: {
          400: '#F0B94D',
          500: '#E8A33D',
          600: '#CE8A24',
        },
        rani: '#C13C6E',       // rani pink — festival accent
        teal: {
          400: '#4FA99B',
          500: '#2A9D8F',
          600: '#1F7D71',      // eco / sustainability accent
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      backgroundImage: {
        'rangoli-ring': 'conic-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
