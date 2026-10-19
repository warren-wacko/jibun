import type { PageData } from "./page-schema";
import { PHONE_BASED_TYPES, SOCIAL_LABELS } from "./socials";

export type VCardPhoto = { type: "JPEG" | "PNG"; base64: string };

const CRLF = "\r\n";

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Fold a content line at 75 octets (RFC 2425/2426), never splitting a UTF-8 character. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  // The first line may use 75 octets; continuation lines start with a space, leaving 74.
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join(CRLF + " ");
}

/** "Maria Santos" -> family "Santos", given "Maria". A single word is treated as the given name. */
function splitName(fullName: string): { family: string; given: string } {
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return { family: "", given: words[0] };
  return { family: words[words.length - 1], given: words.slice(0, -1).join(" ") };
}

/**
 * vCard 3.0. The phone number is included only when showPhoneNumbers is on, so the
 * contact file never reveals a number the page hides.
 */
export function buildVCard(data: PageData, opts: { pageUrl: string; photo?: VCardPhoto | null }): string {
  const { profile, contact } = data;
  const { family, given } = splitName(profile.fullName);
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeText(profile.fullName)}`,
    `N:${escapeText(family)};${escapeText(given)};;;`,
  ];
  if (profile.displayName) lines.push(`NICKNAME:${escapeText(profile.displayName)}`);
  if (profile.title) lines.push(`TITLE:${escapeText(profile.title)}`);
  if (profile.company) lines.push(`ORG:${escapeText(profile.company)}`);
  if (contact.phone && contact.showPhoneNumbers) lines.push(`TEL;TYPE=CELL:${contact.phone}`);
  if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
  if (contact.officeAddress) lines.push(`ADR;TYPE=WORK:;;${escapeText(contact.officeAddress)};;;;`);
  lines.push(`URL:${opts.pageUrl}`);

  // Every link on the page goes into the contact too, each with a label (Apple's itemN.X-ABLabel; other
  // contact apps show them as websites). Phone-based chats (WhatsApp, Viber) are left out when the number is hidden.
  let item = 0;
  const addLink = (label: string, url: string) => {
    item += 1;
    lines.push(`item${item}.URL:${url}`, `item${item}.X-ABLabel:${escapeText(label)}`);
  };
  if (data.featuredLink) addLink(data.featuredLink.label, data.featuredLink.url);
  for (const s of data.socials) {
    if (PHONE_BASED_TYPES.has(s.type) && !contact.showPhoneNumbers) continue;
    addLink(SOCIAL_LABELS[s.type], s.url);
  }

  const about = [profile.bio, profile.location ? `Based in ${profile.location}` : ""].filter(Boolean).join("\n");
  if (about) lines.push(`NOTE:${escapeText(about.slice(0, 600))}`);
  if (opts.photo) lines.push(`PHOTO;ENCODING=b;TYPE=${opts.photo.type}:${opts.photo.base64}`);
  lines.push("END:VCARD");
  return lines.map(foldLine).join(CRLF) + CRLF;
}
