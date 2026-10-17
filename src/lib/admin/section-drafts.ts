import { checkSections, isSectionUnlockedByAddOn, SECTION_ADD_ON, type Entitlements } from "../entitlements";
import type { Section, SectionKind } from "../page-schema";

/**
 * Optional sections as the admin form holds them: text boxes, so half-filled rows are fine while typing.
 * `draftToCandidate` turns a draft into the stored shape (blank rows dropped), and `sectionToDraft` goes back.
 * The three shapes of section content share one draft type; the kind says which parts are used:
 * - rows (`items`): gallery, portfolio, services, experience, stats, orgs
 * - lines (`text`, one per line): skills, interests
 * - a link (`url`, and `label` for the résumé): resume, video, booking, song
 */
export type DraftRow = { id: string; [field: string]: string };

export type SectionDraft = {
  id: string;
  kind: SectionKind;
  items: DraftRow[];
  text: string;
  url: string;
  label: string;
};

export type RowField = { key: string; label: string; optional?: boolean; type?: "url"; placeholder?: string; max: number };

export type SectionSpec = {
  label: string;
  help: string;
  mode: "rows" | "lines" | "link" | "none";
  /** Rows: the key of the array in the stored section, the fields of a row and how many rows are allowed. */
  itemsKey?: string;
  fields?: readonly RowField[];
  rowLabel?: string;
  maxRows?: number;
  /** Lines: how many lines and how long each may be. */
  maxLines?: number;
  maxLine?: number;
  /** Link: other text boxes next to the link: the draft field that holds them, and the key in the stored section. */
  extras?: readonly { field: "label" | "text"; key: string; label: string; max: number; placeholder?: string }[];
  /** Link: the key of the link in the stored section, and its label. */
  urlKey?: string;
  urlLabel?: string;
  urlPlaceholder?: string;
  /** False for a section that cannot be shown yet. */
  available: boolean;
  unavailableReason?: string;
};

