"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dict, type Dict, type Lang } from "@/i18n";

type Theme = "light" | "dark";

type Ctx = {
  lang: Lang;
  t: Dict;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
  setLangTo: (l: Lang) => void;
  setThemeTo: (t: Theme) => void;
};

const SiteContext = createContext<Ctx | null>(null);

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: choice simply is not remembered */
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");
  const [theme, setTheme] = useState<Theme>("light");

  // Sync with what the boot script decided before paint.
  useEffect(() => {
    const root = document.documentElement;
    setLang(root.lang === "en" ? "en" : "es");
    setTheme(root.classList.contains("dark") ? "dark" : "light");

    // Follow OS changes while the user has not picked a theme manually.
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("theme");
      } catch {}
      if (stored) return;
      const next: Theme = e.matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(next);
      setTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setLangTo = useCallback((next: Lang) => {
    document.documentElement.lang = next;
    store("lang", next);
    setLang(next);
  }, []);

  const setThemeTo = useCallback((next: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    store("theme", next);
    setTheme(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangTo(document.documentElement.lang === "en" ? "es" : "en");
  }, [setLangTo]);

  const toggleTheme = useCallback(() => {
    setThemeTo(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setThemeTo]);

  const value = useMemo(
    () => ({ lang, t: dict[lang], toggleLang, theme, toggleTheme, setLangTo, setThemeTo }),
    [lang, theme, toggleLang, toggleTheme, setLangTo, setThemeTo],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <Providers>");
  return ctx;
}
