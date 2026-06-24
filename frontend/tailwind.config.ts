import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // primary teal
          600: '#0d9488',
          700: '#0f766e', // deep teal
          800: '#115e59',
          900: '#134e4a',
        },
        primary: {
          DEFAULT: '#0f766e',
          light: '#0d9488',
          dark: '#115e59',
        },
        secondary: {
          DEFAULT: '#0284c7', // Slate Blue for clinical items
          light: '#38bdf8',
          dark: '#0369a1',
        },
        accent: {
          DEFAULT: '#e11d48', // rose accent for discounts & alerts
          light: '#fda4af',
          dark: '#be123c',
        },
        neutral: {
          card: '#ffffff',
          background: '#f8fafc',
          border: '#e2e8f0',
        }
      },
    },
  },
  plugins: [],
};
export default config;
