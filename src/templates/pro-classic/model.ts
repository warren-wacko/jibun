import { buildActions, type Action } from "@/components/ActionRow";
import type { PageData, Section, SectionKind } from "@/lib/page-schema";
import { groupSocials } from "@/lib/socials";
import { pickFeatured } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds } from "../supported-sections";

export { displayUrl } from "../shared/model";
export type { Featured } from "../shared/model";

/** Visual order of the round action buttons in the design. */
const ACTION_ORDER: readonly Action["key"][] = ["call", "email", "text", "directions", "book"];

/**
 * Everything the template shows, derived from PageData. Anything empty comes back empty/null
 * so the template can leave it out.
 */
export function buildModel(data: PageData) {
  const { profile, contact, socials, sections } = data;
  const booking = sections.find((s) => s.kind === "booking");

  const actions = [...buildActions(contact, booking?.url)].sort(
    (a, b) => ACTION_ORDER.indexOf(a.key) - ACTION_ORDER.indexOf(b.key),
  );

  const { featured, used } = pickFeatured(data);
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used));

  return {
    cardLabel: [profile.company, profile.location].filter(Boolean).join(" · "),
    actions,
    featured,
    email: contact.email ?? null,
    profiles,
    messaging,
  };
}

/** Headings of the blocks and sections, as the Standard design labels them. */
export const BLOCK_TITLES: Record<string, string> = {
  about: "About",
  connect: "Connect",
  profiles: "Profiles to view",
  messages: "Ways to message",
  gallery: "Gallery",
  portfolio: "Portfolio",
  services: "Services",
  resume: "Résumé",
  experience: "Experience",
  skills: "Skills",
  stats: "At a glance",
};

/**
 * The order the page's blocks are drawn in, and the optional sections to draw. The Starter design has no optional
 * sections and keeps the fixed order; the Standard design follows the page's order and draws the kinds it has a
 * design for (the rest stay saved but hidden).
 */
export function buildBlocks(data: PageData, design: "starter" | "standard"): { order: string[]; sections: Partial<Record<SectionKind, Section>> } {
  const kinds = drawnKinds("pro-classic", data.sections.map((s) => s.kind), design);
  const drawn = data.sections.filter((s) => kinds.includes(s.kind));
  const sections: Partial<Record<SectionKind, Section>> = {};
  for (const s of drawn) sections[s.kind] ??= s;
  // Only the Standard design lets the page reorder its blocks.
  return { order: resolveOrder("pro-classic", Object.keys(sections), design === "standard" ? data.style.sectionOrder : undefined), sections };
}
