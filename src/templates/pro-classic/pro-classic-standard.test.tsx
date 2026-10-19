import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ACCENT_PRESETS, contrastRatio, resolveAccent } from "@/lib/accents";
import type { PageData, Section } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { STANDARD_PREVIEW_SECTIONS } from "@/lib/preview";
import { SUPPORTED_SECTIONS } from "../supported-sections";
import type { TemplateMeta } from "../types";
import { ProClassicTemplate } from "./index";
import { buildBlocks } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
  design: "standard",
};

const render = (data: PageData, meta: TemplateMeta = META, theme: "light" | "dark" = "light") =>
  renderToStaticMarkup(<ProClassicTemplate data={data} theme={theme} meta={meta} />);

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

  it("keeps the Starter design a fixed stack with no sections", () => {
    const b = buildBlocks(withSections(sections, { sectionOrder: ["messages", "about"] }), "starter");
    expect(b.order).toEqual(["about", "connect", "profiles", "messages"]);
    expect(b.sections).toEqual({});
  });

  it("puts the first section after About and the second after Connect in the Standard design", () => {
    expect(buildBlocks(withSections(sections), "standard").order).toEqual(["about", "stats", "connect", "experience", "profiles", "messages", "skills"]);
  });

  it("follows a saved order", () => {
    const order = ["messages", "skills", "about", "connect", "profiles", "stats", "experience"];
    expect(buildBlocks(withSections(sections, { sectionOrder: order }), "standard").order).toEqual(order);
  });

  it("leaves out kinds the template has no design for", () => {
    const b = buildBlocks(withSections([{ kind: "song", spotifyUrl: "https://open.spotify.com/track/1" }, ...sections]), "standard");
    expect(Object.keys(b.sections).sort()).toEqual(["experience", "skills", "stats"]);
    expect(b.order).not.toContain("song");
  });
});

describe("the Standard design", () => {
  it("draws every supported section once, with a heading, and skips the rest", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS));
    const drawn = blocksIn(html);
    for (const kind of SUPPORTED_SECTIONS["pro-classic"]) expect(drawn.filter((b) => b === kind), kind).toHaveLength(1);
    for (const kind of ["interests", "song", "orgs"]) expect(drawn).not.toContain(kind);
    expect(html).toContain('data-design="standard"');
  });

  it("looks the same as the Starter design when there are no sections and no custom order", () => {
    const starter = blocksIn(render({ ...SAMPLE_PAGE_DATA }, { ...META, design: "starter" }));
    const standard = blocksIn(render({ ...SAMPLE_PAGE_DATA }, META));
    expect(standard).toEqual(starter);
  });

  it("draws only add-on sections and a font pair on the Starter design", () => {
    const data = withSections(STANDARD_PREVIEW_SECTIONS, { fontPair: "bold", sectionOrder: ["messages", "about"] });
    const html = render(data, { ...META, design: "starter" });
    // Starter draws only what a paid add-on unlocks (gallery, PDF), in the template's default order, never the free picks
    const kinds = blocksIn(html);
    expect(kinds).toContain("gallery");
    expect(kinds).toContain("resume");
    for (const k of ["services", "experience", "skills", "stats", "portfolio"]) expect(kinds).not.toContain(k);
    expect(kinds[0]).toBe("about");
    expect(html).not.toContain("data-font-pair");
    expect(html).toContain('data-design="starter"');
  });

  it("treats a page with no design set as Starter", () => {
    const noDesign: TemplateMeta = { ...META, design: undefined };
    expect(render(withSections(STANDARD_PREVIEW_SECTIONS), noDesign)).toContain('data-design="starter"');
  });

  it("applies a font pair that belongs to the template, and ignores one that does not", () => {
    expect(render(withSections([], { fontPair: "editorial" }))).toContain('data-font-pair="editorial"');
    expect(render(withSections([], { fontPair: "executive" }))).not.toContain("data-font-pair");
    expect(render(withSections([], {}))).not.toContain("data-font-pair");
  });

  it("follows the page order", () => {
    const html = render(withSections([{ kind: "skills", items: ["Figma"] }], { sectionOrder: ["skills", "messages", "about", "connect", "profiles"] }));
    expect(blocksIn(html)).toEqual(["skills", "messages", "about", "connect", "profiles"]);
  });
});

