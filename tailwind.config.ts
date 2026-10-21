import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

/**
 * VitaTwin design tokens — LIGHT THEME ONLY (docs/DESIGN.md).
 * No `darkMode`, no `dark:` variants, no dark CSS variables.
 *
 * Contrast note: the brand teal #0D9488 is kept for graphics and large
 * shapes; text and filled buttons use `primary.strong` (#0F766E) so white
 * text and small teal text pass WCAG AA.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-body)",
          "Figtree",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Bricolage Grotesque",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        bg: {
          page: "#FAFBFC",
          card: "#FFFFFF",
          subtle: "#F1F5F9",
          wash: "#EAF6F4",
        },
        primary: {
          DEFAULT: "#0D9488",
          strong: "#0F766E",
          hover: "#115E59",
          soft: "#E6F7F5",
          deep: "#134E4A",
        },
        accent: {
          DEFAULT: "#38BDF8",
          soft: "#E0F7FF",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#586679",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        success: { DEFAULT: "#10B981", soft: "#ECFDF5", ink: "#047857" },
        warning: { DEFAULT: "#F59E0B", soft: "#FEF3C7", ink: "#92400E" },
        danger: { DEFAULT: "#EF4444", soft: "#FEE2E2", ink: "#B91C1C" },
        info: { DEFAULT: "#3B82F6", soft: "#EFF6FF", ink: "#1D4ED8" },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
      },
      keyframes: {
        "ecg-draw": {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
        "node-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.6)" },
        },
      },
      animation: {
        "ecg-draw": "ecg-draw 2.2s cubic-bezier(0.22, 0.61, 0.36, 1) 0.2s both",
        "node-pulse": "node-pulse 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [forms],
} satisfies Config;
