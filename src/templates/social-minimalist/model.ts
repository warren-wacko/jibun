import type { PageData, Section } from "@/lib/page-schema";
import { initials } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds } from "../supported-sections";
import { ICON_TYPES, contactLine, greetingName, pickHero } from "../shared/social";

/**
 * Splits a bio into an italic lead and the rest, like "*coffee, anime* & last-minute requirements.":
 * the part before the first " & " / " and " when it is short, else the first two words of a longer bio.
 */
export function splitBio(bio: string): { lead: string; rest: string } {
  const text = bio.trim();
  const m = /\s(?:&|and)\s/i.exec(text);
  if (m && m.index > 0) {
    const lead = text.slice(0, m.index);
    if (lead.trim().split(/\s+/).length <= 5) return { lead, rest: text.slice(m.index) };
  }
  const words = text.split(/\s+/);
  if (words.length >= 4) {
    const lead = words.slice(0, 2).join(" ");
    return { lead, rest: text.slice(lead.length) };
  }
  return { lead: "", rest: text };
}

/** Everything the template shows, derived from PageData. Empty things come back empty so they can be left out. */
export function buildMinimalModel(data: PageData) {
  const { profile, contact, socials } = data;
  const student = profile.student ?? {};
  const hero = pickHero(data);
  const rest = socials.filter((s) => s !== hero?.used);
  const name = greetingName(profile);

  const program = [student.program, student.year].filter(Boolean).join(" · ");

  return {
    initials: initials(profile.fullName),
    name,
    nameChars: Math.max(1, ...name.split(/\s+/).map((w) => Array.from(w).length)),
    program: program || null,
    school: student.school ?? null,
    bio: profile.bio ? splitBio(profile.bio) : null,
    hero: hero ? { ...hero, label: hero.label === "Follow me on IG" ? "Follow me on Instagram" : hero.label } : null,
    cards: rest.filter((s) => !ICON_TYPES.includes(s.type)),
    icons: rest.filter((s) => ICON_TYPES.includes(s.type)),
    contactLine: contactLine([...socials.map((s) => s.type), ...(hero?.type ? [hero.type] : [])]),
    callText:
      contact.showPhoneNumbers && contact.phone
        ? { call: `tel:${contact.phone}`, text: contact.sms ? `sms:${contact.phone}` : null }
        : null,
  };
}

/* ---------- Standard design ---------- */

type StandardKind = "interests" | "song" | "gallery" | "orgs";

/** The Standard design's extra blocks, in the design's own order or the page's saved order. */
export function buildStandardModel(data: PageData, design: "starter" | "standard" = "standard") {
  const ok = drawnKinds("social-minimalist", data.sections.map((s) => s.kind), design);
  const blocks: Partial<Record<StandardKind, Section>> = {};
  for (const s of data.sections) {
    if (ok.includes(s.kind) && (s.kind === "interests" || s.kind === "song" || s.kind === "gallery" || s.kind === "orgs")) blocks[s.kind] ??= s;
  }
  const canonical = (["interests", "song", "gallery", "orgs"] as const).filter((k) => k in blocks);
  const order = resolveOrder("social-minimalist", canonical, design === "standard" ? data.style.sectionOrder : undefined).filter((k): k is StandardKind => k in blocks);
  return { blocks, order };
}

/** The interests scroll: repeated until one copy is wider than the page, then doubled for a seamless loop. */
export function interestLoop(items: readonly string[], minItems = 10): string[] {
  if (items.length === 0) return [];
  const one = Array.from({ length: Math.ceil(minItems / items.length) }, () => items).flat();
  return [...one, ...one];
}

/** Where each photo of the photo dump sits (design pixels on a 390-wide page) and how it is turned. */
const DUMP = [
  { x: 10, y: 18, rot: -5 },
  { x: 120, y: 8, rot: 3 },
  { x: 216, y: 30, rot: -2 },
  { x: 40, y: 170, rot: 4 },
  { x: 180, y: 176, rot: -4 },
] as const;
const DUMP_PAGE = 300;
/** A photo is 156px tall; the box leaves 8px under the lowest one. */
const DUMP_CARD_BOTTOM = 164;

export function dumpLayout(count: number) {
  const cards = Array.from({ length: count }, (_, i) => {
    const base = DUMP[i % DUMP.length];
    return { ...base, y: base.y + Math.floor(i / DUMP.length) * DUMP_PAGE };
  });
  return { cards, height: cards.length ? Math.max(...cards.map((c) => c.y)) + DUMP_CARD_BOTTOM : 0 };
}

/** An org pill: initials in a badge, the role, and the org after it (or the org alone when there is no role). */
export function orgPill(o: { name: string; role?: string }) {
  return { initials: initials(o.name), main: o.role ?? o.name, rest: o.role ? o.name : null };
}
