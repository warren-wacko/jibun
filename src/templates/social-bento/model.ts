import type { PageData, Section, SocialLink, SocialType } from "@/lib/page-schema";
import { initials } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds } from "../supported-sections";
import { ICON_TYPES, contactLine, greetingName, pickHero, tileHandle } from "../shared/social";

// These live in ../shared/social (the scrapbook template uses them too); re-exported for this template.
export { ICON_TYPES, contactLine, greetingName, pickHero, tileHandle };
/** Wide tiles painted in the network's own colour (the rest are neutral tiles with a coloured chip). */
export const SOLID_TYPES: readonly SocialType[] = ["discord", "whatsapp", "viber", "telegram"];

/** Spans for a row of k icon tiles on the 4-column grid, so no row ends with an empty cell. */
export function rowSpans(k: number): number[] {
  switch (k) {
    case 1:
      return [4];
    case 2:
      return [2, 2];
    case 3:
      return [2, 1, 1];
    default:
      return [1, 1, 1, 1];
  }
}

export type BentoTile =
  | { key: string; kind: "big" | "wide" | "icon"; link: SocialLink; colSpan: number; rowSpan: number }
  | { key: string; kind: "status"; link?: undefined; colSpan: number; rowSpan: number };

/**
 * Turns the person's links into tiles that always fill the grid:
 *  - the first TikTok is the big 2x2 tile (the full width when there is nothing to put beside it),
 *  - other networks are wide 2x1 tiles, and the "Currently" status is the last wide tile,
 *  - spotify / x / pinterest / youtube become a row of small icon tiles,
 *  - a lone wide tile stretches across the row, or (next to the big tile) down two rows.
 */
export function layoutTiles(socials: readonly SocialLink[], hasStatus: boolean): BentoTile[] {
  const big = socials.find((s) => s.type === "tiktok");
  const rest = socials.filter((s) => s !== big);
  const icons = rest.filter((s) => ICON_TYPES.includes(s.type));
  const wides: BentoTile[] = rest
    .filter((s) => !ICON_TYPES.includes(s.type))
    .map((link) => ({ key: `${link.type}-${link.handle}`, kind: "wide", link, colSpan: 2, rowSpan: 1 }));
  if (hasStatus) wides.push({ key: "status", kind: "status", colSpan: 2, rowSpan: 1 });

  const tiles: BentoTile[] = [];
  let pairedFrom = 0; // index of the first wide tile that is not beside the big tile

  if (big) {
    const key = `${big.type}-${big.handle}`;
    if (wides.length === 0) {
      tiles.push({ key, kind: "big", link: big, colSpan: 4, rowSpan: 2 });
    } else {
      tiles.push({ key, kind: "big", link: big, colSpan: 2, rowSpan: 2 });
      if (wides.length === 1) wides[0] = { ...wides[0], rowSpan: 2 };
      pairedFrom = Math.min(2, wides.length);
    }
  }
  const remaining = wides.length - pairedFrom;
  if (remaining % 2 === 1) wides[wides.length - 1] = { ...wides[wides.length - 1], colSpan: 4 };
  tiles.push(...wides);

  for (let i = 0; i < icons.length; i += 4) {
    const row = icons.slice(i, i + 4);
    const spans = rowSpans(row.length);
    row.forEach((link, j) =>
      tiles.push({ key: `${link.type}-${link.handle}`, kind: "icon", link, colSpan: spans[j], rowSpan: 1 }),
    );
  }
  return tiles;
}

/** Everything the template shows, derived from PageData. */
export function buildBentoModel(data: PageData) {
  const { profile, contact, socials } = data;
  const student = profile.student ?? {};
  const hero = pickHero(data);
  const tileLinks = socials.filter((s) => s !== hero?.used);
  const name = greetingName(profile);
  const yearShort = student.year?.trim().split(/\s+/)[0];

  return {
    initials: initials(profile.fullName),
    name,
    nameChars: Math.max(1, ...name.split(/\s+/).map((w) => Array.from(w).length)),
    greeting: name,
    // The small accent tile under the share button: school year + program, else a tap icon.
    badge: yearShort ? { big: yearShort, small: student.program ?? null } : null,
    school: student.school ?? null,
    // With no bio the full name takes the line, so it is never lost when only a first name is shown big.
    tagline: profile.bio ?? (profile.fullName.trim() !== name ? profile.fullName.trim() : null),
    status: profile.status ?? null,
    hero,
    tiles: layoutTiles(tileLinks, Boolean(profile.status)),
    contactLine: contactLine([...socials.map((s) => s.type), ...(hero?.type ? [hero.type] : [])]),
    callText: contact.showPhoneNumbers && contact.phone
      ? { call: `tel:${contact.phone}`, text: contact.sms ? `sms:${contact.phone}` : null }
      : null,
  };
}

/* ---------- Standard design ---------- */

type StandardKind = "interests" | "song" | "video" | "booking" | "gallery" | "orgs";
const STANDARD_KINDS: readonly StandardKind[] = ["interests","song","video","gallery","orgs","booking"];

/**
 * The Standard design's extra blocks: the page's interests, song, photos and orgs, in the design's own order
 * (or the page's saved order). Kinds the design has no block for are left out.
 */
export function buildStandardModel(data: PageData, design: "starter" | "standard" = "standard") {
  const ok = drawnKinds("social-bento", data.sections.map((s) => s.kind), design);
  const blocks: Partial<Record<StandardKind, Section>> = {};
  for (const s of data.sections) {
    if (ok.includes(s.kind) && (STANDARD_KINDS as readonly string[]).includes(s.kind)) blocks[s.kind as StandardKind] ??= s;
  }
  const canonical = STANDARD_KINDS.filter((k) => k in blocks);
  const order = resolveOrder("social-bento", canonical, design === "standard" ? data.style.sectionOrder : undefined).filter((k): k is StandardKind => k in blocks);
  return { blocks, order };
}

/** The interests band scrolls, so the list is repeated until one copy is wider than the band, then doubled for a seamless loop. */
export function marqueeItems(items: readonly string[], minItems = 14): string[] {
  if (items.length === 0) return [];
  const copies = Math.ceil(minItems / items.length);
  const one = Array.from({ length: copies }, () => items).flat();
  return [...one, ...one];
}

/** Where each photo of the photo dump sits (design pixels in a 366-wide box) and how it is turned. */
const DUMP = [
  { x: 14, y: 52, rot: -7 },
  { x: 120, y: 44, rot: 4 },
  { x: 218, y: 62, rot: -3 },
  { x: 40, y: 196, rot: 5 },
  { x: 178, y: 200, rot: -5 },
] as const;
/** More than five photos go on further "pages" of the same scatter, this far below the previous one. */
const DUMP_PAGE = 300;
/** A photo card is 155px tall; the box leaves 11px below the lowest one. */
const DUMP_CARD_BOTTOM = 166;

export function dumpLayout(count: number) {
  const cards = Array.from({ length: count }, (_, i) => {
    const base = DUMP[i % DUMP.length];
    return { x: base.x, y: base.y + Math.floor(i / DUMP.length) * DUMP_PAGE, rot: base.rot };
  });
  const height = cards.length ? Math.max(...cards.map((c) => c.y)) + DUMP_CARD_BOTTOM : 0;
  return { cards, height };
}

/** An org chip: the two initials of the org, the role on top and the org under it (or the org alone when there is no role). */
export function orgChip(o: { name: string; role?: string }) {
  return { initials: initials(o.name), line1: o.role ?? o.name, line2: o.role ? o.name : null };
}
