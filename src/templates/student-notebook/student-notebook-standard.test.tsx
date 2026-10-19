import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PageData, Section } from "@/lib/page-schema";
import { STANDARD_PREVIEW_SECTIONS } from "@/lib/preview";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { StudentNotebookTemplate } from "./index";
import { buildStandardModel } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
  design: "standard",
};

const STUDENT: PageData = {
  ...SAMPLE_PAGE_DATA,
  profile: {
    ...SAMPLE_PAGE_DATA.profile,
    location: "Cavite, PH",
    student: { school: "CvSU", program: "BSIT", year: "4th year", graduating: "May 2026", openTo: "Internships" },
  },
};

const render = (data: PageData, meta: TemplateMeta = META) =>
  renderToStaticMarkup(<StudentNotebookTemplate data={data} theme="light" meta={meta} />);

const withSections = (sections: Section[], style: Partial<PageData["style"]> = {}): PageData => ({
  ...STUDENT,
  sections,
  style: { ...STUDENT.style, ...style },
});

const blocksIn = (html: string) => [...html.matchAll(/data-block="([a-z]+)"/g)].map((m) => m[1]);

const PROJECTS: Section = { kind: "portfolio", items: [{ title: "Capstone", desc: "A thing", url: "https://example.com/1" }, { title: "Side project", url: "https://example.com/2" }] };
const SKILLS: Section = { kind: "skills", items: ["Python", "React", "SQL", "Figma"] };
const ORGS: Section = { kind: "orgs", items: [{ name: "Dean's lister", role: "CvSU" }, { name: "Design Society" }] };
const RESUME: Section = { kind: "resume", fileUrl: "https://example.com/cv.pdf" };

describe("Starter design with the PDF add-on", () => {
  it("gets the résumé button next to Save contact, and no other optional section", () => {
    const html = render(withSections([RESUME, SKILLS, PROJECTS]), { ...META, design: "starter" });
    expect(html).toContain("pn-resume");
    expect(html).toContain("https://example.com/cv.pdf");
    expect(blocksIn(html)).toEqual([]);
  });
});

describe("buildStandardModel", () => {
  it("lists projects, skills, then wins and orgs by default, whatever order they were added in", () => {
    expect(buildStandardModel(withSections([ORGS, SKILLS, PROJECTS])).order).toEqual(["portfolio", "skills", "orgs"]);
  });

  it("follows a saved order", () => {
    expect(buildStandardModel(withSections([PROJECTS, SKILLS, ORGS], { sectionOrder: ["orgs", "portfolio", "skills"] })).order).toEqual(["orgs", "portfolio", "skills"]);
  });

  it("takes the résumé out of the list: it is a button", () => {
    const m = buildStandardModel(withSections([RESUME, SKILLS]));
    expect(m.resume).toEqual({ url: "https://example.com/cv.pdf", label: "My résumé" });
    expect(m.order).toEqual(["skills"]);
    expect(buildStandardModel(withSections([SKILLS])).resume).toBeNull();
  });

  it("shows only the facts that exist", () => {
    expect(buildStandardModel(STUDENT).info.map((i) => i.label)).toEqual(["Studying", "Graduating", "Based in"]);
    const some = buildStandardModel({ ...STUDENT, profile: { ...STUDENT.profile, location: undefined, student: { program: "BSIT" } } });
    expect(some.info).toEqual([{ label: "Studying", value: "BSIT" }]);
    expect(buildStandardModel({ ...SAMPLE_PAGE_DATA, profile: { fullName: "A" } }).info).toEqual([]);
  });

  it("puts every link in 'Find me online', and a featured link that is not one of them first", () => {
    const m = buildStandardModel({
      ...STUDENT,
      featuredLink: { label: "My site", url: "https://me.example", icon: "website" },
      socials: [{ type: "github", handle: "me", url: "https://github.com/me" }],
    });
    expect(m.tiles.map((t) => [t.type, t.label])).toEqual([["website", "My site"], ["github", "GitHub"]]);
    const used = buildStandardModel({
      ...STUDENT,
      featuredLink: { label: "Connect", url: "https://github.com/me", icon: "github" },
      socials: [{ type: "github", handle: "me", url: "https://github.com/me" }],
    });
    expect(used.tiles).toHaveLength(1); // the featured link is already a tile
  });

  it("skips kinds without a design", () => {
    const m = buildStandardModel(withSections([{ kind: "song", spotifyUrl: "https://open.spotify.com/track/1" }, { kind: "stats", items: [{ label: "a", value: "1" }] }, SKILLS]));
    expect(m.order).toEqual(["skills"]);
  });
});

describe("the Standard design", () => {
  it("draws its own layout: facts, projects, skills, wins, and one 'Find me online' grid instead of the three link blocks", () => {
    const html = render(withSections([PROJECTS, SKILLS, ORGS, RESUME]));
    expect(blocksIn(html)).toEqual(["portfolio", "skills", "orgs", "online"]);
    expect(html).toContain("Find me online");
    expect(html).toContain("pn-info");
    expect(html).not.toContain("Profiles to view");
    expect(html).not.toContain("Ways to message");
    expect(html).not.toContain("pn-connect");
  });

  it("pairs Save contact with the résumé button only when there is a résumé", () => {
    expect(render(withSections([RESUME]))).toContain("pn-pair");
    expect(render(withSections([RESUME]))).toContain('href="https://example.com/cv.pdf"');
    const without = render(withSections([SKILLS]));
    expect(without).not.toContain("pn-pair");
    expect(without).not.toContain("pn-resume");
  });

  it("leaves the Starter design alone, whatever the page holds", () => {
    const html = render(withSections(STANDARD_PREVIEW_SECTIONS), { ...META, design: "starter" });
    expect(html).toContain("pn-connect");
    expect(html).toContain("Profiles to view");
    expect(blocksIn(html)).toEqual([]);
    expect(html).not.toContain("pn-info");
    expect(html).not.toContain("Find me online");
  });

  it("treats a page with no design set as Starter", () => {
    expect(render(withSections([SKILLS]), { ...META, design: undefined })).not.toContain("Find me online");
  });

  it("hides what has no data", () => {
    const html = render(withSections([PROJECTS, ORGS]));
    expect(html.split('data-block="portfolio"')[1].split('data-block="orgs"')[0]).not.toContain("pn-project-desc\">undefined");
    expect(html).not.toContain("undefined");
    const noLinks = render({ ...withSections([SKILLS]), socials: [], featuredLink: undefined, contact: { showPhoneNumbers: false } });
    expect(noLinks).not.toContain("Find me online");
  });

  it("only offers 'swipe' when there is more than one project", () => {
    expect(render(withSections([PROJECTS]))).toContain("swipe");
    expect(render(withSections([{ kind: "portfolio", items: [{ title: "One", url: "https://example.com" }] }]))).not.toContain("swipe");
  });

  it("draws the stickers with every third one in the highlighter colour", () => {
    const html = render(withSections([{ kind: "skills", items: ["a", "b", "c", "d"] }]));
    expect(html.match(/data-i="0"/g)).toHaveLength(2); // a and d
  });
});

describe("the files", () => {
  it("contain no colour values in the component files", () => {
    for (const file of ["index.tsx", "sections.tsx", "interactive.tsx", "model.ts"]) {
      expect(readFileSync(path.join(__dirname, file), "utf8").match(/#[0-9a-fA-F]{3,8}\b/g), file).toBeNull();
    }
  });
});
