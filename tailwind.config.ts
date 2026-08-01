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
          50: '#f0f9fb',
          100: '#dcf2f7',
          200: '#bfe5ee',
          300: '#92d1e0',
          400: '#5cb3cc',
          500: '#3b99b3',
          600: '#108098', // Logo Primary Azure Teal
          700: '#0f667a', // Logo Deep Azure Teal
          800: '#115566',
          900: '#134754',
          950: '#072027',
        },
        primary: {
          DEFAULT: '#108098',
          light: '#3b99b3',
          dark: '#0f667a',
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
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
