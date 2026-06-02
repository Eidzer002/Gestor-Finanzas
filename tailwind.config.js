/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        canvas:   '#050D2E',
        surface1: '#0A1540',
        surface2: '#0F1E52',
        surface3: '#162160',
        surface4: '#1E2B72',
        income:   '#2DD67B',
        expense:  '#F25C5C',
        accent:   '#3D7FFF',
      },
    },
  },
  plugins: [],
}
