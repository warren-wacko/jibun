import { describe, expect, it } from "vitest";
import { ACCENT_PRESET_IDS } from "./accents";
import { ADD_ONS, PUBLIC_TIERS, canUseAccent, checkSections, getEntitlements } from "./entitlements";
import { SECTION_KINDS } from "./page-schema";

const starter = getEntitlements({ tier: "STARTER", addOns: [] });
const standard = getEntitlements({ tier: "STANDARD", addOns: [] });
const custom = getEntitlements({ tier: "CUSTOM", addOns: [] });

const NO_ADD_ON_KINDS = [
  "skills",
  "services",
  "stats",
  "portfolio",
  "experience",
  "interests",
  "orgs",
  "song",
] as const;

describe("tiers", () => {
  it("offers only Starter and Standard publicly", () => {
    expect(PUBLIC_TIERS).toEqual(["STARTER", "STANDARD"]);
  });
});

describe("getEntitlements: tier table", () => {
  it("Starter", () => {
    expect(starter).toMatchObject({
      accent: "preset",
      fonts: "default",
      sectionReordering: false,
      includedOptionalSections: 0,
      revisions: 1,
      smallEdits: 2,
      brandingFooter: true,
      customComponent: false,
    });
  });

  it("Standard", () => {
    expect(standard).toMatchObject({
      accent: "hex",
      fonts: "pairs",
      sectionReordering: true,
      includedOptionalSections: 2,
      revisions: 2,
      smallEdits: 4,
      brandingFooter: true,
      customComponent: false,
    });
  });

  it("CUSTOM has no enforced limits", () => {
    expect(custom).toMatchObject({
      accent: "hex",
      fonts: "any",
      sectionReordering: true,
      includedOptionalSections: Infinity,
      revisions: null,
      smallEdits: null,
      customComponent: true,
    });
  });

  it("gives every tier a featured link", () => {
    expect([starter, standard, custom].every((e) => e.featuredLink)).toBe(true);
  });

  it("font pairs and reordering are Standard and CUSTOM only", () => {
    expect(starter.fonts).toBe("default");
    expect(starter.sectionReordering).toBe(false);
    expect(standard.fonts).not.toBe("default");
    expect(standard.sectionReordering).toBe(true);
    expect(custom.sectionReordering).toBe(true);
  });
});

describe("add-ons", () => {
  it("remove_branding, custom_domain and extra_revision are known add-ons", () => {
    for (const key of ["remove_branding", "custom_domain", "extra_revision"]) {
      expect(ADD_ONS as readonly string[]).toContain(key);
    }
  });

  it.each(["STARTER", "STANDARD"] as const)("remove_branding hides the footer on %s", (tier) => {
    expect(getEntitlements({ tier, addOns: [] }).brandingFooter).toBe(true);
    expect(getEntitlements({ tier, addOns: ["remove_branding"] }).brandingFooter).toBe(false);
  });

  it.each(["STARTER", "STANDARD"] as const)("custom_domain and extra_revision are held per page on %s", (tier) => {
    const e = getEntitlements({ tier, addOns: ["custom_domain", "extra_revision"] });
    expect(e.addOns.has("custom_domain")).toBe(true);
    expect(e.addOns.has("extra_revision")).toBe(true);
    expect(getEntitlements({ tier, addOns: [] }).addOns.has("custom_domain")).toBe(false);
  });

  it("extra_revision does not change the included revision count", () => {
    expect(getEntitlements({ tier: "STARTER", addOns: ["extra_revision"] }).revisions).toBe(1);
  });

  it("ignores unknown add-on keys", () => {
    const e = getEntitlements({ tier: "STARTER", addOns: ["gallery", "bogus"] });
    expect([...e.addOns]).toEqual(["gallery"]);
  });

  it("CUSTOM has every add-on, including branding removal", () => {
    expect([...custom.addOns].sort()).toEqual([...ADD_ONS].sort());
    expect(custom.brandingFooter).toBe(false);
  });
});

describe("checkSections", () => {
  it("Starter has no free sections, but add-on sections are allowed", () => {
    expect(checkSections([{ kind: "skills" }], starter)).toHaveLength(1);
    const withGallery = getEntitlements({ tier: "STARTER", addOns: ["gallery"] });
    expect(checkSections([{ kind: "gallery" }], withGallery)).toEqual([]);
  });

  it("Standard allows 2 non-add-on sections and flags the third", () => {
    const v = checkSections([{ kind: "skills" }, { kind: "stats" }, { kind: "services" }], standard);
    expect(v).toEqual([{ kind: "services", reason: expect.any(String) }]);
  });

  it.each(NO_ADD_ON_KINDS)("caps %s at 2 on Standard", (kind) => {
    const others = NO_ADD_ON_KINDS.filter((k) => k !== kind);
    expect(checkSections([{ kind: others[0] }, { kind: others[1] }, { kind }], standard)).toHaveLength(1);
    expect(checkSections([{ kind: others[0] }, { kind }], standard)).toEqual([]);
  });

  it("an owned add-on section does not use a free pick", () => {
    const e = getEntitlements({ tier: "STANDARD", addOns: ["gallery"] });
    expect(checkSections([{ kind: "gallery" }, { kind: "skills" }, { kind: "stats" }], e)).toEqual([]);
  });

  it("an add-on kind without its add-on uses a free pick and names the add-on when over", () => {
    const v = checkSections([{ kind: "skills" }, { kind: "stats" }, { kind: "video" }], standard);
    expect(v).toHaveLength(1);
    expect(v[0].reason).toContain("video");
  });

  it("owning every section add-on still leaves 2 picks for the rest, and no more", () => {
    const e = getEntitlements({
      tier: "STANDARD",
      addOns: ["gallery", "video", "pdf", "contact_form", "booking"],
    });
    const sections = [
      { kind: "gallery" as const },
      { kind: "video" as const },
      { kind: "resume" as const },
      { kind: "contactForm" as const },
      { kind: "booking" as const },
      { kind: "skills" as const },
      { kind: "stats" as const },
    ];
    expect(checkSections(sections, e)).toEqual([]);
    expect(checkSections([...sections, { kind: "song" as const }], e)).toHaveLength(1);
  });

  it("CUSTOM unlocks every section kind with no limit", () => {
    const everything = SECTION_KINDS.map((kind) => ({ kind }));
    const many = Array.from({ length: 10 }, () => ({ kind: "skills" as const }));
    expect(checkSections(everything, custom)).toEqual([]);
    expect(checkSections(many, custom)).toEqual([]);
  });
});

describe("canUseAccent", () => {
  it("Starter is limited to presets", () => {
    expect(canUseAccent("school-blue-gold", starter, ACCENT_PRESET_IDS)).toBe(true);
    expect(canUseAccent("#123456", starter, ACCENT_PRESET_IDS)).toBe(false);
  });

  it("Standard and CUSTOM may use any hex", () => {
    expect(canUseAccent("#123456", standard, ACCENT_PRESET_IDS)).toBe(true);
    expect(canUseAccent("#123456", custom, ACCENT_PRESET_IDS)).toBe(true);
  });
});
