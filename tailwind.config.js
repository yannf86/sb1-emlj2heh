/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand color - gold/amber from logo
        brand: {
          DEFAULT: '#D4A017',
          50: '#FDF7E2',
          100: '#FBEFC6',
          200: '#F8E08D',
          300: '#F5D054',
          400: '#F2C01B',
          500: '#D4A017', // Main brand color
          600: '#B08214',
          700: '#8C6410',
          800: '#68470C',
          900: '#442E07',
          950: '#221703',
        },
        // Secondary color - beige/cream from logo
        cream: {
          DEFAULT: '#F5EACB',
          50: '#FFFFFF',
          100: '#FDF9F3',
          200: '#FAF1E2',
          300: '#F7E9D0',
          400: '#F5EACB', // Main cream color
          500: '#ECD9A7',
          600: '#E2C783',
          700: '#D9B65F',
          800: '#CFA43B',
          900: '#B38C2A',
        },
        // Gray for text - from logo
        charcoal: {
          DEFAULT: '#4A4A4A',
          50: '#ECECEC',
          100: '#DCDCDC',
          200: '#BCBCBC',
          300: '#9C9C9C',
          400: '#7C7C7C',
          500: '#5C5C5C',
          600: '#4A4A4A', // Main text color
          700: '#383838',
          800: '#262626',
          900: '#141414',
          950: '#0A0A0A',
        },
      },
    },
  },
  plugins: [],
};