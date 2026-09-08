import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1E33",
        marine: "#123A57",
        teal: "#1C6E71",
        royal: "#291B8D",
        royalLight: "#9AA3EC",
        paper: "#E3F2FD",
        paperdim: "#E7EAE1",
        line: "#C7CCC3",
        signal: "#C1272D",
        honey: "#B76E00",
        success: "#1F7A4D",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(241,243,237,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(241,243,237,0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