export const SECTION_SPECS: Record<SectionKind, SectionSpec> = {
  gallery: {
    label: "Gallery",
    help: "Up to 10 photos.",
    mode: "rows",
    itemsKey: "images",
    rowLabel: "Image",
    maxRows: 10,
    fields: [
      { key: "url", label: "Image link", type: "url", placeholder: "https://…", max: 500 },
      { key: "alt", label: "Short description", max: 120 },
    ],
    available: true,
  },
  portfolio: {
    label: "Portfolio",
    help: "Links to the client's work, up to 12.",
    mode: "rows",
    itemsKey: "items",
    rowLabel: "Project",
    maxRows: 12,
    fields: [
      { key: "title", label: "Title", max: 80 },
      { key: "url", label: "Link", type: "url", placeholder: "https://…", max: 500 },
      { key: "desc", label: "Short description", optional: true, max: 200 },
      { key: "thumbUrl", label: "Thumbnail link", optional: true, type: "url", placeholder: "https://…", max: 500 },
    ],
    available: true,
  },
  services: {
    label: "Services",
    help: "What the client offers, with optional prices. Up to 20.",
    mode: "rows",
    itemsKey: "items",
    rowLabel: "Service",
    maxRows: 20,
    fields: [
      { key: "name", label: "Service", max: 80 },
      { key: "price", label: "Price", optional: true, placeholder: "from ₱500", max: 40 },
    ],
    available: true,
  },
  resume: {
    label: "Résumé download",
    help: "A link to the client's résumé or brochure (PDF).",
    mode: "link",
    urlKey: "fileUrl",
    urlLabel: "File link",
    urlPlaceholder: "https://…/resume.pdf",
    extras: [{ field: "label", key: "label", label: "Button text (optional)", max: 60, placeholder: "Download my résumé" }],
    available: true,
  },
  experience: {
    label: "Experience",
    help: "Roles the client has held. Up to 15.",
    mode: "rows",
    itemsKey: "items",
    rowLabel: "Role",
    maxRows: 15,
    fields: [
      { key: "role", label: "Role", max: 80 },
      { key: "org", label: "Company or school", max: 80 },
      { key: "years", label: "Years", placeholder: "2021–2024", max: 30 },
    ],
    available: true,
  },
  skills: {
    label: "Skills",
    help: "One skill per line. Up to 30.",
    mode: "lines",
    maxLines: 30,
    maxLine: 40,
    available: true,
  },
  stats: {
    label: "Stats",
    help: "Short numbers such as years of experience. Up to 6.",
    mode: "rows",
    itemsKey: "items",
    rowLabel: "Stat",
    maxRows: 6,
    fields: [
      { key: "label", label: "Label", placeholder: "Years of experience", max: 40 },
      { key: "value", label: "Value", placeholder: "8+", max: 30 },
    ],
    available: true,
  },
  video: {
    label: "Video",
    help: "A video link (YouTube, Vimeo or similar).",
    mode: "link",
    urlKey: "url",
    urlLabel: "Video link",
    urlPlaceholder: "https://www.youtube.com/watch?v=…",
    available: true,
  },
  contactForm: {
    label: "Contact form",
    help: "Visitors send a message from the page.",
    mode: "none",
    available: false,
    unavailableReason: "The contact form comes in a later version",
  },
  booking: {
    label: "Booking link",
    help: "A button that opens the client's booking page.",
    mode: "link",
    urlKey: "url",
    urlLabel: "Booking link",
    urlPlaceholder: "https://calendly.com/…",
    available: true,
  },
  interests: {
    label: "Interests",
    help: "One interest per line. Up to 20.",
    mode: "lines",
    maxLines: 20,
    maxLine: 40,
    available: true,
  },
  orgs: {
    label: "Orgs and clubs",
    help: "Organisations and the client's role in them. Up to 12.",
    mode: "rows",
    itemsKey: "items",
    rowLabel: "Organisation",
    maxRows: 12,
    fields: [
      { key: "name", label: "Organisation", max: 80 },
      { key: "role", label: "Role", optional: true, max: 60 },
    ],
    available: true,
  },
  song: {
    label: "Song on repeat",
    help: "A Spotify link to the song or playlist.",
    mode: "link",
    urlKey: "spotifyUrl",
    urlLabel: "Spotify link",
    urlPlaceholder: "https://open.spotify.com/track/…",
    extras: [
      { field: "label", key: "title", label: "Song title (optional)", max: 80 },
      { field: "text", key: "artist", label: "Artist (optional)", max: 80 },
    ],
    available: true,
  },
};

export const SECTION_ORDER_IN_PICKER: readonly SectionKind[] = [
  "services",
  "experience",
  "skills",
  "stats",
  "portfolio",
  "gallery",
  "resume",
  "video",
  "booking",
  "interests",
  "orgs",
  "song",
  "contactForm",
];

export function emptyDraft(kind: SectionKind, id: string): SectionDraft {
  const spec = SECTION_SPECS[kind];
  return { id, kind, items: spec.mode === "rows" ? [emptyRow(kind, `${id}-r0`)] : [], text: "", url: "", label: "" };
}

export function emptyRow(kind: SectionKind, id: string): DraftRow {
  const row: DraftRow = { id };
  for (const f of SECTION_SPECS[kind].fields ?? []) row[f.key] = "";
  return row;
}

