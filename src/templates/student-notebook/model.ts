import type { PageData } from "@/lib/page-schema";
import { groupSocials } from "@/lib/socials";
import { initials, pickFeatured } from "../shared/model";

export type QuickAction = { key: "call" | "email" | "text" | "linkedin"; label: string; href: string; external?: boolean };

/** "hi, I'm Warren!": the nickname if there is one, else the first word of the name. */
export function greetingName(profile: PageData["profile"]): string {
  return profile.displayName?.trim() || profile.fullName.trim().split(/\s+/)[0] || "";
}

/**
 * Everything the template shows, derived from PageData. Empty things come back empty/null so the
 * template can leave them out.
 */
export function buildNotebookModel(data: PageData) {
  const { profile, contact, socials } = data;
  const student = profile.student ?? {};
  const showNumber = contact.showPhoneNumbers && contact.phone;
  const linkedin = socials.find((s) => s.type === "linkedin");

  // Student pages default to hiding numbers, so Call and Text only appear when numbers are allowed.
  const quick: QuickAction[] = [];
  if (showNumber) quick.push({ key: "call", label: "Call", href: `tel:${contact.phone}` });
  if (contact.email) quick.push({ key: "email", label: "Email", href: `mailto:${contact.email}` });
  if (showNumber && contact.sms) quick.push({ key: "text", label: "Text", href: `sms:${contact.phone}` });
  if (linkedin) quick.push({ key: "linkedin", label: "LinkedIn", href: linkedin.url, external: true });

  const { featured, used } = pickFeatured(data);
  // LinkedIn already sits in the action row (and in CONNECT when it is the featured link).
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used && s.type !== "linkedin"));

  const programLine = [student.program, student.year].filter(Boolean).join(" · ");
  const schoolLine = [student.school, student.graduating ? `Graduating ${student.graduating}` : undefined]
    .filter(Boolean)
    .join(" · ");

  return {
    initials: initials(profile.fullName),
    greeting: greetingName(profile),
    programLine,
    schoolLine,
    sticky: student.openTo ? { openTo: student.openTo, note: profile.availability ?? null } : null,
    quick,
    featured,
    email: contact.email ?? null,
    profiles,
    messaging,
  };
}
