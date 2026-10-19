import { buildActions, type Action } from "@/components/ActionRow";
import type { PageData, Section, SectionKind } from "@/lib/page-schema";
import { groupSocials } from "@/lib/socials";
import { initials, pickFeatured } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds } from "../supported-sections";

export { initials };

/** Visual order of the action bar in the design. */
const ACTION_ORDER: readonly Action["key"][] = ["call", "email", "text", "directions", "book"];

/** "Software Engineer · Full-Stack Developer" -> its two parts (also split on | / and dashes). */
export function titleParts(title: string | undefined): string[] {
  if (!title) return [];
  return title.split(/\s+(?:·|•|\||\/|—|–)\s+/).map((p) => p.trim()).filter(Boolean);
}

/** The handwritten sign-off: the page's `signature` field, else the first name. */
export function signatureText(profile: PageData["profile"]): string {
  return profile.signature?.trim() || profile.fullName.trim().split(/\s+/)[0] || "";
}

/** Everything the template shows, derived from PageData. Empty things come back empty so they can be left out. */
export function buildSignatureModel(data: PageData) {
  const { profile, contact, socials, sections } = data;
  const booking = sections.find((s) => s.kind === "booking");

  const actions = [...buildActions(contact, booking?.url)].sort(
    (a, b) => ACTION_ORDER.indexOf(a.key) - ACTION_ORDER.indexOf(b.key),
  );

  const { featured, used } = pickFeatured(data);
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used));

  return {
    initials: initials(profile.fullName),
    cardLabel: [profile.company, profile.location].filter(Boolean).join(" · "),
    signature: signatureText(profile),
    /** The scrolling line under the card: what the person does, whether they are open to work, and where. Empty = no line. */
    ticker: [...titleParts(profile.title), profile.availability?.trim(), profile.location?.trim()].filter((w): w is string => Boolean(w)),
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
  video: "Video",
  booking: "Book a meeting",
  interests: "Interests",
  orgs: "Organizations",
  song: "My song",
};

/**
 * The order the page's blocks are drawn in, and the optional sections to draw. The Starter design has no optional
 * sections and keeps the fixed order; the Standard design follows the page's order and draws the kinds it has a
 * design for (the rest stay saved but hidden).
 */
export function buildBlocks(data: PageData, design: "starter" | "standard"): { order: string[]; sections: Partial<Record<SectionKind, Section>> } {
  const kinds = drawnKinds("pro-signature", data.sections.map((s) => s.kind), design);
  const drawn = data.sections.filter((s) => kinds.includes(s.kind));
  const sections: Partial<Record<SectionKind, Section>> = {};
  for (const s of drawn) sections[s.kind] ??= s;
  // Only the Standard design lets the page reorder its blocks.
  return { order: resolveOrder("pro-signature", Object.keys(sections), design === "standard" ? data.style.sectionOrder : undefined), sections };
}
