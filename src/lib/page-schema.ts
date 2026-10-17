import { z } from "zod";

export const SOCIAL_TYPES = [
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
  "messenger",
  "whatsapp",
  "viber",
  "telegram",
  "discord",
] as const;

export const SocialTypeSchema = z.enum(SOCIAL_TYPES);
export type SocialType = z.infer<typeof SocialTypeSchema>;

const httpUrl = z
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "URL must start with http:// or https://");

// Messaging deep links (viber://) are allowed for social links only.
const socialUrl = z
  .string()
  .min(1)
  .refine((u) => /^(https?|viber):\/\//i.test(u), "Invalid link");

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PRESET_ID = /^[a-z0-9-]{2,40}$/;
const E164 = /^\+[1-9]\d{6,14}$/;

const text = (max: number) => z.string().trim().min(1).max(max);

export const SocialLinkSchema = z.object({
  type: SocialTypeSchema,
  handle: text(100),
  url: socialUrl,
  note: text(40).optional(),
});
export type SocialLink = z.infer<typeof SocialLinkSchema>;

export const SectionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("gallery"),
    images: z.array(z.object({ url: httpUrl, alt: text(120) })).min(1).max(10),
  }),
  z.object({
    kind: z.literal("portfolio"),
    items: z
      .array(
        z.object({
          title: text(80),
          desc: text(200).optional(),
          url: httpUrl,
          thumbUrl: httpUrl.optional(),
        }),
      )
      .min(1)
      .max(12),
  }),
  z.object({
    kind: z.literal("services"),
    items: z.array(z.object({ name: text(80), price: text(40).optional() })).min(1).max(20),
  }),
  z.object({ kind: z.literal("resume"), fileUrl: httpUrl, label: text(60).optional() }),
  z.object({
    kind: z.literal("experience"),
    items: z.array(z.object({ role: text(80), org: text(80), years: text(30) })).min(1).max(15),
  }),
  z.object({ kind: z.literal("skills"), items: z.array(text(40)).min(1).max(30) }),
  z.object({
    kind: z.literal("stats"),
    items: z.array(z.object({ label: text(40), value: text(30) })).min(1).max(6),
  }),
  z.object({ kind: z.literal("video"), url: httpUrl }),
  z.object({ kind: z.literal("contactForm") }),
  z.object({ kind: z.literal("booking"), url: httpUrl }),
  z.object({ kind: z.literal("interests"), items: z.array(text(40)).min(1).max(20) }),
  z.object({
    kind: z.literal("orgs"),
    items: z.array(z.object({ name: text(80), role: text(60).optional() })).min(1).max(12),
  }),
  z.object({ kind: z.literal("song"), spotifyUrl: httpUrl, title: text(80).optional(), artist: text(80).optional() }),
]);
export type Section = z.infer<typeof SectionSchema>;
export type SectionKind = Section["kind"];

export const SECTION_KINDS = [
  "gallery",
  "portfolio",
  "services",
  "resume",
  "experience",
  "skills",
  "stats",
  "video",
  "contactForm",
  "booking",
  "interests",
  "orgs",
  "song",
] as const satisfies readonly SectionKind[];

export const PageDataSchema = z.object({
  profile: z.object({
    fullName: text(60),
    displayName: text(30).optional(),
    title: text(80).optional(),
    company: text(80).optional(),
    logoUrl: httpUrl.optional(),
    location: text(80).optional(),
    workMode: z.enum(["remote", "onsite", "hybrid"]).optional(),
    photoUrl: httpUrl.optional(),
    bio: text(600).optional(),
    availability: text(60).optional(),
    status: text(80).optional(),
    signature: text(40).optional(),
    student: z
      .object({
        school: text(100).optional(),
        program: text(60).optional(),
        year: text(30).optional(),
        graduating: text(10).optional(),
        openTo: text(100).optional(),
      })
      .optional(),
  }),
  contact: z.object({
    phone: z.string().regex(E164, "Use international format, e.g. +639171234567").optional(),
    email: z.email().optional(),
    sms: z.boolean().optional(),
    officeAddress: text(200).optional(),
    showPhoneNumbers: z.boolean(),
  }),
  featuredLink: z
    .object({
      label: text(40),
      url: socialUrl,
      icon: SocialTypeSchema.optional(),
    })
    .optional(),
  socials: z.array(SocialLinkSchema).max(30),
  sections: z.array(SectionSchema).max(20),
  style: z.object({
    theme: z.enum(["light", "dark"]),
    accent: z.string().refine((v) => HEX.test(v) || PRESET_ID.test(v), "Use a hex color or preset id"),
    fontPair: z.string().regex(PRESET_ID).optional(),
    /** Block ids and section kinds in display order (Standard and up). Missing = the template's default order. */
    sectionOrder: z.array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{1,23}$/)).max(40).optional(),
    bannerUrl: httpUrl.optional(),
  }),
});
export type PageData = z.infer<typeof PageDataSchema>;

/** Validate untrusted JSON (admin form input, or a Page.data column read). */
export function parsePageData(input: unknown): PageData {
  return PageDataSchema.parse(input);
}

export function safeParsePageData(input: unknown) {
  return PageDataSchema.safeParse(input);
}
