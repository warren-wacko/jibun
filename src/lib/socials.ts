import type { SocialLink, SocialType } from "./page-schema";

export const PROFILE_TYPES = [
  "linkedin",
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "github",
  "behance",
  "x",
  "spotify",
  "pinterest",
  "website",
] as const satisfies readonly SocialType[];

export const MESSAGING_TYPES = [
  "messenger",
  "whatsapp",
  "viber",
  "telegram",
  "discord",
] as const satisfies readonly SocialType[];

export const SOCIAL_LABELS: Record<SocialType, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  github: "GitHub",
  behance: "Behance",
  x: "X",
  spotify: "Spotify",
  pinterest: "Pinterest",
  website: "Website",
  messenger: "Messenger",
  whatsapp: "WhatsApp",
  viber: "Viber",
  telegram: "Telegram",
  discord: "Discord",
};

const PROFILE_SET: ReadonlySet<SocialType> = new Set(PROFILE_TYPES);

export type SocialGroups = { profiles: SocialLink[]; messaging: SocialLink[] };

/** Fixed grouping: "Profiles to view" vs "Ways to message". Order within a group is preserved. */
export function groupSocials(socials: readonly SocialLink[]): SocialGroups {
  const profiles: SocialLink[] = [];
  const messaging: SocialLink[] = [];
  for (const s of socials) (PROFILE_SET.has(s.type) ? profiles : messaging).push(s);
  return { profiles, messaging };
}

const cleanHandle = (h: string) => h.trim().replace(/^@/, "");
const digits = (h: string) => h.replace(/\D/g, "");

/**
 * Generate a URL from a handle where the platform allows it.
 * Returns null when a full URL must be supplied instead (e.g. website, discord invite).
 */
export function buildSocialUrl(type: SocialType, handle: string): string | null {
  const h = cleanHandle(handle);
  if (!h) return null;
  if (/^https?:\/\//i.test(h)) return h;
  switch (type) {
    case "linkedin":
      return `https://www.linkedin.com/in/${h}`;
    case "facebook":
      return `https://www.facebook.com/${h}`;
    case "instagram":
      return `https://www.instagram.com/${h}`;
    case "tiktok":
      return `https://www.tiktok.com/@${h}`;
    case "youtube":
      return `https://www.youtube.com/@${h}`;
    case "github":
      return `https://github.com/${h}`;
    case "behance":
      return `https://www.behance.net/${h}`;
    case "x":
      return `https://x.com/${h}`;
    case "pinterest":
      return `https://www.pinterest.com/${h}`;
    case "messenger":
      return `https://m.me/${h}`;
    case "telegram":
      return `https://t.me/${h}`;
    case "whatsapp": {
      const n = digits(h);
      return n ? `https://wa.me/${n}` : null;
    }
    case "viber": {
      const n = digits(h);
      return n ? `viber://chat?number=${n}` : null;
    }
    case "spotify":
    case "website":
    case "discord":
      return null;
  }
}

/** Messaging types that expose a phone number and are hidden or relabelled when showPhoneNumbers is off. */
export const PHONE_BASED_TYPES: ReadonlySet<SocialType> = new Set(["whatsapp", "viber"]);

/** Label for a messaging tile: the handle when numbers may be shown, otherwise "Chat". */
export function messagingLabel(link: SocialLink, showPhoneNumbers: boolean): string {
  if (PHONE_BASED_TYPES.has(link.type) && !showPhoneNumbers) return "Chat";
  return link.handle;
}
