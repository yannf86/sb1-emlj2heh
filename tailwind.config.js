/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette Creho basée sur le logo
        creho: {
          50: '#fefdf6',
          100: '#fef9e7',
          200: '#fef3cc',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#D4AF37', // Couleur principale dorée du logo
          600: '#C9971B',
          700: '#B8860B',
          800: '#996515',
          900: '#805412',
        },
        // Couleurs grises chaudes pour accompagner
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        }
      },
    },
  },
  plugins: [],
};