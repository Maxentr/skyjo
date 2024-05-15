import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        mdh: { raw: "(min-height: 690px)" },
        lgh: { raw: "(min-height: 800px)" },
      },
      colors: {
        card: {
          "dark-blue": "#5992E7",
          "light-blue": "#A0C4FF",
          green: "#7ACE7A",
          yellow: "#F3E948",
          red: "#F56E6E",
        },
        background: "#F8F7EB",
        "dutch-white": "#F6E9C9",
        "off-white": "#fefdf7",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        scale: {
          "0%, 100%": {
            scale: "1",
          },
          "50%": {
            scale: "1.1",
          },
        },
        "small-scale": {
          "0%, 100%": {
            scale: "1",
          },
          "50%": {
            scale: "1.05",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        scale: "scale 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "small-scale": "small-scale 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addVariant }: any) {
      addVariant("notfirefox", ":not(:-moz-any(&))")
    },
  ],
  variants: {
    height: ["responsive"],
  },
} satisfies Config

export default config
