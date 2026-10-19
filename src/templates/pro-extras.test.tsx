import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildTemplateMeta } from "@/lib/page-meta";
import type { PageData, Section } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { renderTemplate } from "./registry";
import { orgInitials, songView } from "./shared/model";

/** Step 3, pro templates: interests, organizations and a favorite song (Standard only; they are free "pick 2" sections). */
const INTERESTS: Section = { kind: "interests", items: ["coffee", "film photography"] };
const ORGS: Section = { kind: "orgs", items: [{ name: "Junior Marketing Society", role: "President" }, { name: "Ateneo Debate Club" }] };
const SONG: Section = { kind: "song", spotifyUrl: "https://open.spotify.com/track/abc", title: "Golden Hour", artist: "JVKE" };
const withSections = (sections: Section[]): PageData => ({ ...SAMPLE_PAGE_DATA, sections });
const render = (key: string, data: PageData, design: "starter" | "standard" = "standard") => {
  const meta = buildTemplateMeta({ username: "maria", tier: design === "standard" ? "STANDARD" : "STARTER", addOns: [] });
  return renderToStaticMarkup(renderTemplate(key, { data, theme: "light", meta }));
};
const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-zA-Z]+)"/g)].map((m) => m[1]);

describe("shared helpers", () => {
  it("makes org initials from the first two significant words", () => {
    expect(orgInitials("Junior Marketing Society")).toBe("JM");
    expect(orgInitials("Ateneo de Manila")).toBe("AM");
    expect(orgInitials("The Debate Club")).toBe("DC");
    expect(orgInitials("")).toBe("·");
  });

  it("falls back to Listen on Spotify and the host", () => {
    expect(songView({ spotifyUrl: "https://open.spotify.com/track/x" })).toMatchObject({ heading: "Listen on Spotify", artist: null, host: "open.spotify.com" });
    expect(songView({ spotifyUrl: "https://open.spotify.com/x", title: "A", artist: "B" }).aria).toBe("A by B, opens Spotify");
  });
});

describe.each(["pro-classic", "pro-magazine", "pro-signature", "pro-company"])("%s: interests, orgs and song", (key) => {
  it("draws all three on Standard", () => {
    const html = render(key, withSections([INTERESTS, ORGS, SONG]));
    expect(blocksIn(html)).toEqual(expect.arrayContaining(["interests", "orgs", "song"]));
    expect(html).toContain("film photography");
    expect(html).toContain("Junior Marketing Society");
    expect(html).toContain("President");
    expect(html).toContain('href="https://open.spotify.com/track/abc"');
    expect(html).toContain("Golden Hour");
    expect(html).toContain("JVKE");
  });

  it("leaves out the role line when there is no role, and shows the host when there is no artist", () => {
    const html = render(key, withSections([{ kind: "orgs", items: [{ name: "Ateneo Debate Club" }] }, { kind: "song", spotifyUrl: "https://open.spotify.com/track/abc" }]));
    expect(html).not.toContain("President");
    expect(html).toMatch(/Listen on Spotify|Hear my song/);
    expect(html).toContain("open.spotify.com");
  });

  it("draws none on Starter (they are free sections, Standard only)", () => {
    const blocks = blocksIn(render(key, withSections([INTERESTS, ORGS, SONG]), "starter"));
    for (const k of ["interests", "orgs", "song"]) expect(blocks).not.toContain(k);
  });

  it("draws none when the page has none", () => {
    const blocks = blocksIn(render(key, withSections([])));
    for (const k of ["interests", "orgs", "song"]) expect(blocks).not.toContain(k);
  });
});

describe("student-notebook: stats, services, experience, interests and song", () => {
  const key = "student-notebook";
  const STATS: Section = { kind: "stats", items: [{ label: "GPA", value: "3.9" }] };
  const SERVICES: Section = { kind: "services", items: [{ name: "Tutoring", price: "PHP 300/hr" }, { name: "Notes" }] };
  const EXPERIENCE: Section = { kind: "experience", items: [{ role: "Intern", org: "Acme", years: "2025" }] };

  it("draws all five on Standard", () => {
    const html = render(key, withSections([STATS, SERVICES, EXPERIENCE, INTERESTS, SONG]));
    expect(blocksIn(html)).toEqual(expect.arrayContaining(["stats", "services", "experience", "interests", "song"]));
    for (const text of ["GPA", "3.9", "Tutoring", "PHP 300/hr", "Intern", "Acme", "film photography", "Golden Hour", "JVKE"]) expect(html).toContain(text);
    expect(html).toContain('href="https://open.spotify.com/track/abc"');
  });

  it("leaves out the price when there is none, and draws none on Starter", () => {
    const html = render(key, withSections([{ kind: "services", items: [{ name: "Notes" }] }]));
    expect(html).not.toContain("pn-service-price");
    const blocks = blocksIn(render(key, withSections([STATS, SERVICES, EXPERIENCE, INTERESTS, SONG]), "starter"));
    for (const k of ["stats", "services", "experience", "interests", "song"]) expect(blocks).not.toContain(k);
  });
});

describe.each(["social-bento", "social-scrapbook", "social-minimalist"])("%s: stats, skills, portfolio, services and experience", (key) => {
  const STATS: Section = { kind: "stats", items: [{ label: "Followers", value: "12k" }, { label: "Posts", value: "300" }] };
  const SKILLS: Section = { kind: "skills", items: ["Figma", "Video editing"] };
  const PORTFOLIO: Section = { kind: "portfolio", items: [{ title: "Zine", url: "https://example.com/zine", desc: "A small zine" }] };
  const SERVICES: Section = { kind: "services", items: [{ name: "Logo design", price: "PHP 1,500" }, { name: "Posters" }] };
  const EXPERIENCE: Section = { kind: "experience", items: [{ role: "Editor", org: "The Paper", years: "2024" }] };
  const ALL = [STATS, SKILLS, PORTFOLIO, SERVICES, EXPERIENCE];

  it("draws all five on Standard", () => {
    const html = render(key, withSections(ALL));
    expect(blocksIn(html)).toEqual(expect.arrayContaining(["stats", "skills", "portfolio", "services", "experience"]));
    for (const text of ["Followers", "12k", "Video editing", "Zine", "A small zine", "PHP 1,500", "Posters", "Editor", "The Paper"]) expect(html).toContain(text);
    expect(html).toContain('href="https://example.com/zine"');
  });

  it("draws none on Starter, and none when the page has none", () => {
    for (const k of ["stats", "skills", "portfolio", "services", "experience"]) {
      expect(blocksIn(render(key, withSections(ALL), "starter"))).not.toContain(k);
      expect(blocksIn(render(key, withSections([])))).not.toContain(k);
    }
  });
});
