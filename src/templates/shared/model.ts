import type { PageData, SocialLink, SocialType } from "@/lib/page-schema";

/** "https://www.linkedin.com/in/maria/" -> "linkedin.com/in/maria" */
export function displayUrl(url: string): string {
  return url
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

/** "Warren Jacob Abdon" -> "WA": first letter of the first and last word (big watermark behind a hero). */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export type Featured ={ label: string; url: string; sub: string; icon?: SocialType };

/**
 * The single hero link a template shows under CONNECT. It is the page's featured link; with none
 * set, a LinkedIn profile is promoted. `used` is the social entry it came from, so templates can
 * leave it out of their link grids.
 */
export function pickFeatured(data: PageData): { featured: Featured | null; used: SocialLink | undefined } {
  const { featuredLink, socials } = data;
  if (featuredLink) {
    return {
      featured: {
        label: featuredLink.label,
        url: featuredLink.url,
        sub: displayUrl(featuredLink.url),
        icon: featuredLink.icon,
      },
      used: socials.find((s) => s.url === featuredLink.url),
    };
  }
  const linkedin = socials.find((s) => s.type === "linkedin");
  if (!linkedin) return { featured: null, used: undefined };
  return {
    featured: { label: "Connect on LinkedIn", url: linkedin.url, sub: displayUrl(linkedin.url), icon: "linkedin" },
    used: linkedin,
  };
}
