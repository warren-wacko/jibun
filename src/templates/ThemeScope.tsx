"use client";

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { resolveAccent } from "@/lib/accents";
import { TILE } from "@/components/tile";
import type { Theme } from "./types";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

/**
 * Applies the light/dark variable set and the page's accent to everything inside it.
 * `theme` is the page's default; the visitor can flip it with <ThemeToggle /> (not saved).
 * `template` scopes a template's own token overrides (its CSS targets [data-template="..."]).
 * `data-accent-tone` says whether the accent is a light or dark surface. `data-weak-on-light` /
 * `data-weak-on-dark` are set when the accent is too faint to use as text on a near-white or
 * near-black page, so templates can swap in the normal text colour.
 */
export function ThemeScope({
  theme: defaultTheme,
  accent,
  template,
  className,
  children,
}: {
  theme: Theme;
  accent: string;
  template?: string;
  className?: string;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const resolved = resolveAccent(accent);
  const style = {
    "--accent": resolved.accent,
    "--on-accent": resolved.onAccent,
    "--accent-luma": resolved.luma,
  } as CSSProperties;
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) }}>
      <div
        data-theme={theme}
        data-template={template}
        data-accent-tone={resolved.tone}
        data-weak-on-light={resolved.readableOnLight ? undefined : "true"}
        data-weak-on-dark={resolved.readableOnDark ? undefined : "true"}
        style={style}
        className={`min-h-screen bg-bg text-ink ${className ?? ""}`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Flips light/dark for this visit. By default a text tile; pass `className` and a render function
 * as `children` (which receives the current theme) to restyle it. The render function form must be
 * used from a client component.
 */
export function ThemeToggle({
  className,
  children,
}: {
  className?: string;
  children?: (theme: Theme) => ReactNode;
}) {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;
  const next = ctx.theme === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      onClick={ctx.toggle}
      aria-label={`Switch to ${next} theme`}
      className={className ?? `${TILE} self-end`}
    >
      {children ? children(ctx.theme) : `Switch to ${next} theme`}
    </button>
  );
}
