import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { arabic: ['Cairo', 'sans-serif'] },
      colors: {
        brand: {
          950: '#130A24',   // deepest corner / fallback body
          900: '#1A0D34',   // panels, sidebar
          800: '#2C1650',   // main page base
          700: '#3D2070',
          600: '#6B46C1',   // --color-purple-light (UI elements)
          500: '#7C3AED',
          400: '#8B5CF6',
          300: '#A78BFA',
          200: '#C4B5FD',
          100: '#DDD6FE',
        },
        cyan: {
          950: '#020e14',
          900: '#042030',
          800: '#063a52',
          700: '#0e6490',
          600: '#0891b2',
          500: '#00B4D8',   // --color-cyan-brand
          400: '#22d3ee',
          300: '#67e8f9',
          200: '#a5f3fc',
          100: '#cffafe',
        },
      },
      backgroundImage: {
        'hero-grid': "linear-gradient(rgba(107,70,193,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(107,70,193,0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
