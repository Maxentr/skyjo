import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  safelist: [
    "grid-rows-1",
    "grid-rows-2",
    "grid-rows-3",
    "grid-rows-4",
    "grid-rows-5",
    "grid-rows-6",
    "animate-wizz",
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
        smh: { raw: "(min-height: 600px)" },
        mdh: { raw: "(min-height: 690px)" },
        lgh: { raw: "(min-height: 800px)" },
        xlh: { raw: "(min-height: 900px)" },
      },
      colors: {
        card: {
          discard: "#dc2626",
          "not-visible": "#fefdf7",
          negative: "#5992E7",
          neutral: "#A0C4FF",
          low: "#7ACE7A",
          medium: "#F3E948",
          high: "#F56E6E",
        },
        body: "#F8F7EB",
        button: "#F6E9C9",
        container: "#fefdf7",

        dark: {
          card: {
            empty: "#C5C5C2",
            discard: "#BC2323",
            "not-visible": "#5A5A58",
            negative: "#517FC3",
            neutral: "#8AA7D6",
            low: "#6CAE6C",
            medium: "#CCC444",
            high: "#CE6262",
          },
          body: "#1C1C1C",
          container: "#242424",
          input: "#222222",
          button: "#1A1A1A",
          font: "#D2D2D2",
          border: "#898989",
          focus: "#404040",
        },
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
        "small-bounce": {
          "0%, 100%": {
            transform: "translateY(-10%)",
            "animation-timing-function": "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "none",
            "animation-timing-function": "cubic-bezier(0,0,0.2,1)",
          },
        },
        wizz: {
          "5%": {
            transform: "translate(7px, 7px)",
          },
          "10%": {
            transform: "translateY(-7px)",
          },
          "15%": {
            transform: "translate(-1px, 5px)",
          },
          "20%": {
            transform: "translate(-6px, 8px)",
          },
          "25%": {
            transform: "translate(-5px, -7px)",
          },
          "30%": {
            transform: "translate(6px, 7px)",
          },
          "35%": {
            transform: "translate(9px, -6px)",
          },
          "40%": {
            transform: "translate(-3px, 9px)",
          },
          "45%": {
            transform: "translate(-3px, 4px)",
          },
          "50%": {
            transform: "translate(-3px, 1px)",
          },
          "55%": {
            transform: "translate(-8px, 3px)",
          },
          "60%": {
            transform: "translate(7px, 3px)",
          },
          "65%": {
            transform: "translate(-1px)",
          },
          "70%": {
            transform: "translate(7px, -4px)",
          },
          "75%": {
            transform: "translate(-2px, -8px)",
          },
          "80%": {
            transform: "translateY(-9px)",
          },
          "85%": {
            transform: "translate(-6px, 7px)",
          },
          "90%": {
            transform: "translate(9px, 1px)",
          },
          "95%": {
            transform: "translate(-9px, 7px)",
          },
          "100%": {
            transform: "translateY(7px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        scale: "scale 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "small-scale": "small-scale 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "small-bounce": "small-bounce 1s infinite",
        wizz: "wizz 1s",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar")],
  variants: {
    height: ["responsive"],
  },
  ...(process.env.NEXT_PUBLIC_ENVIRONMENT === "PROD" ? { cssnano: {} } : {}),
} satisfies Config

export default config
