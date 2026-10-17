import { z } from "zod";
import { CUSTOM_TEMPLATE_RE, TEMPLATE_KEYS } from "@/templates/keys";
import { displayUrl } from "@/templates/shared/model";
import { ACCENT_PRESET_IDS } from "../accents";
import { ADD_ONS, canUseAccent, checkSections, getEntitlements, type Tier } from "../entitlements";
import { PageDataSchema, SECTION_KINDS, SOCIAL_TYPES, type PageData, type SocialType } from "../page-schema";
import { normalizePhone } from "../phone";
import { buildSocialUrl } from "../socials";
import { validateUsername } from "../usernames";
import { findFontPair } from "@/templates/font-pairs";
import { SECTION_SPECS, draftToCandidate, sectionToDraft, type SectionDraft } from "./section-drafts";

/**
 * The admin form's values, as typed: everything is a string (or boolean) so inputs stay controlled.
 * `valuesToCandidate` turns them into PageData, and `validateForm` checks them, with the same code on the
 * client (live errors, preview) and on the server (the Server Action re-validates; the client is never trusted).
 */
export type SocialRow = { id: string; type: SocialType; handle: string; url: string; note: string };

export const PAGE_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE"] as const;
export type PageStatusValue = (typeof PAGE_STATUSES)[number];
export const WORK_MODES = ["remote", "onsite", "hybrid"] as const;

export type FormValues = {
  // account (Client row)
  clientName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  // page
  username: string;
  tier: Tier;
  templateKey: string;
  status: PageStatusValue;
  paidUntil: string; // yyyy-mm-dd or ""
  addOns: string[];
  // profile
  fullName: string;
  displayName: string;
  title: string;
  company: string;
  logoUrl: string;
  location: string;
  workMode: "" | (typeof WORK_MODES)[number];
  photoUrl: string;
  bio: string;
  availability: string;
  statusLine: string;
  signature: string;
  // student
  school: string;
  program: string;
  year: string;
  graduating: string;
  openTo: string;
  // contact
  phone: string;
  email: string;
  sms: boolean;
  officeAddress: string;
  showPhoneNumbers: boolean;
  // featured link
  featuredLabel: string;
  featuredUrl: string;
  featuredIcon: "" | SocialType;
  // socials, in display order
  socials: SocialRow[];
  // style
  theme: "light" | "dark";
  accent: string;
  fontPair: string;
  bannerUrl: string;
  /** Optional sections, as drafts (see section-drafts.ts). */
  sections: SectionDraft[];
  /** Block ids and section kinds in display order. Empty = the template's default order. */
  sectionOrder: string[];
};

export function emptyFormValues(): FormValues {
  return {
    clientName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
    username: "",
    tier: "STARTER",
    templateKey: "pro-classic",
    status: "DRAFT",
    paidUntil: "",
    addOns: [],
    fullName: "",
    displayName: "",
    title: "",
    company: "",
    logoUrl: "",
    location: "",
    workMode: "",
    photoUrl: "",
    bio: "",
    availability: "",
    statusLine: "",
    signature: "",
    school: "",
    program: "",
    year: "",
    graduating: "",
    openTo: "",
    phone: "",
    email: "",
    sms: false,
    officeAddress: "",
    showPhoneNumbers: true,
    featuredLabel: "",
    featuredUrl: "",
    featuredIcon: "",
    socials: [],
    theme: "light",
    accent: "blue",
    fontPair: "",
    bannerUrl: "",
    sections: [],
    sectionOrder: [],
  };
}

type PageRow = {
  username: string;
  tier: Tier;
  templateKey: string;
  status: PageStatusValue;
  paidUntil: Date | null;
  addOns: string[];
  data: PageData;
  client: { name: string; contactEmail: string | null; contactPhone: string | null; notes: string | null };
};

