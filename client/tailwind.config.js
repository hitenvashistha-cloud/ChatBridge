/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f0e17',
        'dark-surface': '#1a1a2e',
        'dark-surface2': '#16213e',
        'dark-text': '#fffffe',
        'dark-border': '#2a2a4a',
      },
    },
  },
  plugins: [],
}