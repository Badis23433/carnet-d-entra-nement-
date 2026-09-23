import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#15171a",
        panel: "#1d2024",
        panel2: "#23262b",
        line: "#33373d",
        ink: "#e9e7e1",
        dim: "#9ea1a7",
        accent: "#4f86a3",
        accentSoft: "#365a6d",
        good: "#7fae6f",
      },
      fontFamily: {
        head: ["var(--font-head)", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
