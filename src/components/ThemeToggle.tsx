"use client";

import React from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema claro / oscuro"
      title={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-sm ${
        theme === "dark"
          ? "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-amber-300 hover:text-amber-200 shadow-slate-950/50"
          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-slate-200/50"
      } ${className}`}
    >
      <span>{theme === "dark" ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">
        {theme === "dark" ? "Oscuro" : "Claro"}
      </span>
    </button>
  );
}
