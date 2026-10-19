import { buildActions, type Action } from "@/components/ActionRow";
import type { PageData, Section, SectionKind } from "@/lib/page-schema";
import { formatPhone } from "@/lib/phone";
import { groupSocials } from "@/lib/socials";
import { displayUrl, pickFeatured } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds } from "../supported-sections";
import { PAIR_FACES } from "./headline-faces";

/** Cover headline lines: first word on top, the rest below ("Juan / Dela Cruz"). Nothing is dropped. */
export function splitName(fullName: string): [string, string] {
  const words = fullName.trim().split(/\s+/);
  if (words.length < 2) return [words[0] ?? "", ""];
  return [words[0], words.slice(1).join(" ")];
}

/**
 * Width of each capital in the cover headline face (Archivo ExtraBold at 72% width), in em, measured
 * from the rendered font. The headline is sized from these so a line fills the cover without wrapping.
 */
const CHAR_EM: Record<string, number> = {
  "0": 0.479, "1": 0.431, "2": 0.472, "3": 0.477, "4": 0.47, "5": 0.479, "6": 0.479, "7": 0.435, "8": 0.47, "9": 0.479,
  A: 0.565, B: 0.552, C: 0.57, D: 0.569, E: 0.517, F: 0.46, G: 0.607, H: 0.579, I: 0.266, J: 0.48, K: 0.572, L: 0.467,
  M: 0.739, N: 0.582, O: 0.613, P: 0.532, Q: 0.613, R: 0.564, S: 0.518, T: 0.515, U: 0.571, V: 0.54, W: 0.776, X: 0.552,
  Y: 0.546, Z: 0.521,
  " ": 0.256 /* 0.136 glyph + 0.12 word spacing */, "-": 0.264, ".": 0.24, "'": 0.216, "’": 0.219, ",": 0.24, "&": 0.608,
  Á: 0.565, À: 0.565, Ä: 0.565, É: 0.517, È: 0.517, Í: 0.266, Ì: 0.266, Ó: 0.613, Ò: 0.613, Ö: 0.613,
  Ú: 0.571, Ù: 0.571, Ü: 0.571, Ñ: 0.582, Ç: 0.57,
};
/** Anything not in the table (other scripts) is assumed to be as wide as a "W": it can only shrink the text. */
const UNKNOWN_EM = 0.78;
/** The headline's -1.5px letter spacing, as a typical em fraction. */
const TRACKING_EM = -0.015;

/**
 * The same measurements for the Standard font pairs' headline faces (width of each capital in em, the tracking and
 * the width an unknown character is assumed to have). Pairs not listed use the default face above.
 */
type FaceMetrics = { chars: Record<string, number>; tracking: number; unknown: number };

const DEFAULT_FACE: FaceMetrics = { chars: CHAR_EM, tracking: TRACKING_EM, unknown: UNKNOWN_EM };

/** Natural width of a headline line in em, upper-cased as the template displays it. */
export function headlineEm(line: string, pair?: string): number {
  const face = (pair && PAIR_FACES[pair]) || DEFAULT_FACE;
  let total = 0;
  for (const ch of line.toUpperCase()) total += (face.chars[ch] ?? face.unknown) + face.tracking;
  return Math.round(total * 1000) / 1000;
}

/** "Software Engineer · Full-Stack Developer" -> two parts for the dash-separated subtitle. */
export function splitTitle(title: string | undefined): string[] {
  if (!title) return [];
  const [first, ...rest] = title.split(/\s+(?:·|•|\||\/|—|–)\s+/);
  return rest.length ? [first, rest.join(" · ")] : [first];
}

const ROW_ORDER: readonly Action["key"][] = ["call", "text", "email", "directions", "book"];

export type TouchRow = {
  key: Action["key"];
  href: string;
  external?: boolean;
  title: string;
  sub: string;
};

/** Everything the template shows, derived from PageData. Empty things come back empty so they can be left out. */
export function buildMagazineModel(data: PageData, pair?: string) {
  const { profile, contact, socials, sections } = data;
  const booking = sections.find((s) => s.kind === "booking");

  const copy: Record<Action["key"], { title: string; sub: string }> = {
    call: { title: "Call me", sub: contact.phone ? formatPhone(contact.phone) : "" },
    text: { title: "Send a text message", sub: "Opens your messages app" },
    email: { title: "Send an email", sub: contact.email ?? "" },
    directions: { title: "Get directions", sub: contact.officeAddress ?? "" },
    book: { title: "Book a time", sub: booking ? displayUrl(booking.url) : "" },
  };

  const rows: TouchRow[] = [...buildActions(contact, booking?.url)]
    .sort((a, b) => ROW_ORDER.indexOf(a.key) - ROW_ORDER.indexOf(b.key))
    .map((a) => ({ key: a.key, href: a.href, external: a.external, ...copy[a.key] }));

  const [line1, line2] = splitName(profile.fullName);
  const { featured, used } = pickFeatured(data);
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used));

  return {
    nameLines: [line1, line2].filter(Boolean),
    /** Width of the widest headline line in em: the cover headline is sized so this fits. */
    nameEm: Math.max(headlineEm(line1, pair), headlineEm(line2, pair), 1),
    titleParts: splitTitle(profile.title),
    rows,
    featured,
    email: contact.email ?? null,
    profiles,
    messaging,
  };
}

/** Headings of the blocks and sections, as the Standard design labels them. */
export const BLOCK_TITLES: Record<string, string> = {
  about: "In brief",
  contents: "Get in touch",
  connect: "Connect",
  socials: "Elsewhere",
  gallery: "Gallery",
  portfolio: "Selected work",
  services: "Services",
  resume: "Résumé",
  experience: "Experience",
  skills: "Skills",
  stats: "By the numbers",
  video: "Video",
  booking: "Book a time",
  interests: "Off the clock",
  orgs: "Affiliations",
  song: "Soundtrack",
};

/**
 * The order the page's blocks are drawn in, and the optional sections to draw. The Starter design has no optional
 * sections and keeps the fixed order; the Standard design follows the page's order and draws the kinds it has a
 * design for (the rest stay saved but hidden).
 */
export function buildBlocks(data: PageData, design: "starter" | "standard"): { order: string[]; sections: Partial<Record<SectionKind, Section>> } {
  const kinds = drawnKinds("pro-magazine", data.sections.map((s) => s.kind), design);
  const drawn = data.sections.filter((s) => kinds.includes(s.kind));
  const sections: Partial<Record<SectionKind, Section>> = {};
  for (const s of drawn) sections[s.kind] ??= s;
  // Only the Standard design lets the page reorder its blocks.
  return { order: resolveOrder("pro-magazine", Object.keys(sections), design === "standard" ? data.style.sectionOrder : undefined), sections };
}
