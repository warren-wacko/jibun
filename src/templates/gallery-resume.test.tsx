import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildTemplateMeta } from "@/lib/page-meta";
import type { PageData, Section } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { renderTemplate } from "./registry";

/** Step 2 designs: the Notebook's gallery and the social templates' résumé, in both designs. */
const GALLERY: Section = {
  kind: "gallery",
  images: [
    { url: "https://example.com/a.jpg", alt: "First day" },
    { url: "https://example.com/b.jpg", alt: "Hack night" },
  ],
};
const RESUME: Section = { kind: "resume", fileUrl: "https://example.com/cv.pdf", label: "My CV" };
const withSections = (sections: Section[]): PageData => ({ ...SAMPLE_PAGE_DATA, sections });
const render = (key: string, data: PageData, design: "starter" | "standard") => {
  const meta = buildTemplateMeta({ username: "maria", tier: design === "standard" ? "STANDARD" : "STARTER", addOns: [] });
  return renderToStaticMarkup(renderTemplate(key, { data, theme: "light", meta }));
};
const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-zA-Z]+)"/g)].map((m) => m[1]);

describe("student-notebook: gallery", () => {
  it.each(["starter", "standard"] as const)("draws the photos with their alt text in the %s design", (design) => {
    const html = render("student-notebook", withSections([GALLERY]), design);
    expect(blocksIn(html)).toContain("gallery");
    expect(html).toContain('alt="First day"');
    expect(html).toContain('alt="Hack night"');
  });

  it("is a row on Standard and a grid on Starter", () => {
    expect(render("student-notebook", withSections([GALLERY]), "standard")).toContain("pn-photo-row");
    expect(render("student-notebook", withSections([GALLERY]), "starter")).toContain("pn-photo-grid");
  });

  it("is left out when the page has no gallery", () => {
    expect(blocksIn(render("student-notebook", withSections([]), "standard"))).not.toContain("gallery");
  });
});

describe.each(["social-bento", "social-scrapbook", "social-minimalist"])("%s: résumé", (key) => {
  it.each(["starter", "standard"] as const)("draws a download link with the label in the %s design", (design) => {
    const html = render(key, withSections([RESUME]), design);
    expect(blocksIn(html)).toContain("resume");
    expect(html).toContain('href="https://example.com/cv.pdf"');
    expect(html).toContain("My CV");
  });

  it("falls back to Résumé / CV without a label, and is left out without a résumé", () => {
    const html = render(key, withSections([{ kind: "resume", fileUrl: "https://example.com/cv.pdf" }]), "standard");
    expect(html).toContain("Résumé / CV");
    expect(blocksIn(render(key, withSections([]), "standard"))).not.toContain("resume");
  });
});
