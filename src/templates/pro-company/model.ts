import type { PageData, Section, SectionKind } from "@/lib/page-schema";
import { formatPhone } from "@/lib/phone";
import { groupSocials } from "@/lib/socials";
import { initials, pickFeatured } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds } from "../supported-sections";

export const WORK_MODE_LABEL = { remote: "Remote", onsite: "On-site", hybrid: "Hybrid" } as const;

/** The characters of the rotating badge ring: 46 positions, one every 360/46 degrees. */
export const BADGE_RING_TEXT = "TAP · SAVE · CONNECT · TAP · SAVE · CONNECT · ";

/** A block of the page: one of the four built-in ones, or an optional section kind. */
export type SectionKey = string;

/** Headings of the blocks and sections, as the design labels them. */
export const BLOCK_TITLES: Record<string, string> = {
  about: "About",
  connect: "Let’s connect",
  profiles: "Follow me",
  messages: "Message me",
  gallery: "Gallery",
  portfolio: "Selected work",
  services: "Services",
  resume: "Résumé",
  experience: "Experience",
  skills: "Skills",
  stats: "At a glance",
};

/**
 * The order the numbered blocks are drawn in, and the optional sections to draw. The Starter design has no optional
 * sections and keeps the fixed order; the Standard design follows the page's order and draws the kinds it has a
 * design for (the rest stay saved but hidden).
 */
export function buildBlocks(data: PageData, design: "starter" | "standard"): { order: string[]; sections: Partial<Record<SectionKind, Section>> } {
  const kinds = drawnKinds("pro-company", data.sections.map((s) => s.kind), design);
  const drawn = data.sections.filter((s) => kinds.includes(s.kind));
  const sections: Partial<Record<SectionKind, Section>> = {};
  for (const s of drawn) sections[s.kind] ??= s;
  // Only the Standard design lets the page reorder its blocks.
  return { order: resolveOrder("pro-company", Object.keys(sections), design === "standard" ? data.style.sectionOrder : undefined), sections };
}

/**
 * Everything the template shows, derived from PageData. Empty things come back empty/null so the
 * template can leave them out, and the numbered sections ("01", "02", ...) count only what is shown.
 */
export function buildCompanyModel(data: PageData, design: "starter" | "standard" = "starter") {
  const { profile, contact, socials } = data;
  const showNumber = contact.showPhoneNumbers && contact.phone;

  const { featured, used } = pickFeatured(data);
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used));

  const info = [
    { label: "Company", value: profile.company },
    { label: "Based in", value: profile.location },
    { label: "Works", value: profile.workMode ? WORK_MODE_LABEL[profile.workMode] : undefined },
  ].filter((i): i is { label: string; value: string } => Boolean(i.value));

  const phone = showNumber ? { tel: `tel:${contact.phone}`, display: formatPhone(contact.phone!), raw: contact.phone! } : null;
  const sms = showNumber && contact.sms ? `sms:${contact.phone}` : null;
  const office = contact.officeAddress
    ? {
        label: contact.officeAddress,
        href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.officeAddress)}`,
      }
    : null;
  const email = contact.email ?? null;

  const { order, sections: extra } = buildBlocks(data, design);
  const has: Record<string, boolean> = {
    about: Boolean(profile.bio),
    connect: Boolean(featured),
    profiles: profiles.length > 0,
    messages: messaging.length > 0,
    ...Object.fromEntries(Object.keys(extra).map((k) => [k, true])),
  };
  const sections = order
    .filter((key) => has[key])
    .map((key, i) => ({ key, title: BLOCK_TITLES[key] ?? key, num: String(i + 1).padStart(2, "0") }));

  return {
    initials: initials(profile.fullName),
    logoUrl: profile.logoUrl ?? null,
    company: profile.company ?? null,
    info,
    caption: profile.availability ?? null,
    phone,
    email,
    sms,
    office,
    tileCount: Number(Boolean(sms)) + Number(Boolean(office)),
    hasTouch: Boolean(phone || email || sms || office),
    sections,
    /** The optional sections to draw (Standard design), by kind. */
    extra,
    featured,
    profiles,
    messaging,
  };
}
