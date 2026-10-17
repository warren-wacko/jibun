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
  { id: "pearl", label: "Pearl", group: "palette", accent: "#f4f4f2", onAccent: "#111315" },
  { id: "graphite", label: "Graphite", group: "palette", accent: "#202328", onAccent: "#f4f4f2" },
  // The scrapbook design's tomato (#e8604c) is 3.4:1 against white text; this one is 4.7:1 (WCAG AA).
  { id: "tomato", label: "Tomato", group: "palette", accent: "#d43e2b", onAccent: "#ffffff" },
  { id: "sage", label: "Sage", group: "palette", accent: "#a9c4a0", onAccent: "#111315" },
  { id: "butter", label: "Butter", group: "palette", accent: "#f6d55c", onAccent: "#111111" },
  // The design's #e5382b is 4.3:1 against white text; this one step darker red is 4.6:1 (WCAG AA).
  { id: "cherry", label: "Cherry", group: "palette", accent: "#dc3226", onAccent: "#ffffff" },
  { id: "cobalt", label: "Cobalt", group: "palette", accent: "#2f54eb", onAccent: "#ffffff" },
  { id: "matcha", label: "Matcha", group: "palette", accent: "#a3c585", onAccent: "#111111" },
  { id: "bubblegum", label: "Bubblegum", group: "palette", accent: "#f7a8c4", onAccent: "#111111" },
  { id: "tangerine", label: "Tangerine", group: "palette", accent: "#ff8a3d", onAccent: "#111111" },
  { id: "yellow", label: "Yellow", group: "palette", accent: "#ffd43b", onAccent: "#111315" },
  { id: "mint", label: "Mint", group: "palette", accent: "#7ce0a3", onAccent: "#111315" },
  { id: "pink", label: "Pink", group: "palette", accent: "#ff8fb1", onAccent: "#111315" },
  { id: "sky", label: "Sky", group: "palette", accent: "#7cc4ff", onAccent: "#111315" },
  { id: "orange", label: "Orange", group: "palette", accent: "#ffa552", onAccent: "#111315" },
  { id: "lilac", label: "Lilac", group: "palette", accent: "#c8a6ff", onAccent: "#111315" },
  { id: "navy", label: "Navy", group: "palette", accent: "#0f2a4a", onAccent: "#ffffff" },
  { id: "blue", label: "Blue", group: "palette", accent: "#2563eb", onAccent: "#ffffff" },
  { id: "teal", label: "Teal", group: "palette", accent: "#0f766e", onAccent: "#ffffff" },
  { id: "green", label: "Green", group: "palette", accent: "#15803d", onAccent: "#ffffff" },
  { id: "forest", label: "Forest", group: "palette", accent: "#2f6b4f", onAccent: "#ffffff" },
  { id: "emerald", label: "Emerald", group: "palette", accent: "#047857", onAccent: "#ffffff" },
  { id: "burgundy", label: "Burgundy", group: "palette", accent: "#7f1d1d", onAccent: "#ffffff" },
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

const FALLBACK_PRESET_ID = "blue";

/** (0.2126 R + 0.7152 G + 0.0722 B) / 255 on the raw sRGB values: the quick "is this light or dark" measure the designs use. */
function lumaOf(hex: string): number {
  const h = expandHex(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return Math.round(((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * 1000) / 1000;
}

/**
 * Resolve a stored accent (hex or preset id) to the CSS values a page needs. Unknown ids fall back to blue.
 * `tone` says whether the accent is a light or dark surface (templates that paint a card in the accent
 * use it to pick glare and blend settings).
 */
export function resolveAccent(accent: string): {
  accent: string;
  onAccent: string;
  tone: "light" | "dark";
  /** Is the accent readable as text/graphics (3:1) on a near-white page? On a near-black page? */
  readableOnLight: boolean;
  readableOnDark: boolean;
  /** Is the accent readable as small text (4.5:1) on a near-white page? On a near-black one? Templates mix it toward the text colour when not. */
  textOnLight: boolean;
  textOnDark: boolean;
  /** Simple 0-1 brightness (sRGB weighted, not WCAG luminance). Templates can branch on it in CSS maths. */
  luma: number;
} {
  let resolved: { accent: string; onAccent: string };
  if (HEX.test(accent)) {
    const hex = expandHex(accent);
    const onAccent = contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#0e1013") ? "#ffffff" : "#0e1013";
    resolved = { accent: hex, onAccent };
  } else {
    const preset =
      ACCENT_PRESETS.find((p) => p.id === accent) ?? ACCENT_PRESETS.find((p) => p.id === FALLBACK_PRESET_ID)!;
    resolved = { accent: preset.accent, onAccent: preset.onAccent };
  }
  return {
    ...resolved,
    tone: luminance(resolved.onAccent) < 0.5 ? "light" : "dark",
    readableOnLight: contrastRatio(resolved.accent, "#ffffff") >= 3,
    readableOnDark: contrastRatio(resolved.accent, "#0e1013") >= 3,
    textOnLight: contrastRatio(resolved.accent, "#f4f5f7") >= 4.5,
    textOnDark: contrastRatio(resolved.accent, "#17191c") >= 4.5,
    luma: lumaOf(resolved.accent),
  };
}
