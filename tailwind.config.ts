import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fond bleuté très clair sur lequel les cartes blanches flottent.
        canvas: "#e8effc",
        brand: {
          50: "#eef4ff",
          100: "#dbe7fe",
          200: "#bed4fd",
          300: "#92b8fa",
          400: "#5f93f4",
          500: "#2d70e8",
          600: "#1a58d6",
          700: "#1546ad",
          800: "#153c8b",
          900: "#16356e",
        },
        // Bout clair du dégradé de la jauge circulaire.
        aqua: "#22cfee",
      },
      boxShadow: {
        // Ombres larges et très diffuses : les cartes flottent, elles ne
        // s'appuient pas sur une bordure.
        card: "0 10px 30px -12px rgba(21, 60, 139, 0.18)",
        float: "0 20px 45px -18px rgba(21, 60, 139, 0.28)",
        pill: "0 10px 22px -8px rgba(29, 111, 228, 0.55)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
