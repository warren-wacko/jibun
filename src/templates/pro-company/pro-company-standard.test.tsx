import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageData, Section } from "@/lib/page-schema";
import { STANDARD_PREVIEW_SECTIONS } from "@/lib/preview";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { SUPPORTED_SECTIONS } from "../supported-sections";
import type { TemplateMeta } from "../types";
import { ProCompanyTemplate } from "./index";
import { buildBlocks, buildCompanyModel } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
  design: "standard",
};

const render = (data: PageData, meta: TemplateMeta = META) =>
  renderToStaticMarkup(<ProCompanyTemplate data={data} theme="light" meta={meta} />);

const withSections = (sections: Section[], style: Partial<PageData["style"]> = {}): PageData => ({
  ...SAMPLE_PAGE_DATA,
  sections,
  style: { ...SAMPLE_PAGE_DATA.style, ...style },
});

const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-z]+)"/g)].map((m) => m[1]);
const numbersIn = (html: string) => [...html.matchAll(/class="pco-sec-num">(\d\d)</g)].map((m) => m[1]);

describe("buildBlocks", () => {
  const sections: Section[] = [
    { kind: "experience", items: [{ role: "Designer", org: "Northwind", years: "2022" }] },
    { kind: "services", items: [{ name: "Logo" }] },
    { kind: "skills", items: ["Figma"] },
  ];

  it("keeps the Starter design a fixed stack", () => {
    const b = buildBlocks(withSections(sections, { sectionOrder: ["messages", "about"] }), "starter");
    expect(b.order).toEqual(["about", "connect", "profiles", "messages"]);
    expect(b.sections).toEqual({});
  });

  it("puts the first section after About and the second after Connect in the Standard design", () => {
    expect(buildBlocks(withSections(sections), "standard").order).toEqual(["about", "experience", "connect", "services", "profiles", "messages", "skills"]);
  });

  it("leaves out kinds without a design", () => {
    const b = buildBlocks(withSections([{ kind: "song", spotifyUrl: "https://open.spotify.com/track/1" }, ...sections]), "standard");
    expect(b.order).not.toContain("song");
  });
});

describe("numbered sections", () => {
  it("count only the blocks that are drawn, Get in touch staying 00, in the Standard order", () => {
    const m = buildCompanyModel(withSections([{ kind: "experience", items: [{ role: "A", org: "x", years: "1" }] }, { kind: "skills", items: ["Figma"] }]), "standard");
    expect(m.sections.map((s) => [s.key, s.num])).toEqual([
      ["about", "01"],
      ["experience", "02"],
      ["connect", "03"],
      ["skills", "04"],
      ["profiles", "05"],
      ["messages", "06"],
    ]);
  });

  it("are numbered on the page in order", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS));
    const drawn = blocksIn(html);
    expect(numbersIn(html)).toEqual(["00", ...drawn.map((_, i) => String(i + 1).padStart(2, "0"))]);
  });
});

describe("the Standard design", () => {
  it("draws every supported section once and skips the rest", () => {
    const drawn = blocksIn(render(withSections(STANDARD_PREVIEW_SECTIONS)));
    for (const kind of SUPPORTED_SECTIONS["pro-company"]) expect(drawn.filter((b) => b === kind), kind).toHaveLength(1);
    for (const kind of ["video", "interests", "song", "booking", "orgs"]) expect(drawn).not.toContain(kind);
  });

  it("has the same blocks as the Starter design when there are no sections", () => {
    expect(blocksIn(render(SAMPLE_PAGE_DATA))).toEqual(blocksIn(render(SAMPLE_PAGE_DATA, { ...META, design: "starter" })));
  });

  it("ignores sections, order and font pair on the Starter design", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS, { fontPair: "modern", sectionOrder: ["messages", "about"] }), { ...META, design: "starter" });
    expect(blocksIn(html)).toEqual(["about", "connect", "profiles", "messages"]);
    expect(html).not.toContain("data-font-pair");
  });

  it("applies a font pair that belongs to the template, and ignores one that does not", () => {
    for (const id of ["classic", "modern", "executive"]) expect(render(withSections([], { fontPair: id }))).toContain(`data-font-pair="${id}"`);
    expect(render(withSections([], { fontPair: "bold" }))).not.toContain("data-font-pair");
  });

  it("follows the page order", () => {
    const html = render(withSections([{ kind: "skills", items: ["Figma"] }], { sectionOrder: ["skills", "messages", "about", "connect", "profiles"] }));
    expect(blocksIn(html)).toEqual(["skills", "messages", "about", "connect", "profiles"]);
  });

  it("draws services bare and the other sections in a box", () => {
    const html = render(withSections([{ kind: "services", items: [{ name: "Logo" }] }, { kind: "skills", items: ["Figma"] }]));
    const services = html.split('data-block="services"')[1].split("</section>")[0];
    const skills = html.split('data-block="skills"')[1].split("</section>")[0];
    expect(services).not.toContain("pco-box");
    expect(skills).toContain("pco-box");
  });
});

describe("sections", () => {
  it("draw their content", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS));
    expect(html).toContain("8+ years");
    expect(html).toContain("Senior Product Designer");
    expect(html).toContain("User research");
    expect(html).toContain("from ₱15,000");
    expect(html).toContain('href="https://example.com/northwind"');
    expect(html).toContain('alt="Studio visit"');
    expect(html).toContain('href="https://example.com/maria-santos-resume.pdf"');
  });

  it("hide what has no data", () => {
    const html = render(withSections([{ kind: "services", items: [{ name: "Logo" }] }, { kind: "portfolio", items: [{ title: "Site", url: "https://example.com" }] }]));
    expect(html).not.toContain("pco-price");
    expect(html).not.toContain("pco-work-thumb");
    expect(html).not.toContain("pco-work-desc");
  });

  it("mark the latest experience as current and use up to three stat columns", () => {
    const exp = render(withSections([{ kind: "experience", items: [{ role: "A", org: "x", years: "1" }, { role: "B", org: "y", years: "2" }] }]));
    expect(exp.match(/is-current/g)).toHaveLength(1);
    const stats = (n: number) => render(withSections([{ kind: "stats", items: Array.from({ length: n }, (_, i) => ({ label: `l${i}`, value: `${i}` })) }]));
    expect(stats(2)).toContain("--cols:2");
    expect(stats(7)).toContain("--cols:3");
  });
});

describe("the files", () => {
  it("contain no colour values in the component files", () => {
    for (const file of ["index.tsx", "sections.tsx", "interactive.tsx", "model.ts"]) {
      expect(readFileSync(path.join(__dirname, file), "utf8").match(/#[0-9a-fA-F]{3,8}\b/g), file).toBeNull();
    }
  });
});
