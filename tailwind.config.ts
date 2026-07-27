import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#146b3a",
        ember: "#b3261e",
        gold: "#f4b400",
        ink: "#18221d"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(24, 34, 29, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