/** Form values for an existing page (its `data` must already be validated). */
export function valuesFromPage(p: PageRow): FormValues {
  const d = p.data;
  return {
    clientName: p.client.name,
    contactEmail: p.client.contactEmail ?? "",
    contactPhone: p.client.contactPhone ?? "",
    notes: p.client.notes ?? "",
    username: p.username,
    tier: p.tier,
    templateKey: p.templateKey,
    status: p.status,
    paidUntil: p.paidUntil ? p.paidUntil.toISOString().slice(0, 10) : "",
    addOns: [...p.addOns],
    fullName: d.profile.fullName,
    displayName: d.profile.displayName ?? "",
    title: d.profile.title ?? "",
    company: d.profile.company ?? "",
    logoUrl: d.profile.logoUrl ?? "",
    location: d.profile.location ?? "",
    workMode: d.profile.workMode ?? "",
    photoUrl: d.profile.photoUrl ?? "",
    bio: d.profile.bio ?? "",
    availability: d.profile.availability ?? "",
    statusLine: d.profile.status ?? "",
    signature: d.profile.signature ?? "",
    school: d.profile.student?.school ?? "",
    program: d.profile.student?.program ?? "",
    year: d.profile.student?.year ?? "",
    graduating: d.profile.student?.graduating ?? "",
    openTo: d.profile.student?.openTo ?? "",
    phone: d.contact.phone ?? "",
    email: d.contact.email ?? "",
    sms: d.contact.sms ?? false,
    officeAddress: d.contact.officeAddress ?? "",
    showPhoneNumbers: d.contact.showPhoneNumbers,
    featuredLabel: d.featuredLink?.label ?? "",
    featuredUrl: d.featuredLink?.url ?? "",
    featuredIcon: d.featuredLink?.icon ?? "",
    socials: d.socials.map((s, i) => ({ id: `s${i}`, type: s.type, handle: s.handle, url: s.url, note: s.note ?? "" })),
    theme: d.style.theme,
    accent: d.style.accent,
    fontPair: d.style.fontPair ?? "",
    bannerUrl: d.style.bannerUrl ?? "",
    sections: d.sections.map((sec, i) => sectionToDraft(sec, `sd${i}`)),
    sectionOrder: d.style.sectionOrder ?? [],
  };
}

const blank = (s: string) => s.trim() || undefined;

/** A social row the admin has not started filling in. It is ignored rather than reported. */
export const isBlankSocial = (r: SocialRow) => !r.handle.trim() && !r.url.trim() && !r.note.trim();

/** The link a row will use: what was typed, else the one built from the handle (null when it cannot be built). */
export function resolveSocialUrl(r: Pick<SocialRow, "type" | "handle" | "url">): string | null {
  return r.url.trim() || buildSocialUrl(r.type, r.handle);
}

/** What is shown for a row's handle: what was typed, else the link without "https://". */
function resolveHandle(r: SocialRow, url: string | null): string {
  return r.handle.trim() || (url ? displayUrl(url) : "");
}