describe("sections", () => {
  it("draw their content and link out safely", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS));
    expect(html).toContain("8+ years"); // stats
    expect(html).toContain("Senior Product Designer"); // experience
    expect(html).toContain("User research"); // skills
    expect(html).toContain("from ₱15,000"); // services price
    expect(html).toContain("Northwind mobile app"); // portfolio
    expect(html).toContain('href="https://example.com/northwind"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('alt="Studio visit"'); // gallery
    expect(html).toContain('href="https://example.com/maria-santos-resume.pdf"'); // resume
  });

  it("hide what has no data: no price, no description, no thumbnail", () => {
    const html = render(
      withSections([
        { kind: "services", items: [{ name: "Logo" }] },
        { kind: "portfolio", items: [{ title: "Site", url: "https://example.com" }] },
      ]),
    );
    expect(html).not.toContain("pc-price");
    expect(html).not.toContain("pc-work-thumb");
    expect(html).not.toContain("pc-item-desc");
  });

  it("names the résumé from its label, else a default", () => {
    expect(render(withSections([{ kind: "resume", fileUrl: "https://example.com/cv.pdf", label: "My CV" }]))).toContain("My CV");
    expect(render(withSections([{ kind: "resume", fileUrl: "https://example.com/cv.pdf" }]))).toContain("Résumé / CV");
  });

  it("show the latest experience entry as current, and the stats in as many columns as there are (max 3)", () => {
    const html = render(withSections([{ kind: "experience", items: [{ role: "A", org: "x", years: "1" }, { role: "B", org: "y", years: "2" }] }, { kind: "stats", items: [{ label: "a", value: "1" }, { label: "b", value: "2" }] }]));
    expect(html.match(/is-current/g)).toHaveLength(1);
    expect(html).toContain("--cols:2");
    expect(render(withSections([{ kind: "stats", items: Array.from({ length: 5 }, (_, i) => ({ label: `l${i}`, value: `${i}` })) }]))).toContain("--cols:3");
  });

  it("copes with long text", () => {
    const long = "x".repeat(80);
    const html = render(withSections([{ kind: "skills", items: [long] }, { kind: "experience", items: [{ role: long, org: long, years: "2020" }] }]));
    expect(html).toContain(long);
  });
});

describe("the files", () => {
  const dir = __dirname;
  it("contain no colour values in the component files", () => {
    for (const file of ["index.tsx", "sections.tsx", "interactive.tsx", "model.ts"]) {
      const text = readFileSync(path.join(dir, file), "utf8");
      expect(text.match(/#[0-9a-fA-F]{3,8}\b/g), file).toBeNull();
    }
  });
});

describe("accent text (WCAG AA 4.5:1)", () => {
  // Mirrors the CSS: the accent itself when it reads on the page, else 35% accent mixed into the text colour.
  const THEMES = {
    light: { text: "#121417", surfaces: ["#f4f5f7", "#ffffff"] },
    dark: { text: "#f2f2f0", surfaces: ["#0c0d0f", "#17191c"] },
  } as const;

  const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const toHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  const mix = (a: string, b: string, amountOfA: number) => toHex(hex(a).map((v, i) => v * amountOfA + hex(b)[i] * (1 - amountOfA)));

  for (const theme of ["light", "dark"] as const) {
    it(`every preset colour is readable as small text on the ${theme} page`, () => {
      for (const preset of ACCENT_PRESETS) {
        const r = resolveAccent(preset.id);
        const weak = theme === "light" ? !r.textOnLight : !r.textOnDark;
        const color = weak ? mix(r.accent, THEMES[theme].text, 0.35) : r.accent;
        for (const surface of THEMES[theme].surfaces) {
          expect(contrastRatio(color, surface), `${preset.id} on ${surface} (${theme})`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});
