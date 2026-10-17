/**
 * Font pairs a Standard (or Custom) page can choose, per template. They come from the Standard design files:
 * only the four professional templates offer them; the social and student designs have a single font set.
 * `style.fontPair` stores the pair's id; no id means the template's own fonts. This file is safe for client code.
 */
export type FontPair = {
  id: string;
  label: string;
  /** Font names, for the picker. */
  heading: string;
  body: string;
};

const EDITORIAL: FontPair = { id: "editorial", label: "Editorial", heading: "Fraunces", body: "Manrope" };
const TECHNICAL: FontPair = { id: "technical", label: "Technical", heading: "Space Grotesk", body: "Space Grotesk" };
const BOLD: FontPair = { id: "bold", label: "Bold", heading: "Syne", body: "DM Sans" };

export const FONT_PAIRS: Record<string, readonly FontPair[]> = {
  "pro-classic": [EDITORIAL, TECHNICAL, BOLD],
  "pro-signature": [EDITORIAL, TECHNICAL, BOLD],
  "pro-magazine": [
    { id: "vogue", label: "Vogue", heading: "Playfair Display", body: "DM Sans" },
    { id: "tabloid", label: "Tabloid", heading: "Anton", body: "Work Sans" },
    { id: "indie", label: "Indie", heading: "Fraunces", body: "Manrope" },
  ],
  "pro-company": [
    { id: "classic", label: "Classic", heading: "Source Serif 4", body: "Source Sans 3" },
    { id: "modern", label: "Modern", heading: "Manrope", body: "Manrope" },
    { id: "executive", label: "Executive", heading: "IBM Plex Sans", body: "IBM Plex Sans" },
  ],
};

/** What a page uses when no pair is chosen. */
export const DEFAULT_FONTS: Record<string, string> = {
  "pro-classic": "Bricolage Grotesque",
  "pro-signature": "Plus Jakarta Sans",
  "pro-magazine": "Archivo (condensed)",
  "pro-company": "Inter",
  "student-notebook": "the template's own fonts",
  "social-bento": "the template's own fonts",
  "social-scrapbook": "the template's own fonts",
  "social-minimalist": "the template's own fonts",
};

export const fontPairsFor = (templateKey: string): readonly FontPair[] => FONT_PAIRS[templateKey] ?? [];

export const findFontPair = (templateKey: string, id: string): FontPair | undefined => fontPairsFor(templateKey).find((p) => p.id === id);

/**
 * Templates that already apply a chosen pair. The editor says so for the others, so nobody expects the pair to show on a
 * template whose Standard design is not built yet. Add a template here when its pairs are applied.
 */
export const TEMPLATES_WITH_FONT_PAIRS: ReadonlySet<string> = new Set<string>(["pro-classic", "pro-magazine", "pro-signature", "pro-company"]);
