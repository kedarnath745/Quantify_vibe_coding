import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const systemQuery = () => window.matchMedia?.("(prefers-color-scheme: light)");

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Current theme and a toggle. index.html sets data-theme before React loads; this keeps it in
 * sync, saves explicit choices, and follows the system setting until the user picks one.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const query = systemQuery();
    if (!query) return;
    const onChange = (e) => {
      if (!readSaved()) setTheme(e.matches ? "light" : "dark");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the choice then lasts for this visit only.
    }
  };

  return { theme, toggleTheme };
}
