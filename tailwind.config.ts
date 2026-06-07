import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcd9ff",
          300: "#8ec1ff",
          400: "#599fff",
          500: "#337bff",
          600: "#1c5cf5",
          700: "#1547e1",
          800: "#183cb6",
          900: "#19378f",
          950: "#142357",
        },
      },
    },
  },
  plugins: [],
};

export default config;
