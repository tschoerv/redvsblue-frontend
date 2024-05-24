import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      backgroundColor: theme => ({
        'bitcoinorange': '#f28e14',
        'teamRedRed': '#f31260',
        'teamBlueBlue': '#006fee'
      }),

      colors:{
        'bitcoinorange': '#f28e14'
      },
    },

  },
  plugins: [nextui()]
};
