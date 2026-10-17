import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/accents";
import { parsePageData, type PageData } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { StudentNotebookTemplate } from "./index";
import { buildNotebookModel, greetingName } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
};

const FULL: PageData = {
  ...SAMPLE_PAGE_DATA,
  profile: {
    ...SAMPLE_PAGE_DATA.profile,
    bio: "Final-year student looking for my first role.",
    availability: "From June 2027",
    student: {
      school: "Cavite State University",
      program: "BSIT",
      year: "3rd year",
      graduating: "2027",
      openTo: "Internships & entry-level roles",
    },
  },
  contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: true },
  style: { theme: "light", accent: "yellow" },
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<StudentNotebookTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "yellow" },
  });

describe("greetingName", () => {
  it("uses the nickname, else the first word of the name", () => {
    expect(greetingName({ fullName: "Maria Santos", displayName: "Mia" })).toBe("Mia");
    expect(greetingName({ fullName: "Maria Santos" })).toBe("Maria");
    expect(greetingName({ fullName: "Maria Santos", displayName: "  " })).toBe("Maria");
  });
});

describe("buildNotebookModel", () => {
  it("builds the program and school lines from the student fields", () => {
    const m = buildNotebookModel(FULL);
    expect(m.programLine).toBe("BSIT · 3rd year");
    expect(m.schoolLine).toBe("Cavite State University · Graduating 2027");
  });

  it("leaves out parts that are not set", () => {
    const data: PageData = { ...FULL, profile: { fullName: "A", student: { program: "BSCS" } } };
    const m = buildNotebookModel(data);
    expect(m.programLine).toBe("BSCS");
    expect(m.schoolLine).toBe("");
    expect(m.sticky).toBeNull();
  });

  it("shows the sticky note only with an 'open to' line, with the availability as its footnote", () => {
    expect(buildNotebookModel(FULL).sticky).toEqual({ openTo: "Internships & entry-level roles", note: "From June 2027" });
  });

  it("puts LinkedIn in the action row and keeps it out of the profile tiles", () => {
    const m = buildNotebookModel(FULL);
    expect(m.quick.map((a) => a.key)).toEqual(["call", "email", "text", "linkedin"]);
    expect(m.profiles.map((s) => s.type)).not.toContain("linkedin");
  });

  it("drops Call and Text when phone numbers are hidden (the student default)", () => {
    const hidden: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: false } };
    expect(buildNotebookModel(hidden).quick.map((a) => a.key)).toEqual(["email", "linkedin"]);
  });

  it("has nothing to show for an empty page", () => {
    const m = buildNotebookModel(minimal());
    expect(m.quick).toEqual([]);
    expect(m.featured).toBeNull();
    expect(m.email).toBeNull();
    expect(m.programLine).toBe("");
    expect(m.sticky).toBeNull();
  });
});

