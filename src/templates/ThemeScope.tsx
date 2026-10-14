"use client";

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { resolveAccent } from "@/lib/accents";
import { TILE } from "@/components/tile";
import type { Theme } from "./types";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

/**
 * Applies the light/dark variable set and the page's accent to everything inside it.
 * `theme` is the page's default; the visitor can flip it with <ThemeToggle /> (not saved).
 */
export function ThemeScope({
  theme: defaultTheme,
  accent,
  children,
}: {
  theme: Theme;
  accent: string;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const resolved = resolveAccent(accent);
  const style = {
    "--accent": resolved.accent,
    "--on-accent": resolved.onAccent,
  } as CSSProperties;
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) }}>
      <div data-theme={theme} style={style} className="min-h-screen bg-bg text-ink">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;
  const next = ctx.theme === "light" ? "dark" : "light";
  return (
    <button type="button" onClick={ctx.toggle} className={`${TILE} self-end`}>
      Switch to {next} theme
    </button>
  );
}
