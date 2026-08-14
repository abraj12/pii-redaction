/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1', // Indigo/Purple
          dark: '#4f46e5',
        },
        navy: {
          DEFAULT: '#1e1b4b',
          light: '#312e81',
        }
      }
    },
  },
  plugins: [],
}
