import { SECTION_ADD_ON } from "@/lib/entitlements";
import type { SectionKind } from "@/lib/page-schema";

/**
 * The optional sections each template has a styled design for, taken from its Standard design file. A template that
 * is not listed does not draw optional sections yet; a listed template skips any other kind a page might have. More
 * kinds are added here as their designs arrive. This file is safe for client code.
 */
export const SUPPORTED_SECTIONS: Record<string, readonly SectionKind[]> = {
  "pro-classic": ["gallery", "portfolio", "services", "resume", "experience", "skills", "stats", "video", "booking"],
  "pro-magazine": ["gallery", "portfolio", "services", "resume", "experience", "skills", "stats", "video", "booking"],
  "pro-signature": ["gallery", "portfolio", "services", "resume", "experience", "skills", "stats", "video", "booking"],
  "pro-company": ["gallery", "portfolio", "services", "resume", "experience", "skills", "stats", "video", "booking"],
  // The notebook's Standard design has projects (portfolio), skills, wins and orgs (orgs) and a résumé button.
  "student-notebook": ["portfolio", "skills", "orgs", "resume", "video", "booking"],
  // The bento's Standard design: an interests band, a record player, a photo dump and org chips.
  "social-bento": ["interests", "song", "gallery", "orgs", "video", "booking"],
  // The scrapbook's Standard design: a tape of interests, a record on kraft paper, a photo dump and org tickets.
  "social-scrapbook": ["interests", "song", "gallery", "orgs", "video", "booking"],
  // The minimalist's Standard design: serif interests, a record tile, a photo dump and org pills.
  "social-minimalist": ["interests", "song", "gallery", "orgs", "video", "booking"],
};

export const supportedSections = (templateKey: string): readonly SectionKind[] => SUPPORTED_SECTIONS[templateKey] ?? [];

/**
 * The kinds a page draws, in the page's design. The Standard design draws every kind the template supports. The
 * Starter design draws only the ones a paid add-on unlocks (gallery, video, PDF, booking), so a Starter client who
 * buys an add-on sees it; the free "pick 2" sections stay a Standard feature.
 */
export const drawnKinds = (templateKey: string, kinds: readonly SectionKind[], design: "starter" | "standard"): SectionKind[] => {
  const ok = supportedSections(templateKey);
  return kinds.filter((k) => ok.includes(k) && (design === "standard" || SECTION_ADD_ON[k] !== undefined));
};

/** The kinds in `kinds` that this template has no design for (they are saved but not shown). */
export const unsupportedSections = (templateKey: string, kinds: readonly SectionKind[]): SectionKind[] => {
  const ok = supportedSections(templateKey);
  return kinds.filter((k) => !ok.includes(k));
};