/** Untrusted PageData built from the form. `socialIndex[i]` is the form row that became `socials[i]`. */
export function valuesToCandidate(v: FormValues): { data: unknown; socialIndex: number[]; sectionIndex: SectionIndex[] } {
  const sectionIndex: SectionIndex[] = [];
  const sections = v.sections.map((draft, i) => {
    const { candidate, itemMap } = draftToCandidate(draft);
    sectionIndex.push({ draft: i, itemMap });
    return candidate;
  });
  const socialIndex: number[] = [];
  const socials: unknown[] = [];
  v.socials.forEach((r, i) => {
    if (isBlankSocial(r)) return;
    const url = resolveSocialUrl(r);
    socialIndex.push(i);
    socials.push({ type: r.type, handle: resolveHandle(r, url), url: url ?? "", note: blank(r.note) });
  });

  const student = {
    school: blank(v.school),
    program: blank(v.program),
    year: blank(v.year),
    graduating: blank(v.graduating),
    openTo: blank(v.openTo),
  };
  const hasStudent = Object.values(student).some(Boolean);
  const hasFeatured = Boolean(v.featuredLabel.trim() || v.featuredUrl.trim());

  const data = {
    profile: {
      fullName: v.fullName.trim(),
      displayName: blank(v.displayName),
      title: blank(v.title),
      company: blank(v.company),
      logoUrl: blank(v.logoUrl),
      location: blank(v.location),
      workMode: v.workMode || undefined,
      photoUrl: blank(v.photoUrl),
      bio: blank(v.bio),
      availability: blank(v.availability),
      status: blank(v.statusLine),
      signature: blank(v.signature),
      student: hasStudent ? student : undefined,
    },
    contact: {
      phone: blank(normalizePhone(v.phone)),
      email: blank(v.email),
      sms: v.phone.trim() ? v.sms : undefined,
      officeAddress: blank(v.officeAddress),
      showPhoneNumbers: v.showPhoneNumbers,
    },
    featuredLink: hasFeatured
      ? { label: v.featuredLabel.trim(), url: v.featuredUrl.trim(), icon: v.featuredIcon || undefined }
      : undefined,
    socials,
    sections,
    style: {
      theme: v.theme,
      accent: v.accent.trim(),
      fontPair: blank(v.fontPair),
      bannerUrl: blank(v.bannerUrl),
      sectionOrder: v.sectionOrder.length ? v.sectionOrder : undefined,
    },
  };
  return { data, socialIndex, sectionIndex };
}

/** Form field keys that errors attach to: a value key, or `socials.<row>.<handle|url|note>`. */
export type FieldErrors = Record<string, string>;

const PATH_TO_FIELD: Record<string, string> = {
  "profile.fullName": "fullName",
  "profile.displayName": "displayName",
  "profile.title": "title",
  "profile.company": "company",
  "profile.logoUrl": "logoUrl",
  "profile.location": "location",
  "profile.workMode": "workMode",
  "profile.photoUrl": "photoUrl",
  "profile.bio": "bio",
  "profile.availability": "availability",
  "profile.status": "statusLine",
  "profile.signature": "signature",
  "profile.student.school": "school",
  "profile.student.program": "program",
  "profile.student.year": "year",
  "profile.student.graduating": "graduating",
  "profile.student.openTo": "openTo",
  "contact.phone": "phone",
  "contact.email": "email",
  "contact.officeAddress": "officeAddress",
  "featuredLink.label": "featuredLabel",
  "featuredLink.url": "featuredUrl",
  "featuredLink.icon": "featuredIcon",
  "style.accent": "accent",
  "style.fontPair": "fontPair",
  "style.bannerUrl": "bannerUrl",
  "style.theme": "theme",
};

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  featuredLabel: "Button text",
  featuredUrl: "Link",
  handle: "Handle",
  url: "Link",
};

function friendly(issue: z.core.$ZodIssue, field: string): string {
  const label = FIELD_LABELS[field.split(".").pop() ?? field] ?? "This field";
  switch (issue.code) {
    case "too_small":
      return issue.origin === "string" || issue.origin === "array" ? `${label} is required` : issue.message;
    case "too_big":
      return `Too long (at most ${issue.maximum} ${issue.origin === "array" ? "items" : "characters"})`;
    case "invalid_format":
      if (issue.format === "email") return "Enter a valid email address";
      if (issue.format === "url") return "Enter a full link starting with https://";
      return issue.message;
    case "invalid_type":
      return `${label} is required`;
    default:
      return issue.message;
  }
}

/** For a stored section `i`: the draft it came from, and which draft row each stored item came from. */
export type SectionIndex = { draft: number; itemMap: number[] };