/** The stored section as a draft. `id` makes the draft (and its rows) unique in the form. */
export function sectionToDraft(section: Section, id: string): SectionDraft {
  const spec = SECTION_SPECS[section.kind];
  const base: SectionDraft = { id, kind: section.kind, items: [], text: "", url: "", label: "" };
  const stored = section as unknown as Record<string, unknown>;

  if (spec.mode === "rows" && spec.itemsKey) {
    const items = (stored[spec.itemsKey] as Record<string, string | undefined>[] | undefined) ?? [];
    base.items = items.map((item, i) => {
      const row = emptyRow(section.kind, `${id}-r${i}`);
      for (const f of spec.fields ?? []) row[f.key] = item[f.key] ?? "";
      return row;
    });
  } else if (spec.mode === "lines") {
    base.text = ((stored.items as string[] | undefined) ?? []).join("\n");
  } else if (spec.mode === "link" && spec.urlKey) {
    base.url = String(stored[spec.urlKey] ?? "");
    for (const x of spec.extras ?? []) base[x.field] = String(stored[x.key] ?? "");
  }
  return base;
}

const blank = (s: string) => s.trim() || undefined;

export const isBlankRow = (kind: SectionKind, row: DraftRow) => (SECTION_SPECS[kind].fields ?? []).every((f) => !row[f.key]?.trim());

/** The lines of a skills or interests box: trimmed, blank lines dropped. */
export const draftLines = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/**
 * Untrusted section data from a draft. For rows, `itemMap[i]` is the draft row that became stored item `i`
 * (blank rows are dropped), so a problem in the stored data can be shown on the right row.
 */
export function draftToCandidate(draft: SectionDraft): { candidate: Record<string, unknown>; itemMap: number[] } {
  const spec = SECTION_SPECS[draft.kind];
  const itemMap: number[] = [];

  if (spec.mode === "rows" && spec.itemsKey) {
    const items: Record<string, string | undefined>[] = [];
    draft.items.forEach((row, i) => {
      if (isBlankRow(draft.kind, row)) return;
      itemMap.push(i);
      const item: Record<string, string | undefined> = {};
      for (const f of spec.fields ?? []) item[f.key] = f.optional ? blank(row[f.key] ?? "") : (row[f.key] ?? "").trim();
      items.push(item);
    });
    return { candidate: { kind: draft.kind, [spec.itemsKey]: items }, itemMap };
  }
  if (spec.mode === "lines") return { candidate: { kind: draft.kind, items: draftLines(draft.text) }, itemMap };
  if (spec.mode === "link" && spec.urlKey) {
    const candidate: Record<string, unknown> = { kind: draft.kind, [spec.urlKey]: draft.url.trim() };
    for (const x of spec.extras ?? []) candidate[x.key] = blank(draft[x.field]);
    return { candidate, itemMap };
  }
  return { candidate: { kind: draft.kind }, itemMap };
}

export type Availability = { ok: true; note: string } | { ok: false; reason: string };

/** How many of the free optional-section picks the sections use (a section unlocked by an add-on is free). */
export function picksUsed(kinds: readonly SectionKind[], ent: Entitlements): number {
  return kinds.filter((k) => !isSectionUnlockedByAddOn(k, ent)).length;
}

/** Can this kind be added to the page as it is now? Says why not, or what it costs. */
export function sectionAvailability(kind: SectionKind, current: readonly SectionKind[], ent: Entitlements): Availability {
  const spec = SECTION_SPECS[kind];
  if (!spec.available) return { ok: false, reason: spec.unavailableReason ?? "Not available yet" };
  if (current.includes(kind)) return { ok: false, reason: "Already added" };

  const addOn = SECTION_ADD_ON[kind];
  if (isSectionUnlockedByAddOn(kind, ent)) return { ok: true, note: `Unlocked by the ${addOn} add-on` };

  const violations = checkSections([...current, kind].map((k) => ({ kind: k })), ent);
  if (violations.some((v) => v.kind === kind)) {
    const free = ent.includedOptionalSections;
    const noFree = free === 0 ? "This tier has no free sections" : `All ${free} free sections are used`;
    return { ok: false, reason: addOn ? `${noFree}. Needs the ${addOn} add-on, or a higher tier` : `${noFree}. Upgrade the tier or ask for a Custom quote` };
  }
  return { ok: true, note: ent.includedOptionalSections === Infinity ? "Included" : "Uses one of the free sections" };
}
