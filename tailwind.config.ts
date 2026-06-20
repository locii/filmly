import type { Config } from "tailwindcss";

/**
 * Palette — "Deep Space" cinematic theme
 *   Deep Space Blue  #003049  — navy base / surfaces
 *   Flag Red         #d62828  — bold / destructive accent
 *   Princeton Orange #f77f00  — primary action accent
 *   Sunflower Gold   #fcbf49  — ratings / highlights
 *   Vanilla Custard  #eae2b7  — warm light accent
 *
 * Neutrals stay on Tailwind's default dark zinc. The accent scales the app
 * already uses (amber/yellow/red) are overridden to the palette so every
 * component re-skins without touching markup. Named colors are added for
 * intentional use (e.g. vanilla highlights).
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Named palette
        "space-blue": "#003049",
        "flag-red": "#d62828",
        princeton: "#f77f00",
        sunflower: "#fcbf49",
        vanilla: "#eae2b7",

        // Primary accent — Princeton Orange, with Sunflower Gold as the light step
        brand: {
          light: "#fcbf49",
          DEFAULT: "#f77f00",
          dark: "#d96b00",
        },

        // Primary accent ramp — Princeton Orange (500)
        amber: {
          50: "#fff4e6",
          100: "#ffe3bf",
          200: "#ffce8c",
          300: "#ffb259",
          400: "#fb9a2e",
          500: "#f77f00",
          600: "#d96b00",
          700: "#b35702",
          800: "#8a4308",
          900: "#6f370b",
        },

        // Highlight ramp — Sunflower Gold (400)
        yellow: {
          50: "#fffaed",
          100: "#fef3cf",
          200: "#fde7a0",
          300: "#fdd470",
          400: "#fcbf49",
          500: "#f7a823",
          600: "#db8615",
          700: "#b56410",
          800: "#934f14",
          900: "#784115",
        },

        // Destructive ramp — Flag Red (500)
        red: {
          50: "#fdecec",
          100: "#f9caca",
          200: "#f29c9c",
          300: "#ea6d6d",
          400: "#e34646",
          500: "#d62828",
          600: "#b81f1f",
          700: "#971a1a",
          800: "#7a1818",
          900: "#661818",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
