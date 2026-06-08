import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0d0d0d",
          surface: "#141414",
          elevated: "#1e1e1e",
          card: "#191919",
        },
        accent: {
          DEFAULT: "#4a7c59",
          light: "#5a9668",
          dark: "#35573e",
          muted: "#2a4a33",
        },
        gold: {
          DEFAULT: "#c9a96e",
          light: "#dfc087",
          dark: "#a88a4e",
          muted: "#3d2e15",
        },
        ink: {
          DEFAULT: "#f5f0e8",
          muted: "#9a9480",
          dim: "#6a6459",
        },
        "border-default": "#252525",
        "border-light": "#333333",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
