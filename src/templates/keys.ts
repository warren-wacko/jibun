/** The templates an admin can pick, without importing the templates themselves (this file is safe for client code). */
export type TemplateOption = { key: string; label: string; group: "Professional" | "Student" | "Social"; blurb: string };

export const TEMPLATE_OPTIONS: readonly TemplateOption[] = [
  { key: "pro-classic", label: "Classic", group: "Professional", blurb: "Holographic card that flips to a QR code" },
  { key: "pro-magazine", label: "Magazine", group: "Professional", blurb: "Full-bleed cover photo and a giant name" },
  { key: "pro-signature", label: "Signature", group: "Professional", blurb: "Flip card, ticker line and handwritten signature" },
  { key: "pro-company", label: "Company", group: "Professional", blurb: "Company logo slot and an arched photo" },
  { key: "student-notebook", label: "Notebook", group: "Student", blurb: "Grid paper, taped QR polaroid, sticky notes" },
  { key: "social-bento", label: "Bento", group: "Social", blurb: "Bento tiles with a big Instagram tile" },
  { key: "social-scrapbook", label: "Scrapbook", group: "Social", blurb: "Taped photo, cutout letters, ticket button" },
  { key: "social-minimalist", label: "Minimalist", group: "Social", blurb: "Huge first name and serif accents" },
];

export const TEMPLATE_KEYS: readonly string[] = TEMPLATE_OPTIONS.map((t) => t.key);

/** A one-off component made for a CUSTOM client, e.g. "custom-maria". */
export const CUSTOM_TEMPLATE_RE = /^custom-[a-z0-9-]{2,40}$/;
