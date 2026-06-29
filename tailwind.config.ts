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
          500: '#14b8a6', 
          600: '#0d9488', // Primary Teal
          700: '#0f766e', // Deep Teal
          800: '#115e59',
          900: '#134e4a',
        },
        primary: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dark: '#0f766e',
        },
        secondary: {
          DEFAULT: '#1e293b', // Navy Blue
          light: '#334155',
          dark: '#0f172a',
        },
        accent: {
          DEFAULT: '#f28b82', // Soft Coral/Orange
          light: '#f8b4b0',
          dark: '#d9736a',
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
