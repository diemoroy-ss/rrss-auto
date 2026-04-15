import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
      colors: {
        // Nuevos colores para mayor contraste
        'brand-blue': '#3B82F6', // Un azul más puro y brillante
        'brand-cyan': '#22D3EE', // Un cian más vivo
        'brand-indigo': '#6366F1', // Un índigo vibrante
        'card-bg': '#0F172A', // Slate-900 para tarjetas sobre fondo negro
      },
      fontFamily: {
        'ag-display': ['var(--font-space)', 'sans-serif'],
        'ag-body': ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;