import { describe, expect, it } from "vitest";
import { getEntitlements } from "../entitlements";
import { SECTION_KINDS, SectionSchema, type Section } from "../page-schema";
import { SAMPLE_PAGE_DATA } from "../sample-data";
import { emptyFormValues, validateForm, valuesFromPage, type FormValues } from "./page-form";
import {
  SECTION_ORDER_IN_PICKER,
  SECTION_SPECS,
  draftLines,
  draftToCandidate,
  emptyDraft,
  picksUsed,
  sectionAvailability,
  sectionToDraft,
  type SectionDraft,
} from "./section-drafts";

const base = (over: Partial<FormValues> = {}): FormValues => ({
  ...emptyFormValues(),
  clientName: "Maria",
  username: "maria-s",
  fullName: "Maria Santos",
  tier: "STANDARD",
  ...over,
});

const draft = (kind: SectionDraft["kind"], over: Partial<SectionDraft> = {}): SectionDraft => ({ ...emptyDraft(kind, "d1"), ...over });
const row = (id: string, fields: Record<string, string>) => ({ id, ...fields });

describe("specs", () => {
  it("cover every section kind, and the picker lists each exactly once", () => {
    expect(Object.keys(SECTION_SPECS).sort()).toEqual([...SECTION_KINDS].sort());
    expect([...SECTION_ORDER_IN_PICKER].sort()).toEqual([...SECTION_KINDS].sort());
  });
});

describe("draft <-> section", () => {
  const samples: Section[] = [
    { kind: "gallery", images: [{ url: "https://x.test/a.jpg", alt: "A" }] },
    {
      kind: "portfolio",
      items: [{ title: "Site", url: "https://x.test", desc: "A site", thumbUrl: "https://x.test/t.jpg" }, { title: "App", url: "https://x.test/app" }],
    },
    { kind: "services", items: [{ name: "Logo design", price: "₱3,000" }, { name: "Consulting" }] },
    { kind: "resume", fileUrl: "https://x.test/cv.pdf", label: "My CV" },
    { kind: "experience", items: [{ role: "Designer", org: "Northwind", years: "2021–2024" }] },
    { kind: "skills", items: ["Figma", "Prototyping"] },
    { kind: "stats", items: [{ label: "Years", value: "8+" }] },
    { kind: "video", url: "https://youtu.be/x" },
    { kind: "contactForm" },
    { kind: "booking", url: "https://cal.test/me" },
    { kind: "interests", items: ["coffee", "anime"] },
    { kind: "orgs", items: [{ name: "Debate Society", role: "President" }, { name: "Chess Club" }] },
    { kind: "song", spotifyUrl: "https://open.spotify.com/track/1" },
  ];

  it.each(samples)("round-trips a $kind section unchanged", (section) => {
    const { candidate } = draftToCandidate(sectionToDraft(section, "d"));
    expect(SectionSchema.parse(candidate)).toEqual(section);
  });

  it("covers every kind in the round-trip samples", () => {
    expect(samples.map((s) => s.kind).sort()).toEqual([...SECTION_KINDS].sort());
  });
});

describe("draftToCandidate", () => {
  it("drops blank rows and remembers which draft row each stored item came from", () => {
    const d = draft("services", {
      items: [row("a", { name: "", price: "" }), row("b", { name: " Logo ", price: "" }), row("c", { name: "", price: "" }), row("d", { name: "Web", price: "₱1" })],
    });
    const { candidate, itemMap } = draftToCandidate(d);
    expect(candidate).toEqual({ kind: "services", items: [{ name: "Logo", price: undefined }, { name: "Web", price: "₱1" }] });
    expect(itemMap).toEqual([1, 3]);
  });

  it("turns one-per-line text into items, ignoring blank lines", () => {
    expect(draftLines("Figma\n\n  Prototyping  \r\nUser research\n")).toEqual(["Figma", "Prototyping", "User research"]);
    expect(draftToCandidate(draft("skills", { text: "A\nB" })).candidate).toEqual({ kind: "skills", items: ["A", "B"] });
  });

  it("keeps a résumé label only for the résumé", () => {
    expect(draftToCandidate(draft("resume", { url: " https://x.test/cv.pdf ", label: " CV " })).candidate).toEqual({
      kind: "resume",
      fileUrl: "https://x.test/cv.pdf",
      label: "CV",
    });
    expect(draftToCandidate(draft("video", { url: "https://y.test", label: "ignored" })).candidate).toEqual({ kind: "video", url: "https://y.test" });
  });
});

