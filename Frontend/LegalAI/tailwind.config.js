/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Urbanist", "sans-serif"],
        sans: ["Outfit", "serif"],
        roboto: ["Roboto", "Arial", "sans-serif"],
        limelight: ["Limelight", "cursive"],
        sen: ["Sen", "sans-serif"], // Fixed typo: "san-serif" → "sans-serif"
        Raj: ["Rajdhani", "sans-serif"],
        jak: ["Plus Jakarta Sans", "sans-serif"],
        OnColos: ["Golos", "sans-serif"],
        Rufina: ["Rufina", "sans"],
        jost: ["Jost", "sans-serif"],
        Marcellus: ["Marcellus", "sans-serif"],
        Urbanist: ["Urbanist", "sans-serif"],
        Bebas: ["Bebas Neue", "sans-serif;"],
        Prata: ["Prata", "sans-serif"],
      },
    },
  },
  plugins: [],
}

