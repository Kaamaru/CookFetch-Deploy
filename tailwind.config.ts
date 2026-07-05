import type { Config } from "tailwindcss";

export default {
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
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        red: {
          50: "#FFF5F5",
          100: "#FFE3E3",
          200: "#FFBDBD",
          300: "#FF9B9B",
          400: "#FF6F60",
          500: "#E53935",
          600: "#C62828",
          700: "#B71C1C",
          800: "#8E1616",
          900: "#5F0F0F",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // More refined, cohesive entrance animations used site-wide.
        // These add a subtle scale, smoother timing and slightly different
        // easing to feel modern and less 'floaty'.
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(8px) scale(0.995)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(18px) scale(0.995)",
          },
          "60%": {
            opacity: "0.9",
            transform: "translateY(6px) scale(0.997)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        // unified page entrance that combines fade + slide with a gentle pop
        "page-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(14px) scale(0.995)",
          },
          "80%": {
            opacity: "0.98",
            transform: "translateY(2px) scale(0.998)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "bounce-gentle": {
          "0%, 20%, 50%, 80%, 100%": {
            transform: "translateY(0)",
          },
          "40%": {
            transform: "translateY(-5px)",
          },
          "60%": {
            transform: "translateY(-3px)",
          },
        },
        "scan-laser": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(190px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // page-level entrance
        "page-in": "page-in 480ms cubic-bezier(0.16, 1, 0.3, 1)",
        // retained helpers for finer-grained usage
        "fade-in": "fade-in 420ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slide-up 480ms cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce-gentle": "bounce-gentle 2s infinite",
        "scan-laser": "scan-laser 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
