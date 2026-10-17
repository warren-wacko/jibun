import type { PageData } from "./page-schema";

/**
 * The template preview (/preview) is for building and reviewing designs. It is off in
 * production unless ENABLE_PREVIEW=1, so it never goes live for clients by accident.
 */
export function isPreviewEnabled(env: { NODE_ENV?: string; ENABLE_PREVIEW?: string }): boolean {
  return env.NODE_ENV !== "production" || env.ENABLE_PREVIEW === "1";
}

export type PreviewVariant = "full" | "sparse";

/** Illustrated placeholder portrait in public/sample/. Not a real person. */
export const PREVIEW_PHOTO = "/sample/avatar.svg";

/** Fictional person with every field filled in, to see a template at its fullest. */
export const FULL_PREVIEW_DATA: PageData = {
  profile: {
    fullName: "Maria Santos",
    displayName: "Mia",
    title: "Product Designer · Brand Strategist",
    company: "Northwind Studio",
    location: "Cavite, PH",
    workMode: "hybrid",
    photoUrl: PREVIEW_PHOTO,
    bio: "I design simple, useful products for growing teams. Based in Cavite and open to new projects, collaborations and the occasional coffee.",
    availability: "Replies within a day",
    status: "Designing a new brand system",
    signature: "Maria S.",
    student: {
      school: "Cavite State University",
      program: "BSIT",
      year: "3rd year",
      graduating: "2027",
      openTo: "Internships & entry-level roles",
    },
  },
  contact: {
    phone: "+639171234567",
    email: "maria@example.com",
    sms: true,
    officeAddress: "Northwind Studio, Tagaytay Road, Silang, Cavite",
    showPhoneNumbers: true,
  },
  featuredLink: {
    label: "Connect on LinkedIn",
    url: "https://www.linkedin.com/in/mariasantos",
    icon: "linkedin",
  },
  socials: [
    { type: "facebook", handle: "/mariasantos", url: "https://www.facebook.com/mariasantos" },
    { type: "instagram", handle: "@maria.designs", url: "https://www.instagram.com/maria.designs", note: "say hi!" },
    { type: "tiktok", handle: "@maria.designs", url: "https://www.tiktok.com/@maria.designs" },
    { type: "github", handle: "mariasantos", url: "https://github.com/mariasantos" },
    { type: "messenger", handle: "m.me/mariasantos", url: "https://m.me/mariasantos" },
    { type: "whatsapp", handle: "+63 917 123 4567", url: "https://wa.me/639171234567" },
    { type: "viber", handle: "+63 917 123 4567", url: "viber://chat?number=639171234567" },
    { type: "telegram", handle: "@mariasantos", url: "https://t.me/mariasantos" },
  ],
  sections: [],
  style: { theme: "light", accent: "blue" },
};

/** A long name and almost nothing else: to check empty states and the 30-character name rule. */
export const SPARSE_PREVIEW_DATA: PageData = {
  profile: { fullName: "Maximiliano Bartholomew Santia" },
  contact: { phone: "+639171234567", sms: true, showPhoneNumbers: false },
  socials: [
    { type: "github", handle: "maxbart", url: "https://github.com/maxbart" },
    { type: "whatsapp", handle: "+63 917 123 4567", url: "https://wa.me/639171234567" },
    { type: "telegram", handle: "@maxbart", url: "https://t.me/maxbart" },
  ],
  sections: [],
  style: { theme: "light", accent: "blue" },
};

/** Accent each template looks its best in, used when the preview URL does not pick one. */
export const PREVIEW_DEFAULT_ACCENT: Record<string, string> = {
  "pro-classic": "pearl",
  "pro-magazine": "#D7261E",
  "pro-signature": "#14161A",
  "pro-company": "navy",
  "student-notebook": "yellow",
  "social-bento": "butter",
  "social-scrapbook": "tomato",
  "social-minimalist": "cobalt",
};

const ACCENT = /^(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})|[a-z0-9-]{2,40})$/;

export function buildPreviewData(
  templateKey: string,
  opts: { variant?: string; theme?: string; accent?: string },
): PageData {
  const base = opts.variant === "sparse" ? SPARSE_PREVIEW_DATA : FULL_PREVIEW_DATA;
  const accent =
    opts.accent && ACCENT.test(opts.accent) ? opts.accent : (PREVIEW_DEFAULT_ACCENT[templateKey] ?? base.style.accent);
  const theme = opts.theme === "dark" ? "dark" : "light";
  return { ...base, style: { ...base.style, theme, accent } };
}
