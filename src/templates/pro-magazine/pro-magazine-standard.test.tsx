import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageData, Section } from "@/lib/page-schema";
import { STANDARD_PREVIEW_SECTIONS } from "@/lib/preview";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { SUPPORTED_SECTIONS } from "../supported-sections";
import type { TemplateMeta } from "../types";
import { ProMagazineTemplate } from "./index";
import { buildBlocks, buildMagazineModel, headlineEm } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
  design: "standard",
};

const render = (data: PageData, meta: TemplateMeta = META) =>
  renderToStaticMarkup(<ProMagazineTemplate data={data} theme="light" meta={meta} />);

const withSections = (sections: Section[], style: Partial<PageData["style"]> = {}): PageData => ({
  ...SAMPLE_PAGE_DATA,
  sections,
  style: { ...SAMPLE_PAGE_DATA.style, ...style },
});

const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-z]+)"/g)].map((m) => m[1]);
const pagesIn = (html: string) => [...html.matchAll(/P\. (\d\d)/g)].map((m) => m[1]);

describe("buildBlocks", () => {
  const sections: Section[] = [
    { kind: "skills", items: ["Figma"] },
    { kind: "experience", items: [{ role: "Designer", org: "Northwind", years: "2022" }] },
  ];

  it("keeps the Starter design a fixed stack", () => {
    const b = buildBlocks(withSections(sections, { sectionOrder: ["socials", "about"] }), "starter");
    expect(b.order).toEqual(["about", "contents", "connect", "socials"]);
    expect(b.sections).toEqual({});
  });

  it("puts the first section after the contents and the second after Connect in the Standard design", () => {
    expect(buildBlocks(withSections(sections), "standard").order).toEqual(["about", "contents", "skills", "connect", "experience", "socials"]);
  });

  it("follows a saved order and leaves out kinds without a design", () => {
    const b = buildBlocks(withSections([...sections, { kind: "song", spotifyUrl: "https://open.spotify.com/track/1" }], { sectionOrder: ["socials", "about"] }), "standard");
    expect(b.order.slice(0, 2)).toEqual(["socials", "about"]);
    expect(b.order).not.toContain("song");
  });
});

describe("the Standard design", () => {
  it("draws every supported section once, and numbers the blocks like pages in the order drawn", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS));
    const drawn = blocksIn(html);
    for (const kind of SUPPORTED_SECTIONS["pro-magazine"]) expect(drawn.filter((b) => b === kind), kind).toHaveLength(1);
    for (const kind of ["video", "interests", "song", "booking", "orgs"]) expect(drawn).not.toContain(kind);
    expect(pagesIn(html)).toEqual(drawn.map((_, i) => String(i + 1).padStart(2, "0")));
  });

  it("has the same blocks as the Starter design when there are no sections", () => {
    const starter = blocksIn(render(SAMPLE_PAGE_DATA, { ...META, design: "starter" }));
    expect(blocksIn(render(SAMPLE_PAGE_DATA))).toEqual(starter);
  });

  it("does not number pages on the Starter design, and draws only add-on sections, order and pair there", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS, { fontPair: "vogue", sectionOrder: ["socials"] }), { ...META, design: "starter" });
    expect(pagesIn(html)).toEqual([]);
    // Starter draws only what a paid add-on unlocks (gallery, PDF), in the template's default order, never the free picks
    const kinds = blocksIn(html);
    expect(kinds).toContain("gallery");
    expect(kinds).toContain("resume");
    for (const k of ["services", "experience", "skills", "stats", "portfolio"]) expect(kinds).not.toContain(k);
    expect(kinds[0]).toBe("about");
    expect(html).not.toContain("data-font-pair");
  });

  it("skips a block with nothing to show, and the page numbers close the gap", () => {
    const html = render({ ...SAMPLE_PAGE_DATA, profile: { ...SAMPLE_PAGE_DATA.profile, bio: undefined } });
    expect(blocksIn(html)).not.toContain("about");
    expect(pagesIn(html)[0]).toBe("01");
  });

  it("applies a font pair that belongs to the template, and ignores one that does not", () => {
    for (const id of ["vogue", "tabloid", "indie"]) expect(render(withSections([], { fontPair: id }))).toContain(`data-font-pair="${id}"`);
    expect(render(withSections([], { fontPair: "bold" }))).not.toContain("data-font-pair");
  });

  it("follows the page order", () => {
    const html = render(withSections([{ kind: "skills", items: ["Figma"] }], { sectionOrder: ["skills", "socials", "about", "contents", "connect"] }));
    expect(blocksIn(html)).toEqual(["skills", "socials", "about", "contents", "connect"]);
  });
});

describe("sections", () => {
  it("draw their content", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS));
    expect(html).toContain("8+ years"); // stats
    expect(html).toContain("Senior Product Designer"); // experience
    expect(html).toContain("User research"); // skills
    expect(html).toContain("from ₱15,000"); // services price
    expect(html).toContain("FIG. 1"); // gallery caption
    expect(html).toContain('href="https://example.com/northwind"');
    expect(html).toContain('href="https://example.com/maria-santos-resume.pdf"');
    expect(html).toContain("Download PDF");
  });

  it("hide what has no data", () => {
    const html = render(withSections([{ kind: "services", items: [{ name: "Logo" }] }, { kind: "portfolio", items: [{ title: "Site", url: "https://example.com" }] }]));
    expect(html).not.toContain("pm-price");
    expect(html).not.toContain("pm-work-thumb");
    expect(html).not.toContain("pm-item-desc");
  });

  it("highlight the latest experience, and use up to three stat columns", () => {
    const exp = render(withSections([{ kind: "experience", items: [{ role: "A", org: "x", years: "1" }, { role: "B", org: "y", years: "2" }] }]));
    expect(exp.match(/is-current/g)).toHaveLength(1);
    const stats = (n: number) => render(withSections([{ kind: "stats", items: Array.from({ length: n }, (_, i) => ({ label: `l${i}`, value: `${i}` })) }]));
    expect(stats(2)).toContain("--cols:2");
    expect(stats(5)).toContain("--cols:3");
  });
});

describe("the headline", () => {
  it("is sized from the chosen pair's glyph widths", () => {
    const wide = headlineEm("MAXIMILIANO", "indie");
    expect(wide).toBeGreaterThan(headlineEm("MAXIMILIANO")); // Fraunces is wider than the condensed default
    expect(headlineEm("MAXIMILIANO", "tabloid")).toBeLessThan(wide);
    expect(headlineEm("MAXIMILIANO", "not-a-pair")).toBe(headlineEm("MAXIMILIANO"));
  });

  it("gives the model a wider headline for a wider pair", () => {
    const d = { ...SAMPLE_PAGE_DATA, profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "Maximiliano Bartholomew" } };
    expect(buildMagazineModel(d, "vogue").nameEm).toBeGreaterThan(buildMagazineModel(d).nameEm);
  });

  it("still fits a 30-character name on two lines for every pair", () => {
    const d = { ...SAMPLE_PAGE_DATA, profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "Maximiliano Bartholomew Santia" } };
    for (const pair of ["vogue", "tabloid", "indie"]) expect(buildMagazineModel(d, pair).nameLines).toHaveLength(2);
  });
});

describe("the files", () => {
  it("contain no colour values in the component files", () => {
    for (const file of ["index.tsx", "sections.tsx", "interactive.tsx", "model.ts"]) {
      expect(readFileSync(path.join(__dirname, file), "utf8").match(/#[0-9a-fA-F]{3,8}\b/g), file).toBeNull();
    }
  });
});
