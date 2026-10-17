import type { PageData } from "@/lib/page-schema";
import { formatPhone } from "@/lib/phone";
import { groupSocials } from "@/lib/socials";
import { initials, pickFeatured } from "../shared/model";

export const WORK_MODE_LABEL = { remote: "Remote", onsite: "On-site", hybrid: "Hybrid" } as const;

/** The characters of the rotating badge ring: 46 positions, one every 360/46 degrees. */
export const BADGE_RING_TEXT = "TAP · SAVE · CONNECT · TAP · SAVE · CONNECT · ";

export type SectionKey = "about" | "connect" | "profiles" | "messages";

const SECTION_TITLES: Record<SectionKey, string> = {
  about: "About",
  connect: "Let’s connect",
  profiles: "Follow me",
  messages: "Message me",
};

/**
 * Everything the template shows, derived from PageData. Empty things come back empty/null so the
 * template can leave them out, and the numbered sections ("01", "02", ...) count only what is shown.
 */
export function buildCompanyModel(data: PageData) {
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

  const present: SectionKey[] = [];
  if (profile.bio) present.push("about");
  if (featured) present.push("connect");
  if (profiles.length) present.push("profiles");
  if (messaging.length) present.push("messages");
  const sections = present.map((key, i) => ({
    key,
    title: SECTION_TITLES[key],
    num: String(i + 1).padStart(2, "0"),
  }));

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
    featured,
    profiles,
    messaging,
  };
}
