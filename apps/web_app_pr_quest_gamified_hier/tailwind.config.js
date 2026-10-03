/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linen: "#F9F6F0",
        terracotta: {
          DEFAULT: "#C35832",
          dark: "#A84725",
          light: "#FBEFEF",
        },
        sage: {
          DEFAULT: "#4F6D56",
          dark: "#3D5643",
          light: "#F4F8F5",
        },
        ochre: {
          DEFAULT: "#D08A29",
          dark: "#B5731D",
          light: "#FFFDF9",
        },
        charcoal: "#242220",
        pecan: "#6B635A",
        sand: "#E6E0D5",
      },
    },
  },
  plugins: [],
};
