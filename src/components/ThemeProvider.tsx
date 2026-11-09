"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = { dark: boolean; toggle: () => void };
const ThemeContext = createContext<ThemeContextType>({ dark: true, toggle: () => undefined });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const saved = window.localStorage.getItem("fiche-chute-theme");
    setDark(saved ? saved === "dark" : true);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("fiche-chute-theme", dark ? "dark" : "light");
  }, [dark]);
  return <ThemeContext.Provider value={{ dark, toggle: () => setDark((value) => !value) }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
