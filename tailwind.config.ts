import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        bg: {
          page: "#FAFBFC",
          card: "#FFFFFF",
          subtle: "#F1F5F9",
        },
        primary: {
          DEFAULT: "#0D9488",
          hover: "#0F766E",
          soft: "#E6F7F5",
        },
        accent: {
          DEFAULT: "#38BDF8",
          soft: "#E0F7FF",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        success: {
          DEFAULT: "#10B981",
          soft: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          soft: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#EF4444",
          soft: "#FEE2E2",
        },
        info: {
          DEFAULT: "#3B82F6",
          soft: "#EFF6FF",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
      },
      fontSize: {
        body: ["15px", { lineHeight: "1.6" }],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
