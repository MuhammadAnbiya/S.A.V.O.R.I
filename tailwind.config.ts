// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ambil nilai ini dari DESIGN.md kamu
        primary: {
          DEFAULT: "#1A3C5E",
          light: "#2E5C8F",
        },
        accent: "#E8863A",
        success: "#27AE60",
        warning: "#F39C12",
        danger: "#E74C3C",
        "ai-purple": "#6C3483",
        bg: {
          main: "#F4F6F9",
          card: "#FFFFFF",
        },
        text: {
          primary: "#1C2833",
          secondary: "#5D6D7E",
        },
        border: "#D5D8DC",
      },
      fontFamily: {
        sans: ["Arial", "sans-serif"],
        mono: ["Courier New", "monospace"],
      },
      // Tambahkan spacing, borderRadius, boxShadow
      // dari DESIGN.md kamu di sini
    },
  },
  plugins: [],
};

export default config;