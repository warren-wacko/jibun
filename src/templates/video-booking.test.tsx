import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildTemplateMeta } from "@/lib/page-meta";
import type { PageData, Section } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { registeredTemplateKeys, renderTemplate } from "./registry";
import { supportedSections } from "./supported-sections";

/** Video and booking are paid add-ons: every template must draw them in both designs. */
const VIDEO: Section = { kind: "video", url: "https://www.youtube.com/watch?v=abc123" };
const BOOKING: Section = { kind: "booking", url: "https://calendly.com/maria/intro" };
const withSections = (sections: Section[]): PageData => ({ ...SAMPLE_PAGE_DATA, sections });

const KEYS = registeredTemplateKeys().filter((k) => k !== "placeholder");
const render = (key: string, data: PageData, design: "starter" | "standard") => {
  const meta = buildTemplateMeta({ username: "maria", tier: design === "standard" ? "STANDARD" : "STARTER", addOns: [] });
  return renderToStaticMarkup(renderTemplate(key, { data, theme: "light", meta }));
};
const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-zA-Z]+)"/g)].map((m) => m[1]);

describe.each(KEYS)("%s: video and booking", (key) => {
  it("has a design for both", () => {
    expect(supportedSections(key)).toEqual(expect.arrayContaining(["video", "booking"]));
  });

  it.each(["starter", "standard"] as const)("draws both in the %s design, with the link and its host", (design) => {
    const html = render(key, withSections([VIDEO, BOOKING]), design);
    const blocks = blocksIn(html);
    expect(blocks).toContain("video");
    expect(blocks).toContain("booking");
    expect(html).toContain('href="https://www.youtube.com/watch?v=abc123"');
    expect(html).toContain('href="https://calendly.com/maria/intro"');
    expect(html).toContain("youtube.com/watch?v=abc123");
    expect(html).toContain("calendly.com/maria/intro");
  });

  it("draws neither when the page has neither", () => {
    for (const design of ["starter", "standard"] as const) {
      const blocks = blocksIn(render(key, withSections([]), design));
      expect(blocks).not.toContain("video");
      expect(blocks).not.toContain("booking");
    }
  });

  it("draws one without the other", () => {
    expect(blocksIn(render(key, withSections([VIDEO]), "standard"))).not.toContain("booking");
    expect(blocksIn(render(key, withSections([BOOKING]), "starter"))).not.toContain("video");
  });

  it("keeps hex colours out of the section markup", () => {
    const html = render(key, withSections([VIDEO, BOOKING]), "standard");
    const section = (kind: string) => html.slice(html.indexOf(`data-block="${kind}"`), html.indexOf(`data-block="${kind}"`) + 4000);
    expect(section("video")).not.toMatch(/style="[^"]*#[0-9a-fA-F]{3,6}/);
  });
});
