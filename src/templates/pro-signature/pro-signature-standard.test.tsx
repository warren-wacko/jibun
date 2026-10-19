import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageData, Section } from "@/lib/page-schema";
import { STANDARD_PREVIEW_SECTIONS } from "@/lib/preview";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { SUPPORTED_SECTIONS } from "../supported-sections";
import type { TemplateMeta } from "../types";
import { ProSignatureTemplate } from "./index";
import { buildBlocks, buildSignatureModel, titleParts } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
  design: "standard",
};

const render = (data: PageData, meta: TemplateMeta = META) =>
  renderToStaticMarkup(<ProSignatureTemplate data={data} theme="light" meta={meta} />);

const withSections = (sections: Section[], style: Partial<PageData["style"]> = {}): PageData => ({
  ...SAMPLE_PAGE_DATA,
  sections,
  style: { ...SAMPLE_PAGE_DATA.style, ...style },
});

const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-z]+)"/g)].map((m) => m[1]);

describe("buildBlocks", () => {
  const sections: Section[] = [
    { kind: "stats", items: [{ label: "Years", value: "8+" }] },
    { kind: "experience", items: [{ role: "Designer", org: "Northwind", years: "2022" }] },
    { kind: "skills", items: ["Figma"] },
  ];

  it("keeps the Starter design a fixed stack", () => {
    const b = buildBlocks(withSections(sections, { sectionOrder: ["messages", "about"] }), "starter");
    expect(b.order).toEqual(["about", "connect", "profiles", "messages"]);
    expect(b.sections).toEqual({});
  });

  it("puts the first section after About and the second after Connect in the Standard design", () => {
    expect(buildBlocks(withSections(sections), "standard").order).toEqual(["about", "stats", "connect", "experience", "profiles", "messages", "skills"]);
  });

  it("leaves out kinds without a design", () => {
    const b = buildBlocks(withSections([{ kind: "song", spotifyUrl: "https://open.spotify.com/track/1" }, ...sections]), "standard");
    expect(b.order).not.toContain("song");
  });
});

describe("the Standard design", () => {
  it("draws every supported section once and skips the rest", () => {
    const drawn = blocksIn(render(withSections(STANDARD_PREVIEW_SECTIONS)));
    for (const kind of SUPPORTED_SECTIONS["pro-signature"]) expect(drawn.filter((b) => b === kind), kind).toHaveLength(1);
    for (const kind of ["video", "interests", "song", "booking", "orgs"]) expect(drawn).not.toContain(kind);
  });

  it("has the same blocks as the Starter design when there are no sections", () => {
    expect(blocksIn(render(SAMPLE_PAGE_DATA))).toEqual(blocksIn(render(SAMPLE_PAGE_DATA, { ...META, design: "starter" })));
  });

  it("draws only add-on sections, order and font pair on the Starter design, and has no ticker there", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS, { fontPair: "bold", sectionOrder: ["messages", "about"] }), { ...META, design: "starter" });
    // Starter draws only what a paid add-on unlocks (gallery, PDF), in the template's default order, never the free picks
    const kinds = blocksIn(html);
    expect(kinds).toContain("gallery");
    expect(kinds).toContain("resume");
    for (const k of ["services", "experience", "skills", "stats", "portfolio"]) expect(kinds).not.toContain(k);
    expect(kinds[0]).toBe("about");
    expect(html).not.toContain("data-font-pair");
    expect(html).not.toContain("ps-ticker");
  });

  it("applies a font pair that belongs to the template, and ignores one that does not", () => {
    for (const id of ["editorial", "technical", "bold"]) expect(render(withSections([], { fontPair: id }))).toContain(`data-font-pair="${id}"`);
    expect(render(withSections([], { fontPair: "vogue" }))).not.toContain("data-font-pair");
  });

  it("follows the page order", () => {
    const html = render(withSections([{ kind: "skills", items: ["Figma"] }], { sectionOrder: ["skills", "messages", "about", "connect", "profiles"] }));
    expect(blocksIn(html)).toEqual(["skills", "messages", "about", "connect", "profiles"]);
  });
});

describe("the ticker", () => {
  it("is built from the title, availability and location, and shown only in the Standard design", () => {
    const m = buildSignatureModel(SAMPLE_PAGE_DATA);
    expect(m.ticker).toEqual(["Product Designer", "Replies within a day", "Cavite, PH"]);
    const html = render(SAMPLE_PAGE_DATA);
    expect(html).toContain("ps-ticker");
    expect(html).toContain("Replies within a day");
  });

  it("shows each word twice (the second copy hidden from screen readers) so it can scroll without a gap", () => {
    const html = render(SAMPLE_PAGE_DATA);
    expect(html.match(/ps-ticker-item/g)).toHaveLength(6);
    expect(html.match(/aria-hidden="true"[^>]*class="ps-ticker-item"|class="ps-ticker-item"[^>]*aria-hidden="true"/g)).toHaveLength(3);
  });

  it("is left out when there is nothing to say", () => {
    const bare: PageData = { ...SAMPLE_PAGE_DATA, profile: { fullName: "A" } };
    expect(buildSignatureModel(bare).ticker).toEqual([]);
    expect(render(bare)).not.toContain("ps-ticker");
  });

  it("splits a title on its separators", () => {
    expect(titleParts("Software Engineer · Full-Stack Developer")).toEqual(["Software Engineer", "Full-Stack Developer"]);
    expect(titleParts("Designer | Writer — Speaker")).toEqual(["Designer", "Writer", "Speaker"]);
    expect(titleParts(undefined)).toEqual([]);
  });
});

describe("sections", () => {
  it("draw their content", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS));
    expect(html).toContain("8+ years");
    expect(html).toContain("Senior Product Designer");
    expect(html).toContain("User research");
    expect(html).toContain("from ₱15,000");
    expect(html).toContain("1 / 3"); // gallery tag
    expect(html).toContain("01"); // service number
    expect(html).toContain('href="https://example.com/northwind"');
    expect(html).toContain('aria-label="Download résumé"');
  });

  it("hide what has no data", () => {
    const html = render(withSections([{ kind: "services", items: [{ name: "Logo" }] }, { kind: "portfolio", items: [{ title: "Site", url: "https://example.com" }] }]));
    expect(html).not.toContain("ps-price");
    expect(html).not.toContain("ps-work-thumb");
    expect(html).not.toContain("ps-item-desc");
  });

  it("mark the latest experience as current and use up to three stat columns", () => {
    const exp = render(withSections([{ kind: "experience", items: [{ role: "A", org: "x", years: "1" }, { role: "B", org: "y", years: "2" }] }]));
    expect(exp.match(/is-current/g)).toHaveLength(1);
    const stats = (n: number) => render(withSections([{ kind: "stats", items: Array.from({ length: n }, (_, i) => ({ label: `l${i}`, value: `${i}` })) }]));
    expect(stats(1)).toContain("--cols:1");
    expect(stats(6)).toContain("--cols:3");
  });
});

describe("the files", () => {
  it("contain no colour values in the component files", () => {
    for (const file of ["index.tsx", "sections.tsx", "interactive.tsx", "model.ts"]) {
      expect(readFileSync(path.join(__dirname, file), "utf8").match(/#[0-9a-fA-F]{3,8}\b/g), file).toBeNull();
    }
  });
});
