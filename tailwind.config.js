/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1B4332",
        forestdark: "#0F2A1E",
        sage: "#6B7A6F",
        gold: "#C9A45C",
        paper: "#FAF9F6",
        ink: "#1C1C1A",
        mint:"#8FD9B6",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};