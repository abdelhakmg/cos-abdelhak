/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#F3E5AB',
          400: '#E5C158',
          500: '#D4AF37', // الذهبي الرئيسي
          600: '#B8860B',
          700: '#996515',
        },
        dark: {
          900: '#0A0A0A', // الأسود الداكن الفاخر
          800: '#121212',
          700: '#1E1E1E',
          600: '#2A2A2A',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
