import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "ink" = page background. Was near-black; now a lively off-white.
        ink: "#FAFAF8",
        // "surface"/"charcoal" = alternating section backgrounds — a
        // light warm grey. Both names point at the same value so
        // existing bg-charcoal usages and new bg-surface usages agree.
        charcoal: "#F1EFE9",
        surface: "#F1EFE9",
        // "line" = hairline borders — dark-on-light now, same token name.
        line: "rgba(20,20,22,0.10)",
        // "paper" = primary text color AND primary button fill. Was
        // light (assumed dark bg); now near-black, so `text-paper` and
        // `bg-paper text-ink` (used throughout for CTAs) both keep
        // working and read correctly as dark-on-light.
        paper: "#14151A",
        fog: "#68666B",
        accent: {
          // Vivid sport blue — the primary energetic accent.
          DEFAULT: "#2F5CFF",
          dim: "rgba(47,92,255,0.12)",
        },
        // Secondary "energy" accent — used sparingly in the hero, the
        // release countdown, and spotlight motion. Not retrofitted into
        // every badge; one bold color kept for a few deliberate moments.
        volt: {
          DEFAULT: "#C8FF3D",
          dim: "rgba(200,255,61,0.16)",
        },
        // Dark "chrome" palette — used only by Header, Footer, Hero,
        // MobileMenu, SearchOverlay, Newsletter, and the promo bar.
        // These stay intentionally dark as contrast against the light
        // body per the brief ("black/charcoal for contrast").
        chrome: "#0B0C0E",
        "chrome-surface": "#17181C",
        "chrome-line": "rgba(255,255,255,0.12)",
        "chrome-fog": "#9A9CA3",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
