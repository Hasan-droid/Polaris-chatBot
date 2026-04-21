
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      colors: {
        // Palette pulled from polaris-tek.com CSS (Divi default blue + brand accents)
        polaris: {
          50: "#eff8ff",
          100: "#dbefff",
          200: "#bfe4ff",
          300: "#90d4ff",
          400: "#52bbff",
          500: "#2ea3f2",
          600: "#1d86d6",
          700: "#176bb0",
          800: "#165b91",
          900: "#164c76"
        },
        mint: {
          400: "#93cb52",
          500: "#7fb83f",
          600: "#6aa42f"
        },
        ink: {
          50: "#f7f8fa",
          100: "#eef1f5",
          200: "#d9dee8",
          300: "#b6c0d2",
          400: "#8998b5",
          500: "#67789a",
          600: "#4f5f7d",
          700: "#3e4b64",
          800: "#2b3346",
          900: "#151a26"
        }
      },
      boxShadow: {
        glass: "0 10px 40px rgba(21, 26, 38, 0.35)"
      }
    }
  },
  plugins: []
};

