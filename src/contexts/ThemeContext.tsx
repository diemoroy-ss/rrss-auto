"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved preference from localStorage or system preference
    const saved = localStorage.getItem("santisoft_theme") as Theme | null;
    const initialTheme = saved === "light" || saved === "dark" ? saved : "dark";
    
    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("santisoft_theme", newTheme);
    applyTheme(newTheme);

    // If user is logged in, save to their firestore document
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          themePreference: newTheme,
        });
      } catch (err) {
        console.warn("Could not save theme preference to firestore:", err);
      }
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