function fieldFor(path: readonly PropertyKey[], socialIndex: number[], sectionIndex: SectionIndex[], drafts: readonly SectionDraft[]): string | null {
  const [head, idx, leaf] = path;
  if (head === "socials" && typeof idx === "number") {
    const row = socialIndex[idx];
    return row === undefined ? null : `socials.${row}.${typeof leaf === "string" ? leaf : "handle"}`;
  }
  if (head === "socials") return "socials";
  if (head === "sections" && typeof idx === "number") {
    const at = sectionIndex[idx];
    if (!at) return "sections";
    const spec = SECTION_SPECS[drafts[at.draft].kind];
    if (leaf === undefined) return `sections.${at.draft}`;
    if (spec.mode === "rows") {
      const [, , , item, field] = path;
      if (typeof item === "number") return `sections.${at.draft}.items.${at.itemMap[item] ?? 0}.${typeof field === "string" ? field : "x"}`;
      return `sections.${at.draft}.items`;
    }
    if (spec.mode === "lines") return `sections.${at.draft}.text`;
    return leaf === "label" ? `sections.${at.draft}.label` : `sections.${at.draft}.url`;
  }
  if (head === "sections") return "sections";
  return PATH_TO_FIELD[path.join(".")] ?? null;
}

const accountSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required").max(100, "Too long (at most 100 characters)"),
  contactEmail: z.union([z.literal(""), z.email("Enter a valid email address")]),
  contactPhone: z.string().trim().max(40, "Too long"),
  notes: z.string().max(2000, "Too long (at most 2000 characters)"),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Date at 00:00 UTC for a `yyyy-mm-dd` input, or null when it is not a real date. */
export function parseDateInput(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}

export type ValidationResult =
  | { ok: true; data: PageData; paidUntil: Date | null; errors: Record<string, never> }
  | { ok: false; data: null; errors: FieldErrors };

/**
 * Everything the form is checked against: field formats (the PageData schema), the account fields, the username,
 * and what the tier allows (accent, fonts, banner, custom templates, optional sections). Returns PageData when valid.
 */
export function validateForm(v: FormValues, opts: { requireUsername?: boolean } = {}): ValidationResult {
  const errors: FieldErrors = {};
  const add = (field: string, message: string) => {
    errors[field] ||= message;
  };

  const account = accountSchema.safeParse(v);
  if (!account.success) for (const i of account.error.issues) add(String(i.path[0]), i.message);

  if (opts.requireUsername !== false) {
    const u = validateUsername(v.username);
    if (!u.ok) add("username", v.username ? u.reason : "Username is required");
  }

  const { data: candidate, socialIndex, sectionIndex } = valuesToCandidate(v);
  const parsed = PageDataSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = fieldFor(issue.path, socialIndex, sectionIndex, v.sections);
      if (field) add(field, friendly(issue, field));
    }
  }

  const paidUntil = v.paidUntil ? parseDateInput(v.paidUntil) : null;
  if (v.paidUntil && !paidUntil) add("paidUntil", "Enter a valid date");
  if (v.status === "ACTIVE" && !v.paidUntil) add("paidUntil", "Set the paid-until date to make the page live");

  const ent = getEntitlements({ tier: v.tier, addOns: v.addOns });
  if (!TEMPLATE_KEYS.includes(v.templateKey)) {
    if (!(CUSTOM_TEMPLATE_RE.test(v.templateKey) && ent.customComponent)) {
      add("templateKey", ent.customComponent ? "Pick a template, or use a name like custom-maria" : "Pick one of the templates");
    }
  }
  if (!v.accent.trim()) add("accent", "Pick a colour");
  else if (!canUseAccent(v.accent.trim(), ent, ACCENT_PRESET_IDS)) {
    add("accent", "This tier uses the preset colours. Choose a preset or upgrade to Standard for any colour");
  }
  const pair = v.fontPair.trim();
  if (pair && ent.fonts === "default") add("fontPair", "Font pairs need the Standard tier");
  // Custom pages may name any pair (a one-off component can bring its own fonts); Standard picks the template's pairs.
  else if (pair && ent.fonts === "pairs" && !findFontPair(v.templateKey, pair)) add("fontPair", "That font pair is not available for this template");
  if (v.bannerUrl.trim() && !ent.customComponent) add("bannerUrl", "A banner is only for Custom pages");
  const kinds = v.sections.map((d) => d.kind);
  for (const violation of checkSections(kinds.map((kind) => ({ kind })), ent)) add("sections", violation.reason);
  kinds.forEach((kind, i) => {
    if (kinds.indexOf(kind) !== i) add(`sections.${i}`, "Each section can be added once");
    if (!SECTION_SPECS[kind].available) add(`sections.${i}`, SECTION_SPECS[kind].unavailableReason ?? "Not available yet");
  });
  if (v.sectionOrder.length > 0 && !ent.sectionReordering) add("sectionOrder", "Changing the order needs the Standard tier");
  for (const a of v.addOns) if (!(ADD_ONS as readonly string[]).includes(a)) add("addOns", `Unknown add-on "${a}"`);

  if (Object.keys(errors).length > 0 || !parsed.success) return { ok: false, data: null, errors };
  return { ok: true, data: parsed.data, paidUntil, errors: {} };
}

