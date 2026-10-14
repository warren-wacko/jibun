import type { CSSProperties, ReactNode } from "react";
import { resolveAccent } from "@/lib/accents";
import type { Theme } from "./types";

/** Applies the light/dark variable set and the page's accent to everything inside it. */
export function ThemeScope({
  theme,
  accent,
  children,
}: {
  theme: Theme;
  accent: string;
  children: ReactNode;
}) {
  const resolved = resolveAccent(accent);
  const style = {
    "--accent": resolved.accent,
    "--on-accent": resolved.onAccent,
  } as CSSProperties;
  return (
    <div data-theme={theme} style={style} className="min-h-screen bg-bg text-ink">
      {children}
    </div>
  );
}
