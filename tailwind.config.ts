// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Anthropic/Claude design system ───────────────────
        coral:          "#cc785c",
        "coral-active": "#a9583e",
        canvas:         "#faf9f5",
        "surface-soft": "#f5f0e8",
        "surface-card": "#efe9de",
        "surface-cream":"#e8e0d2",
        "surface-dark": "#181715",
        "surface-dark-elevated": "#252320",
        "surface-dark-soft": "#1f1e1b",
        ink:            "#141413",
        "body-strong":  "#252523",
        body:           "#3d3d3a",
        muted:          "#6c6a64",
        "muted-soft":   "#8e8b82",
        "on-dark":      "#faf9f5",
        "on-dark-soft": "#a09d96",
        hairline:       "#e6dfd8",
        "hairline-soft":"#ebe6df",
        teal:           "#5db8a6",
        amber:          "#e8a55a",

        // ── Back-compat aliases for existing components ────────
        primary: {
          DEFAULT: "#cc785c",
          light:   "#d4896f",
          hover:   "#a9583e",
        },
        accent:  "#5db8a6",
        success: "#5db872",
        warning: "#d4a017",
        danger:  "#c64545",
        bg: {
          main: "#faf9f5",
          card: "#efe9de",
        },
        text: {
          primary:   "#141413",
          secondary: "#6c6a64",
        },
        border: "#e6dfd8",
        main:   "#faf9f5",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "Tiempos Headline", "EB Garamond", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: {
        xs:   "4px",
        sm:   "6px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        pill: "9999px",
      },
      spacing: {
        section: "6rem", // 96px section rhythm
      },
    },
  },
  plugins: [],
};

export default config;