describe("sections in the form", () => {
  it("stores valid sections in PageData", () => {
    const r = validateForm(
      base({ sections: [draft("skills", { text: "Figma\nSketch" }), draft("services", { id: "d2", items: [row("r", { name: "Logo", price: "" })] })] }),
    );
    expect(r.ok && r.data.sections).toEqual([
      { kind: "skills", items: ["Figma", "Sketch"] },
      { kind: "services", items: [{ name: "Logo", price: undefined }] },
    ]);
  });

  it("asks for at least one item in an empty section", () => {
    const r = validateForm(base({ sections: [draft("services")] }));
    expect(r.errors["sections.0.items"]).toBeTruthy();
    expect(validateForm(base({ sections: [draft("skills", { text: "  " })] })).errors["sections.0.text"]).toBeTruthy();
  });

  it("points a problem at the right row and field", () => {
    const d = draft("experience", { items: [row("a", { role: "", org: "", years: "" }), row("b", { role: "Designer", org: "", years: "2020" })] });
    const errors = validateForm(base({ sections: [d] })).errors;
    expect(Object.keys(errors)).toEqual(["sections.0.items.1.org"]);
  });

  it("checks links", () => {
    expect(validateForm(base({ sections: [draft("video", { url: "not a link" })], addOns: ["video"] })).errors["sections.0.url"]).toBeTruthy();
    expect(validateForm(base({ sections: [draft("video", { url: "https://youtu.be/x" })], addOns: ["video"] })).ok).toBe(true);
  });

  it("allows each kind once, and not the contact form yet", () => {
    const two = validateForm(base({ sections: [draft("skills", { text: "A" }), draft("skills", { id: "d2", text: "B" })] }));
    expect(two.errors["sections.1"]).toMatch(/once/);
    expect(validateForm(base({ sections: [draft("contactForm")], addOns: ["contact_form"] })).errors["sections.0"]).toMatch(/later version/);
  });

  it("holds Standard to 2 picks, but add-on sections are free", () => {
    const stats = draft("stats", { id: "d2", items: [row("r", { label: "Y", value: "1" })] });
    const three = [draft("skills", { text: "A" }), stats, draft("interests", { id: "d3", text: "x" })];
    expect(validateForm(base({ sections: three })).errors.sections).toBeTruthy();
    const withGallery = [draft("skills", { text: "A" }), stats, draft("gallery", { id: "d3", items: [row("g", { url: "https://x.test/a.jpg", alt: "A" })] })];
    expect(validateForm(base({ sections: withGallery, addOns: ["gallery"] })).ok).toBe(true);
    expect(validateForm(base({ sections: withGallery })).errors.sections).toBeTruthy();
  });

  it("saves the order only on a tier that allows it", () => {
    expect(validateForm(base({ sectionOrder: ["about", "connect"] })).ok).toBe(true);
    expect(validateForm(base({ tier: "STARTER", sectionOrder: ["about", "connect"] })).errors.sectionOrder).toBeTruthy();
    const r = validateForm(base({ sectionOrder: ["connect", "about"] }));
    expect(r.ok && r.data.style.sectionOrder).toEqual(["connect", "about"]);
  });

  it("round-trips a stored page with sections and an order", () => {
    const data = {
      ...SAMPLE_PAGE_DATA,
      sections: [
        { kind: "skills" as const, items: ["Figma"] },
        { kind: "stats" as const, items: [{ label: "Years", value: "8+" }] },
      ],
      style: { ...SAMPLE_PAGE_DATA.style, sectionOrder: ["stats", "about"] },
    };
    const values = valuesFromPage({
      username: "maria",
      tier: "STANDARD",
      templateKey: "pro-classic",
      status: "DRAFT",
      paidUntil: null,
      addOns: [],
      data,
      client: { name: "M", contactEmail: null, contactPhone: null, notes: null },
    });
    expect(values.sectionOrder).toEqual(["stats", "about"]);
    const r = validateForm(values);
    expect(r.ok && r.data.sections).toEqual(data.sections);
  });
});

describe("sectionAvailability", () => {
  const starter = getEntitlements({ tier: "STARTER", addOns: [] });
  const standard = getEntitlements({ tier: "STANDARD", addOns: [] });

  it("explains a Starter page has no free sections, unless an add-on unlocks it", () => {
    const a = sectionAvailability("skills", [], starter);
    expect(!a.ok && a.reason).toMatch(/no free sections/);
    const gallery = sectionAvailability("gallery", [], getEntitlements({ tier: "STARTER", addOns: ["gallery"] }));
    expect(gallery).toEqual({ ok: true, note: "Unlocked by the gallery add-on" });
    const blocked = sectionAvailability("gallery", [], starter);
    expect(!blocked.ok && blocked.reason).toMatch(/gallery add-on/);
  });

  it("counts Standard's two picks", () => {
    expect(sectionAvailability("skills", [], standard)).toEqual({ ok: true, note: "Uses one of the free sections" });
    expect(sectionAvailability("stats", ["skills"], standard).ok).toBe(true);
    const full = sectionAvailability("interests", ["skills", "stats"], standard);
    expect(!full.ok && full.reason).toMatch(/All 2 free sections are used/);
    expect(picksUsed(["skills", "stats", "gallery"], getEntitlements({ tier: "STANDARD", addOns: ["gallery"] }))).toBe(2);
  });

  it("has no limit on Custom, and refuses a repeat and the contact form", () => {
    const custom = getEntitlements({ tier: "CUSTOM", addOns: [] });
    expect(sectionAvailability("skills", ["stats", "services", "experience"], custom)).toEqual({ ok: true, note: "Included" });
    expect(sectionAvailability("skills", ["skills"], custom)).toEqual({ ok: false, reason: "Already added" });
    expect(sectionAvailability("contactForm", [], custom).ok).toBe(false);
  });
});
