import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#172d2b",
        forest: "#23665d",
        mint: "#dff3ea",
        sand: "#f6f7f3",
      },
      boxShadow: { card: "0 8px 30px rgba(23,45,43,.07)" },
    },
  },
  plugins: [],
};
export default config;
