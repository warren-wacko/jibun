/**
 * Accent presets. Colors only: never school logos, seals or mascots.
 * Starter picks from this list; Standard and above may use any hex.
 */
export type AccentPreset = {
  id: string;
  label: string;
  group: "palette" | "school";
  accent: string;
  /** Second color of a school pair, used for borders or highlights. */
  secondary?: string;
  /** Readable text color on top of `accent`. */
  onAccent: string;
};

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: "blue", label: "Blue", group: "palette", accent: "#2563eb", onAccent: "#ffffff" },
  { id: "teal", label: "Teal", group: "palette", accent: "#0f766e", onAccent: "#ffffff" },
  { id: "green", label: "Green", group: "palette", accent: "#15803d", onAccent: "#ffffff" },
  { id: "amber", label: "Amber", group: "palette", accent: "#b45309", onAccent: "#ffffff" },
  { id: "rose", label: "Rose", group: "palette", accent: "#be123c", onAccent: "#ffffff" },
  { id: "violet", label: "Violet", group: "palette", accent: "#6d28d9", onAccent: "#ffffff" },
  { id: "slate", label: "Slate", group: "palette", accent: "#334155", onAccent: "#ffffff" },
  { id: "school-green-white", label: "Green / White", group: "school", accent: "#166534", secondary: "#ffffff", onAccent: "#ffffff" },
  { id: "school-blue-gold", label: "Blue / Gold", group: "school", accent: "#1e3a8a", secondary: "#f5b700", onAccent: "#ffffff" },
  { id: "school-maroon-gold", label: "Maroon / Gold", group: "school", accent: "#7f1d1d", secondary: "#f5b700", onAccent: "#ffffff" },
];

export const ACCENT_PRESET_IDS = ACCENT_PRESETS.map((p) => p.id);

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHex(hex: string): string {
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
}

function luminance(hex: string): number {
  const h = expandHex(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Resolve a stored accent (hex or preset id) to the CSS values a page needs. Unknown ids fall back to the first preset. */
export function resolveAccent(accent: string): { accent: string; onAccent: string } {
  if (HEX.test(accent)) {
    const hex = expandHex(accent);
    const onAccent = contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#0e1013") ? "#ffffff" : "#0e1013";
    return { accent: hex, onAccent };
  }
  const preset = ACCENT_PRESETS.find((p) => p.id === accent) ?? ACCENT_PRESETS[0];
  return { accent: preset.accent, onAccent: preset.onAccent };
}
