"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "hl-theme";

/**
 * Koyu ↔ açık tema düğmesi.
 *
 * Tema, <html data-theme="..."> üzerinden yürür. İlk boyamadan önce
 * layout'taki satır içi betik (bkz. app/layout.tsx) kaydedilmiş tercihi
 * uygular; bu bileşen yalnızca değiştirme işini üstlenir. İki ikon da
 * DOM'da durur, hangisinin görüneceğine CSS karar verir — böylece
 * hydration uyuşmazlığı ve ikon zıplaması olmaz.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current: Theme =
      document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration sonrası gerçek tema ile eşitleme
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);

    const root = document.documentElement;
    if (next === "light") root.setAttribute("data-theme", "light");
    else root.setAttribute("data-theme", "dark");

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* localStorage kapalı olabilir (gizli sekme) — tema yine de çalışır */
    }
  }

  const label = theme === "light" ? "Koyu temaya geç" : "Açık temaya geç";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`hl-theme-toggle ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      <Sun size={20} className="hl-theme-icon hl-theme-icon--sun" aria-hidden />
      <Moon size={20} className="hl-theme-icon hl-theme-icon--moon" aria-hidden />
    </button>
  );
}
