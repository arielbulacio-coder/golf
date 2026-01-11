/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        golf: {
          light: '#e6f4ea',
          DEFAULT: '#a8d5ba',
          dark: '#2d6a4f',
          deep: '#1b4332',
          accent: '#d8f3dc',
        },
        elegant: {
            gold: '#c9b037',
            silver: '#d7d7d7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
