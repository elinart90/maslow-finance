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
        brand: {
          50: "#f8f8f6",
          100: "#f0f0ec",
          900: "#111827",
        },
        tier1: { DEFAULT: "#DC2626", light: "#FEF2F2", dark: "#991B1B" },
        tier2: { DEFAULT: "#EA580C", light: "#FFF7ED", dark: "#9A3412" },
        tier3: { DEFAULT: "#D97706", light: "#FFFBEB", dark: "#92400E" },
        tier4: { DEFAULT: "#16A34A", light: "#F0FDF4", dark: "#14532D" },
        tier5: { DEFAULT: "#2563EB", light: "#EFF6FF", dark: "#1E3A8A" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
