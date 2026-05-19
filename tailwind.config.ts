import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070A12",
        ink: "#070A12",
        panel: "#0E1422",
        line: "rgba(255,255,255,0.08)",
        accent: "#4C8DFF",
        accent2: "#9A6BFF",
        accent3: "#3DE0C2",
        text: "#E8EDF7",
        muted: "#8A93A6",
        faint: "#5A6072",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "68rem",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
