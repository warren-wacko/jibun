import type { PageData, Section, SocialLink } from "@/lib/page-schema";
import { initials } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds } from "../supported-sections";
import { ICON_TYPES, contactLine, greetingName, pickHero } from "../shared/social";

export type Letter = { ch: string; style: number } | { space: true };

/** The cutout letters cycle through six looks (black, tape, white, kraft, ...) so any name gets the mix. */
export const LETTER_STYLES = 6;

/** Letters that fit on one row at full size. */
const FULL_ROW = 7;
/** Letters per row at the smallest size (where very long names start a new row). */
const SMALL_ROW = 13;
const MIN_SCALE = 0.5;

export function letterCount(letters: readonly Letter[]): number {
  return letters.filter((l) => "ch" in l).length;
}

/**
 * How much to shrink the letters so a name still fits: full size up to 7 letters, then smaller so up to
 * 14 letters stay on one row, then the smallest size (those names wrap onto balanced rows).
 */
export function letterScale(count: number): number {
  if (count <= FULL_ROW) return 1;
  return Math.max(MIN_SCALE, Math.round((FULL_ROW / count) * 1000) / 1000);
}

/** "Maria" -> cutout letters, upper-cased; spaces become gaps. The style index counts letters only. */
export function toLetters(name: string): Letter[] {
  const out: Letter[] = [];
  let n = 0;
  for (const ch of Array.from(name.trim().toUpperCase())) {
    if (/\s/.test(ch)) {
      if (out.length && !("space" in out[out.length - 1])) out.push({ space: true });
      continue;
    }
    out.push({ ch, style: n % LETTER_STYLES });
    n += 1;
  }
  return out;
}

/**
 * Splits the letters into rows. Up to 14 letters stay on one row. Longer names go onto balanced rows
 * of at most 13, breaking between words where possible and splitting a long word into equal parts
 * (so there is never a lone letter or two on the last row).
 */
export function toRows(letters: Letter[]): Letter[][] {
  const count = letterCount(letters);
  if (count <= FULL_ROW * 2) return letters.length ? [letters] : [];

  // words = runs of letters separated by a space marker
  const words: Letter[][] = [];
  let current: Letter[] = [];
  for (const l of letters) {
    if ("space" in l) {
      if (current.length) words.push(current);
      current = [];
    } else current.push(l);
  }
  if (current.length) words.push(current);

  // a word longer than a row is cut into equal parts
  const pieces = words.flatMap((w) => {
    if (w.length <= SMALL_ROW) return [w];
    const parts = Math.ceil(w.length / SMALL_ROW);
    const base = Math.floor(w.length / parts);
    const extra = w.length % parts; // the first `extra` parts get one more letter, so sizes differ by at most 1
    let from = 0;
    return Array.from({ length: parts }, (_, p) => {
      const size = base + (p < extra ? 1 : 0);
      const piece = w.slice(from, from + size);
      from += size;
      return piece;
    });
  });

  const rows: Letter[][] = [];
  let row: Letter[] = [];
  let used = 0;
  for (const p of pieces) {
    if (used > 0 && used + p.length > SMALL_ROW) {
      rows.push(row);
      row = [];
      used = 0;
    }
    if (row.length) row.push({ space: true });
    row.push(...p);
    used += p.length;
  }
  if (row.length) rows.push(row);
  return rows;
}

export type Card = { link: SocialLink; variant: number };

/** Four paper looks for the sticky cards, cycled in order. */
export const CARD_VARIANTS = 4;

/** Everything the template shows, derived from PageData. Empty things come back empty so they can be left out. */
export function buildScrapbookModel(data: PageData) {
  const { profile, contact, socials } = data;
  const student = profile.student ?? {};
  const hero = pickHero(data);
  const rest = socials.filter((s) => s !== hero?.used);

  const name = greetingName(profile);
  const letters = toLetters(name);

  const cards: Card[] = rest
    .filter((s) => !ICON_TYPES.includes(s.type))
    .map((link, i) => ({ link, variant: i % CARD_VARIANTS }));
  const receipt = rest.filter((s) => ICON_TYPES.includes(s.type));

  const badge = [student.program, student.year].filter(Boolean).join(" · ").toUpperCase();

  return {
    initials: initials(profile.fullName),
    name,
    letters,
    letterRows: toRows(letters),
    letterScale: letterScale(letterCount(letters)),
    tagline: profile.bio ?? null,
    badge: badge || null,
    school: student.school ?? null,
    hero,
    cards,
    receipt,
    contactLine: contactLine([...socials.map((s) => s.type), ...(hero?.type ? [hero.type] : [])]),
    callText:
      contact.showPhoneNumbers && contact.phone
        ? { call: `tel:${contact.phone}`, text: contact.sms ? `sms:${contact.phone}` : null }
        : null,
  };
}

/* ---------- Standard design ---------- */

type StandardKind = "interests" | "song" | "video" | "booking" | "gallery" | "orgs" | "resume" | "stats" | "skills" | "portfolio" | "services" | "experience";
const STANDARD_KINDS: readonly StandardKind[] = ["stats","interests","skills","song","video","booking","gallery","portfolio","services","orgs","experience","resume"];

/** The Standard design's extra blocks, in the design's own order or the page's saved order. */
export function buildStandardModel(data: PageData, design: "starter" | "standard" = "standard") {
  const ok = drawnKinds("social-scrapbook", data.sections.map((s) => s.kind), design);
  const blocks: Partial<Record<StandardKind, Section>> = {};
  for (const s of data.sections) {
    if (ok.includes(s.kind) && (STANDARD_KINDS as readonly string[]).includes(s.kind)) blocks[s.kind as StandardKind] ??= s;
  }
  const canonical = STANDARD_KINDS.filter((k) => k in blocks);
  const order = resolveOrder("social-scrapbook", canonical, design === "standard" ? data.style.sectionOrder : undefined).filter((k): k is StandardKind => k in blocks);
  return { blocks, order };
}

/** The tape scrolls: the list is repeated until one copy is wider than the page, then doubled for a seamless loop. */
export function tapeItems(items: readonly string[], minItems = 10): string[] {
  if (items.length === 0) return [];
  const one = Array.from({ length: Math.ceil(minItems / items.length) }, () => items).flat();
  return [...one, ...one];
}

/** Where each photo of the photo dump sits (design pixels on a 390-wide page), how it is turned, and how its tape is. */
const DUMP = [
  { x: 10, y: 16, rot: -7, tape: -5 },
  { x: 118, y: 6, rot: 4, tape: 6 },
  { x: 214, y: 28, rot: -3, tape: -3 },
  { x: 36, y: 168, rot: 5, tape: 4 },
  { x: 176, y: 178, rot: -5, tape: -6 },
] as const;
const DUMP_PAGE = 300;
/** A photo is 161px tall; the box leaves 11px under the lowest one. */
const DUMP_CARD_BOTTOM = 172;

export function dumpLayout(count: number) {
  const cards = Array.from({ length: count }, (_, i) => {
    const base = DUMP[i % DUMP.length];
    return { ...base, y: base.y + Math.floor(i / DUMP.length) * DUMP_PAGE };
  });
  return { cards, height: cards.length ? Math.max(...cards.map((c) => c.y)) + DUMP_CARD_BOTTOM : 0 };
}

/** An org ticket: initials, role on top and the org under it (or the org alone when there is no role). */
export function orgTicket(o: { name: string; role?: string }) {
  return { initials: initials(o.name), line1: o.role ?? o.name, line2: o.role ? o.name : null };
}
