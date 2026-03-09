/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        manso: {
          black: "#1D1D1B",    // Neutral Black
          blue: "#030044",     // King Blue
          terra: "#BC2915",    // Terra Espresso original
          olive: "#868229",    // Olive
          cream: "#FFFCDC",    // Cream
          brown: "#542C1B",    // Brown
          white: "#FFFFFF",    // White
        }
      },
      fontFamily: {
        // Priorizamos Helvetica Neue Pro como indica el manual de marca
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}