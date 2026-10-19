import type { PageData, Section, SocialType } from "@/lib/page-schema";
import { SOCIAL_LABELS, groupSocials } from "@/lib/socials";
import { initials, pickFeatured } from "../shared/model";
import { resolveOrder } from "../section-order";
import { drawnKinds, supportedSections } from "../supported-sections";

export type QuickAction = { key: "call" | "email" | "text" | "linkedin"; label: string; href: string; external?: boolean };

/** "hi, I'm Warren!": the nickname if there is one, else the first word of the name. */
export function greetingName(profile: PageData["profile"]): string {
  return profile.displayName?.trim() || profile.fullName.trim().split(/\s+/)[0] || "";
}

/**
 * Everything the template shows, derived from PageData. Empty things come back empty/null so the
 * template can leave them out.
 */
export function buildNotebookModel(data: PageData) {
  const { profile, contact, socials } = data;
  const student = profile.student ?? {};
  const showNumber = contact.showPhoneNumbers && contact.phone;
  const linkedin = socials.find((s) => s.type === "linkedin");

  // Student pages default to hiding numbers, so Call and Text only appear when numbers are allowed.
  const quick: QuickAction[] = [];
  if (showNumber) quick.push({ key: "call", label: "Call", href: `tel:${contact.phone}` });
  if (contact.email) quick.push({ key: "email", label: "Email", href: `mailto:${contact.email}` });
  if (showNumber && contact.sms) quick.push({ key: "text", label: "Text", href: `sms:${contact.phone}` });
  if (linkedin) quick.push({ key: "linkedin", label: "LinkedIn", href: linkedin.url, external: true });

  const { featured, used } = pickFeatured(data);
  // LinkedIn already sits in the action row (and in CONNECT when it is the featured link).
  const { profiles, messaging } = groupSocials(socials.filter((s) => s !== used && s.type !== "linkedin"));

  const programLine = [student.program, student.year].filter(Boolean).join(" · ");
  const schoolLine = [student.school, student.graduating ? `Graduating ${student.graduating}` : undefined]
    .filter(Boolean)
    .join(" · ");

  return {
    initials: initials(profile.fullName),
    greeting: greetingName(profile),
    programLine,
    schoolLine,
    sticky: student.openTo ? { openTo: student.openTo, note: profile.availability ?? null } : null,
    quick,
    featured,
    email: contact.email ?? null,
    profiles,
    messaging,
  };
}

export type OnlineTile = { key: string; type: SocialType; label: string; url: string };

/** The résumé button for a Starter page that bought the PDF add-on (the Standard design builds its own, below). */
export function starterResume(data: PageData): { url: string; label: string } | null {
  const kinds = drawnKinds("student-notebook", data.sections.map((s) => s.kind), "starter");
  const s = data.sections.find((x): x is Extract<Section, { kind: "resume" }> => x.kind === "resume" && kinds.includes("resume"));
  return s ? { url: s.fileUrl, label: s.label ?? "My résumé" } : null;
}

/**
 * The Standard design: a résumé button, three small facts, the optional sections (projects, skills, wins and orgs)
 * in the page's order, and one "Find me online" grid with every link instead of the Starter's three link blocks.
 * Empty things come back empty so the template can leave them out.
 */
export function buildStandardModel(data: PageData) {
  const { profile, contact, socials } = data;
  const student = profile.student ?? {};
  const ok = supportedSections("student-notebook");
  const drawn = data.sections.filter((s) => ok.includes(s.kind));

  const resume = drawn.find((s): s is Extract<Section, { kind: "resume" }> => s.kind === "resume") ?? null;
  const blocks: Partial<Record<"portfolio" | "skills" | "orgs", Section>> = {};
  for (const s of drawn) if (s.kind === "portfolio" || s.kind === "skills" || s.kind === "orgs") blocks[s.kind] ??= s;
  // Without a saved order the design's own order is used: projects, skills, wins and orgs.
  const canonical = (["portfolio", "skills", "orgs"] as const).filter((k) => k in blocks);
  const order = resolveOrder("student-notebook", canonical, data.style.sectionOrder).filter((k) => k in blocks);

  const info = [
    { label: "Studying", value: student.program },
    { label: "Graduating", value: student.graduating },
    { label: "Based in", value: profile.location },
  ].filter((i): i is { label: string; value: string } => Boolean(i.value));

  // Every link, in the order saved. A featured link that is not one of them (a portfolio site) goes first.
  const { featured, used } = pickFeatured(data);
  const tiles: OnlineTile[] = socials.map((s, i) => ({ key: `${s.type}-${i}`, type: s.type, label: SOCIAL_LABELS[s.type], url: s.url }));
  if (featured && !used) tiles.unshift({ key: "featured", type: featured.icon ?? "website", label: featured.label, url: featured.url });

  return {
    resume: resume ? { url: resume.fileUrl, label: resume.label ?? "My résumé" } : null,
    info,
    blocks,
    order,
    tiles,
    email: contact.email ?? null,
  };
}
