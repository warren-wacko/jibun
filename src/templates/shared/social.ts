import type { PageData, SocialLink, SocialType } from "@/lib/page-schema";
import { messagingLabel } from "@/lib/socials";
import { displayUrl } from "./model";

/** Networks shown small (an icon tile, or a line on the receipt) rather than as a full card. */
export const ICON_TYPES: readonly SocialType[] = ["spotify", "x", "pinterest", "youtube"];

/** The first name (or nickname) the social templates greet with: "hi, I'm Maria". */
export function greetingName(profile: PageData["profile"]): string {
  return profile.displayName?.trim() || profile.fullName.trim().split(/\s+/)[0] || "";
}

/** The hero link: the featured link, or else an Instagram profile ("Follow me on IG"). */
export function pickHero(data: PageData): {
  label: string;
  url: string;
  sub: string;
  type: SocialType | undefined;
  used?: SocialLink;
} | null {
  const { featuredLink, socials } = data;
  if (featuredLink) {
    const used = socials.find((s) => s.url === featuredLink.url);
    return {
      label: featuredLink.label,
      url: featuredLink.url,
      sub: used?.handle ?? displayUrl(featuredLink.url),
      type: featuredLink.icon ?? used?.type,
      used,
    };
  }
  const ig = socials.find((s) => s.type === "instagram");
  return ig ? { label: "Follow me on IG", url: ig.url, sub: ig.handle, type: "instagram", used: ig } : null;
}

const DM_NAMES: [SocialType, string][] = [
  ["instagram", "IG"],
  ["messenger", "Messenger"],
  ["whatsapp", "WhatsApp"],
  ["viber", "Viber"],
  ["telegram", "Telegram"],
  ["discord", "Discord"],
];

/** "DM me on IG or Messenger, that's the fastest." built from the networks the person actually has. */
export function contactLine(types: readonly SocialType[]): string {
  const names = DM_NAMES.filter(([t]) => types.includes(t)).map(([, n]) => n).slice(0, 2);
  if (names.length === 0) return "Tap save and I’m in your contacts.";
  return `DM me on ${names.join(" or ")}, that’s the fastest.`;
}

/** Handle text on a tile or card: the note ("say hi!") if there is one, else the handle (or "Chat" for hidden numbers). */
export function tileHandle(link: SocialLink, showPhoneNumbers: boolean): string {
  return link.note ?? messagingLabel(link, showPhoneNumbers);
}
