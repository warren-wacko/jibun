import type { SectionKind } from "./page-schema";

/** STARTER and STANDARD are the public tiers. CUSTOM is quoted per job and set by the admin only. */
export type Tier = "STARTER" | "STANDARD" | "CUSTOM";

export const PUBLIC_TIERS = ["STARTER", "STANDARD"] as const satisfies readonly Tier[];

/** Any tier can buy any add-on; CUSTOM has all of them. */
export const ADD_ONS = [
  "gallery",
  "video",
  "pdf",
  "contact_form",
  "booking",
  "analytics",
  "custom_domain",
  "remove_branding",
  "extra_revision",
] as const;
export type AddOn = (typeof ADD_ONS)[number];

/** Sections that a purchased add-on unlocks regardless of tier. */
export const SECTION_ADD_ON: Partial<Record<SectionKind, AddOn>> = {
  gallery: "gallery",
  video: "video",
  resume: "pdf",
  contactForm: "contact_form",
  booking: "booking",
};

export type Entitlements = {
  tier: Tier;
  /** Which of a template's two designs the page gets: its Starter design or its Standard design (Standard and Custom). */
  design: "starter" | "standard";
  /** Every template is available in every tier; only CUSTOM may use a one-off custom-[slug] component and bannerUrl. */
  customComponent: boolean;
  accent: "preset" | "hex";
  fonts: "default" | "pairs" | "any";
  sectionReordering: boolean;
  /** Non-add-on optional sections allowed; Infinity for CUSTOM. */
  includedOptionalSections: number;
  featuredLink: boolean;
  /** Included revisions. null = not enforced (CUSTOM: whatever the quote says). The extra_revision add-on adds more. */
  revisions: number | null;
  /** Small edits included in the first year. null = not counted (CUSTOM). */
  smallEdits: number | null;
  brandingFooter: boolean;
  /** Add-ons the page has. CUSTOM has all of them. */
  addOns: ReadonlySet<AddOn>;
};

type TierRules = Omit<Entitlements, "tier" | "brandingFooter" | "addOns">;

const TIER_RULES: Record<Tier, TierRules> = {
  STARTER: {
    design: "starter",
    customComponent: false,
    accent: "preset",
    fonts: "default",
    sectionReordering: false,
    includedOptionalSections: 0,
    featuredLink: true,
    revisions: 1,
    smallEdits: 2,
  },
  STANDARD: {
    design: "standard",
    customComponent: false,
    accent: "hex",
    fonts: "pairs",
    sectionReordering: true,
    includedOptionalSections: 2,
    featuredLink: true,
    revisions: 2,
    smallEdits: 4,
  },
  CUSTOM: {
    design: "standard",
    customComponent: true,
    accent: "hex",
    fonts: "any",
    sectionReordering: true,
    includedOptionalSections: Infinity,
    featuredLink: true,
    revisions: null,
    smallEdits: null,
  },
};

const KNOWN_ADD_ONS: ReadonlySet<string> = new Set(ADD_ONS);

/** Combine a page's tier with its purchased add-ons. Unknown add-on keys are ignored. */
export function getEntitlements(page: { tier: Tier; addOns: readonly string[] }): Entitlements {
  const rules = TIER_RULES[page.tier];
  const addOns: Set<AddOn> =
    page.tier === "CUSTOM"
      ? new Set(ADD_ONS)
      : new Set(page.addOns.filter((a): a is AddOn => KNOWN_ADD_ONS.has(a)));
  return {
    ...rules,
    tier: page.tier,
    brandingFooter: !addOns.has("remove_branding"),
    addOns,
  };
}

/** True when this section kind is unlocked by an owned add-on (not counted against the free picks). */
export function isSectionUnlockedByAddOn(kind: SectionKind, ent: Entitlements): boolean {
  const addOn = SECTION_ADD_ON[kind];
  return addOn !== undefined && ent.addOns.has(addOn);
}

export type SectionViolation = { kind: SectionKind; reason: string };

/**
 * Check a page's sections against its entitlements.
 * A section unlocked by an add-on does not use a free pick; every other section does.
 * Standard is capped at 2 such sections; a third needs a CUSTOM quote (admin sets the tier).
 */
export function checkSections(
  sections: readonly { kind: SectionKind }[],
  ent: Entitlements,
): SectionViolation[] {
  const violations: SectionViolation[] = [];
  let used = 0;
  for (const { kind } of sections) {
    if (isSectionUnlockedByAddOn(kind, ent)) continue;
    used += 1;
    if (used > ent.includedOptionalSections) {
      const addOn = SECTION_ADD_ON[kind];
      violations.push({
        kind,
        reason: addOn
          ? `Requires the "${addOn}" add-on or a free section slot`
          : "No free optional section slots left on this tier",
      });
    }
  }
  return violations;
}

/** The editor shows a locked option only when this returns true. */
export function canUseAccent(accent: string, ent: Entitlements, presetIds: readonly string[]): boolean {
  if (ent.accent === "hex") return true;
  return presetIds.includes(accent);
}
