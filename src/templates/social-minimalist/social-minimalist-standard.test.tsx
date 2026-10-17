import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageData, Section } from "@/lib/page-schema";
import { STANDARD_PREVIEW_SECTIONS } from "@/lib/preview";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { SocialMinimalistTemplate } from "./index";
import { buildStandardModel, dumpLayout, interestLoop, orgPill } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
  design: "standard",
};

const render = (data: PageData, meta: TemplateMeta = META, theme: "light" | "dark" = "light") =>
  renderToStaticMarkup(<SocialMinimalistTemplate data={data} theme={theme} meta={meta} />);

const withSections = (sections: Section[], style: Partial<PageData["style"]> = {}): PageData => ({
  ...SAMPLE_PAGE_DATA,
  sections,
  style: { ...SAMPLE_PAGE_DATA.style, ...style },
});

const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-z]+)"/g)].map((m) => m[1]);

const INTERESTS: Section = { kind: "interests", items: ["coffee", "film", "chess"] };
const SONG: Section = { kind: "song", spotifyUrl: "https://open.spotify.com/track/x", title: "Golden Hour", artist: "JVKE" };
const GALLERY: Section = { kind: "gallery", images: [{ url: "/sample/gallery-1.svg", alt: "Trip" }, { url: "/sample/gallery-2.svg", alt: "Gig" }] };
const ORGS: Section = { kind: "orgs", items: [{ name: "Design Society", role: "President" }, { name: "Chess Club" }] };

describe("buildStandardModel", () => {
  it("lists interests, song, photos then orgs by default", () => {
    expect(buildStandardModel(withSections([ORGS, GALLERY, SONG, INTERESTS])).order).toEqual(["interests", "song", "gallery", "orgs"]);
  });

  it("ignores kinds the design has no block for", () => {
    const m = buildStandardModel(withSections([{ kind: "skills", items: ["a"] }, SONG]));
    expect(m.order).toEqual(["song"]);
  });
});

describe("helpers", () => {
  it("repeats the interests until the band is full, doubled for a seamless loop", () => {
    expect(interestLoop([])).toEqual([]);
    const items = interestLoop(["a", "b", "c"]);
    expect(items.length % 2).toBe(0);
    expect(items.length / 2).toBeGreaterThanOrEqual(10);
  });

  it("scatters photos and starts a new page below after five", () => {
    const d = dumpLayout(7);
    expect(d.cards[0]).toEqual({ x: 10, y: 18, rot: -5 });
    expect(d.cards[5].y).toBe(18 + 300);
    expect(dumpLayout(5).height).toBe(340);
    expect(dumpLayout(0).height).toBe(0);
  });

  it("pills show the role over the org, or the org alone", () => {
    expect(orgPill({ name: "Design Society", role: "President" })).toMatchObject({ main: "President", rest: "Design Society" });
    expect(orgPill({ name: "Chess Club" })).toMatchObject({ main: "Chess Club", rest: null });
  });
});

describe("SocialMinimalistTemplate (Standard)", () => {
  it("draws the four blocks in order, between the grid and the contact card", () => {
    const html = render(withSections([ORGS, GALLERY, SONG, INTERESTS]));
    expect(html).toContain('data-design="standard"');
    expect(blocksIn(html)).toEqual(["interests", "song", "gallery", "orgs"]);
    expect(html.indexOf("mn-extras")).toBeGreaterThan(html.indexOf("mn-photo"));
    expect(html.indexOf("mn-extras")).toBeLessThan(html.indexOf("mn-contact-wrap"));
  });

  it("follows the saved order", () => {
    const html = render(withSections([ORGS, GALLERY, SONG, INTERESTS], { sectionOrder: ["orgs", "song"] }));
    expect(blocksIn(html)[0]).toBe("orgs");
  });

  it("shows the song title and artist, or falls back to the link's host", () => {
    const html = render(withSections([SONG]));
    expect(html).toContain("Golden Hour");
    expect(html).toContain("JVKE");
    expect(html).toContain('href="https://open.spotify.com/track/x"');
    const bare = render(withSections([{ kind: "song", spotifyUrl: "https://open.spotify.com/track/x" }]));
    expect(bare).toContain("Listen on Spotify");
    expect(bare).toContain("open.spotify.com");
    expect(bare).not.toContain("PLAYING");
  });

  it("hides the second copy of the interests from screen readers", () => {
    const html = render(withSections([INTERESTS]));
    expect(html).toContain('aria-hidden="true"');
    expect((html.match(/>coffee</g) ?? []).length).toBeGreaterThan(1);
  });

  it("has no extra blocks in the Starter design, or when there is no data", () => {
    expect(render(withSections([INTERESTS, SONG]), { ...META, design: "starter" })).not.toContain("mn-extras");
    const html = render(withSections([]));
    expect(html).not.toContain("mn-extras");
    expect(html).not.toContain("Photo dump");
  });

  it("renders the full preview set in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(withSections(STANDARD_PREVIEW_SECTIONS), META, theme);
      expect(html).toContain("Photo dump");
      expect(html).toContain("Orgs &amp; clubs");
    }
  });

  it("keeps hex colours out of the component files", () => {
    for (const f of ["sections.tsx", "index.tsx"]) {
      expect(readFileSync(path.join(__dirname, f), "utf8"), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});
