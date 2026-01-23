/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      spacing: {
        3.5: "0.875rem",
        4.5: "1.125rem",
      },
      colors: {
        gray: {
          350: "#a1a1aa",
        },
        // Dojo Genesis color palette
        dojo: {
          // Background & Structure
          "bg-primary": "#0a1e2e",
          "bg-secondary": "#0f2a3d",
          "bg-tertiary": "#143847",
          // Accent Colors
          "accent-primary": "#f4a261",
          "accent-secondary": "#e76f51",
          "accent-tertiary": "#ffd166",
          // Neutral Tones
          "neutral-dark": "#1a3a4a",
          "neutral-mid": "#4a6a7a",
          "neutral-light": "#8aa8b8",
          // Text Colors
          "text-primary": "#ffffff",
          "text-secondary": "#d4e4ed",
          "text-tertiary": "#8aa8b8",
          "text-accent": "#f4a261",
          // Semantic Colors
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        accent: ["Outfit", "Inter", "sans-serif"],
        brand: ["Outfit", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Courier New", "monospace"],
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
      },
      borderRadius: {
        "dojo-sm": "6px",
        "dojo-md": "8px",
        "dojo-lg": "12px",
        "dojo-xl": "16px",
      },
      boxShadow: {
        "dojo-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        "dojo-md":
          "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
        "dojo-lg":
          "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)",
        "dojo-xl":
          "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        "dojo-2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        "dojo-glow": "0 0 20px rgba(244, 162, 97, 0.3)",
        "dojo-glow-strong": "0 0 30px rgba(244, 162, 97, 0.5)",
      },
      backdropBlur: {
        dojo: "12px",
        "dojo-strong": "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "slide-down": "slideDown 0.25s ease-out",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(244, 162, 97, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(244, 162, 97, 0.5)" },
        },
      },
      transitionTimingFunction: {
        natural: "cubic-bezier(0.4, 0.0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