describe("StudentNotebookTemplate", () => {
  it("renders the sample page in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(FULL, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="student-notebook"');
      expect(html).toContain("Maria Santos");
      expect(html).toContain("Save contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("shows the polaroid greeting, the sticky note, the highlighted program line and the school line", () => {
    const html = render(FULL);
    expect(html).toContain("hi, I’m Maria!");
    expect(html).toContain("OPEN TO");
    expect(html).toContain("Internships &amp; entry-level roles");
    expect(html).toContain("From June 2027");
    expect(html).toContain("BSIT · 3rd year");
    expect(html).toContain("Cavite State University · Graduating 2027");
    expect(html).toContain("pn-mark");
  });

  it("has a flip polaroid with a QR image on the back", () => {
    const html = render(FULL);
    expect(html).toContain("scan to save me");
    expect(html).toContain('src="/maria/qr"');
    expect(html).toContain("QR code for Maria Santos");
    const css = readFileSync(path.join(__dirname, "student-notebook.css"), "utf8");
    expect(css).toMatch(/\.pn-back\s*{[^}]*rotateY\(180deg\)/);
    expect(css).toMatch(/backface-visibility:\s*hidden/);
  });

  it("shows the portrait only when there is one, else the initials", () => {
    const empty = render(FULL);
    expect(empty).not.toContain("Portrait of");
    expect(empty).toContain("pn-photo-initials");
    const withPhoto: PageData = { ...FULL, profile: { ...FULL.profile, photoUrl: "https://res.cloudinary.com/demo/m.jpg" } };
    const html = render(withPhoto);
    expect(html).toContain("Portrait of Maria Santos");
    expect(html).not.toContain("pn-photo-initials");
  });

  it("hides every empty section and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["OPEN TO", "About me", "Connect", "Profiles to view", "Ways to message", "mailto:", "tel:", "pn-mark", "pn-quick"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).toContain("Save contact");
  });

  it("hides phone numbers everywhere", () => {
    const hidden: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: false } };
    const html = render(hidden);
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).not.toContain("+639171234567");
    expect(html).toContain('href="mailto:maria@example.com"');
  });

  it("sizes the action row by how many actions there are", () => {
    expect(render(FULL)).toContain("--cols:4");
    const two: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: false } };
    expect(render(two)).toContain("--cols:2");
  });

  it("uses a light-text sticky note and a softer highlighter for a dark school-colour accent", () => {
    expect(render({ ...FULL, style: { theme: "light", accent: "school-maroon-gold" } })).toContain('data-accent-tone="dark"');
    expect(render(FULL)).toContain('data-accent-tone="light"');
    const css = readFileSync(path.join(__dirname, "student-notebook.css"), "utf8");
    expect(css).toMatch(/\[data-accent-tone="dark"\]\s*{[^}]*--sticky-ink:\s*#ffffff/);
    expect(css).toMatch(/\[data-accent-tone="dark"\]\s*{[^}]*--mark-opacity/);
  });

  it("removes the branding credit and brand label when branding is off", () => {
    const html = render(FULL, "light", { ...META, showBranding: false });
    expect(html).not.toContain("Digital card by");
    expect(html).not.toContain("[JIBUN]");
    expect(render(FULL)).toContain("[JIBUN]");
  });

  it("copes with a 30-character name and long program text", () => {
    const long: PageData = {
      ...FULL,
      profile: {
        ...FULL.profile,
        fullName: "Maximiliano Bartholomew Santia",
        student: { ...FULL.profile.student, program: "BS Information Technology Major in Networks" },
      },
    };
    const html = render(long);
    expect(html).toContain("Maximiliano Bartholomew Santia");
    expect(html).toContain("BS Information Technology Major in Networks");
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "student-notebook.css"), "utf8");
  const tokens = (theme: "dark" | "light") => {
    const m = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*{([^}]*)}`));
    if (!m) throw new Error(`no ${theme} token block`);
    const vars: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[k] = v;
    return vars;
  };

  it.each(["dark", "light"] as const)("text tokens are readable on the page, card and paper (%s)", (theme) => {
    const t = tokens(theme);
    for (const token of ["text", "text-muted", "text-soft", "text-dim"]) {
      for (const bg of ["bg", "surface", "paper"]) {
        expect(contrastRatio(t[token], t[bg]), `${theme}: ${token} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("sticky-note ink is readable on every pastel highlighter", () => {
    const presets = ["yellow", "mint", "pink", "sky", "orange", "lilac"];
    for (const id of presets) {
      // the sticky note is the accent mixed 35% toward white, so test the plain accent as the worst case
      const accent = { yellow: "#ffd43b", mint: "#7ce0a3", pink: "#ff8fb1", sky: "#7cc4ff", orange: "#ffa552", lilac: "#c8a6ff" }[id]!;
      expect(contrastRatio("#1e2228", accent), id).toBeGreaterThanOrEqual(4.5);
    }
  });
});