/** Fields (as input names) that belong to each form section, to show a count of problems on its heading. */
export function errorCount(errors: FieldErrors, fields: readonly string[]): number {
  return Object.keys(errors).filter((k) => fields.some((f) => k === f || k.startsWith(`${f}.`))).length;
}

export { SOCIAL_TYPES };

const str = (max = 2000) => z.string().max(max);

/** Shape check for form values that arrive at a Server Action (the client is never trusted to send the right types). */
export const formValuesSchema: z.ZodType<FormValues> = z.object({
  clientName: str(200),
  contactEmail: str(200),
  contactPhone: str(60),
  notes: str(),
  username: str(60),
  tier: z.enum(["STARTER", "STANDARD", "CUSTOM"]),
  templateKey: str(60),
  status: z.enum(PAGE_STATUSES),
  paidUntil: str(10),
  addOns: z.array(str(40)).max(20),
  fullName: str(200),
  displayName: str(200),
  title: str(300),
  company: str(300),
  logoUrl: str(),
  location: str(300),
  workMode: z.enum(["", ...WORK_MODES]),
  photoUrl: str(),
  bio: str(),
  availability: str(300),
  statusLine: str(300),
  signature: str(200),
  school: str(300),
  program: str(300),
  year: str(300),
  graduating: str(100),
  openTo: str(300),
  phone: str(60),
  email: str(300),
  sms: z.boolean(),
  officeAddress: str(500),
  showPhoneNumbers: z.boolean(),
  featuredLabel: str(300),
  featuredUrl: str(),
  featuredIcon: z.enum(["", ...SOCIAL_TYPES]),
  socials: z
    .array(z.object({ id: str(40), type: z.enum(SOCIAL_TYPES), handle: str(300), url: str(), note: str(300) }))
    .max(60),
  theme: z.enum(["light", "dark"]),
  accent: str(40),
  fontPair: str(40),
  bannerUrl: str(),
  sections: z
    .array(
      z.object({
        id: str(60),
        kind: z.enum(SECTION_KINDS),
        items: z.array(z.object({ id: str(60) }).catchall(str(600))).max(40),
        text: str(6000),
        url: str(1000),
        label: str(200),
      }),
    )
    .max(20),
  sectionOrder: z.array(str(30)).max(40),
});

/** The page's content for the live preview: valid PageData even when account or tier checks still fail, else null. */
export function parsePreviewData(v: FormValues): PageData | null {
  const parsed = PageDataSchema.safeParse(valuesToCandidate(v).data);
  return parsed.success ? parsed.data : null;
}

/** "Maria Santos" -> "maria-santos": a starting point for a username. */
export function suggestUsername(fullName: string): string {
  return fullName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/, "");
}
