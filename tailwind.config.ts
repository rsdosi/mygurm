import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface + text tokens
        bg: "#F8F9FB",
        ink: "#14161C",
        muted: "#6B7280",
        line: "#ECEEF3",
        // Duotone accents — "you" (pink) and "me" (blue)
        you: {
          DEFAULT: "#FF5C8A",
          soft: "#FFE6EF",
          ink: "#C42B5C",
        },
        me: {
          DEFAULT: "#3B7DFF",
          soft: "#E4EDFF",
          ink: "#1F55C9",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20, 22, 28, 0.04), 0 8px 24px rgba(20, 22, 28, 0.06)",
        "soft-lg":
          "0 2px 4px rgba(20, 22, 28, 0.04), 0 18px 48px rgba(20, 22, 28, 0.10)",
        "you-glow": "0 12px 32px rgba(255, 92, 138, 0.28)",
        "me-glow": "0 12px 32px rgba(59, 125, 255, 0.28)",
      },
      maxWidth: {
        content: "1120px",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
