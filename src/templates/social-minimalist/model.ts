import type { PageData } from "@/lib/page-schema";
import { initials } from "../shared/model";
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
