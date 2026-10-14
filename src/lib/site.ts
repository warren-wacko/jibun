/** Public site origin. Placeholder domain until the Jibun domain is chosen; set NEXT_PUBLIC_SITE_URL to change it. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://tapcard.ph").replace(/\/+$/, "");
}

export function pageUrl(username: string): string {
  return `${siteUrl()}/${username}`;
}

export const BRAND_NAME = "Jibun";
