import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#0FB7B0",
          light: "#4AD3D1",
        },
        mint: "#B5F3F2",
        navy: "#0B2B33",
        // Muted amber: used only as the "flagged" result accent (ALS).
        // Deliberately warm-but-desaturated rather than red, to stay clinical.
        amber: {
          DEFAULT: "#C07A2B",
          light: "#F1DBB8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(15, 183, 176, 0.35)" },
          "100%": { boxShadow: "0 0 0 8px rgba(15, 183, 176, 0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
