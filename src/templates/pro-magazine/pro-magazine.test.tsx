import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/accents";
import { parsePageData, type PageData } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { ProMagazineTemplate } from "./index";
import { buildMagazineModel, headlineEm, splitName, splitTitle } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<ProMagazineTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "#D7261E" },
  });

describe("splitName", () => {
  it("puts the first word on top and keeps everything else", () => {
    expect(splitName("Warren Jacob Abdon")).toEqual(["Warren", "Jacob Abdon"]);
    expect(splitName("Juan Dela Cruz")).toEqual(["Juan", "Dela Cruz"]);
    expect(splitName("Maria Santos")).toEqual(["Maria", "Santos"]);
  });

  it("handles a single word and stray spaces", () => {
    expect(splitName("Cher")).toEqual(["Cher", ""]);
    expect(splitName("  Maria   Santos ")).toEqual(["Maria", "Santos"]);
  });
});

describe("splitTitle", () => {
  it("splits on the first separator into two parts", () => {
    expect(splitTitle("Software Engineer · Full-Stack Developer")).toEqual(["Software Engineer", "Full-Stack Developer"]);
    expect(splitTitle("Designer | Illustrator")).toEqual(["Designer", "Illustrator"]);
    expect(splitTitle("A / B / C")).toEqual(["A", "B · C"]);
  });

  it("keeps a plain title whole and returns nothing for none", () => {
    expect(splitTitle("Product Designer")).toEqual(["Product Designer"]);
    expect(splitTitle("Full-Stack Developer")).toEqual(["Full-Stack Developer"]);
    expect(splitTitle(undefined)).toEqual([]);
  });
});

describe("buildMagazineModel", () => {
  it("builds the contact rows in design order with readable subtitles", () => {
    const data: PageData = { ...SAMPLE_PAGE_DATA, contact: { ...SAMPLE_PAGE_DATA.contact, officeAddress: "1 Main St, Cavite" } };
    const rows = buildMagazineModel(data).rows;
    expect(rows.map((r) => r.key)).toEqual(["call", "text", "email", "directions"]);
    expect(rows[0]).toMatchObject({ title: "Call me", sub: "+63 917 123 4567" });
    expect(rows[2].sub).toBe("maria@example.com");
    expect(rows[3].sub).toBe("1 Main St, Cavite");
  });

  it("drops the phone rows (and the number) when numbers are hidden", () => {
    const data: PageData = { ...SAMPLE_PAGE_DATA, contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false } };
    const m = buildMagazineModel(data);
    expect(m.rows.map((r) => r.key)).toEqual(["email"]);
    expect(JSON.stringify(m.rows)).not.toContain("639171234567");
  });

  it("sizes the headline from the widest line, using real letter widths", () => {
    const short = buildMagazineModel(SAMPLE_PAGE_DATA).nameEm;
    const long: PageData = { ...SAMPLE_PAGE_DATA, profile: { fullName: "Maximiliano Bartholomew Santia" } };
    expect(buildMagazineModel(long).nameEm).toBeGreaterThan(short);
    // a line of narrow letters is much narrower than the same number of wide ones
    expect(headlineEm("IIIIII")).toBeLessThan(headlineEm("WWWWWW") / 2);
  });

  it("measures case-insensitively, spaces included, and caps unknown letters as wide", () => {
    expect(headlineEm("warren")).toBe(headlineEm("WARREN"));
    expect(headlineEm("A B")).toBeGreaterThan(headlineEm("AB"));
    expect(headlineEm("日本")).toBeGreaterThan(headlineEm("II"));
  });

  it("keeps the featured link out of the profile list", () => {
    const m = buildMagazineModel(SAMPLE_PAGE_DATA);
    expect(m.featured?.url).toBe("https://example.com/maria");
    expect(m.profiles.map((s) => s.type)).toEqual(["linkedin", "instagram"]);
  });
});

describe("ProMagazineTemplate", () => {
  it("renders the sample page in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(SAMPLE_PAGE_DATA, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="pro-magazine"');
      expect(html).toContain("COVER STORY");
      expect(html).toContain("Save Contact");
      expect(html).toContain('href="/maria/vcard"');
      expect(html).toContain('href="tel:+639171234567"');
    }
  });

  it("splits the headline into lines and exposes the size variable", () => {
    const html = render(SAMPLE_PAGE_DATA);
    expect(html).toContain("<span>Maria</span><span>Santos</span>");
    expect(html).toMatch(/--em:3\.\d+/);
  });

  it("has a QR dialog with an unmirrored, scannable image source", () => {
    const html = render(SAMPLE_PAGE_DATA);
    expect(html).toContain("<dialog");
    expect(html).toContain("QR code for Maria Santos");
    expect(html).toContain('src="/maria/qr"');
  });

  it("shows the cover photo only when there is one", () => {
    expect(render(SAMPLE_PAGE_DATA)).not.toContain("Portrait of");
    const withPhoto: PageData = {
      ...SAMPLE_PAGE_DATA,
      profile: { ...SAMPLE_PAGE_DATA.profile, photoUrl: "https://res.cloudinary.com/demo/maria.jpg" },
    };
    expect(render(withPhoto)).toContain("Portrait of Maria Santos");
  });

  it("hides every empty section and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["In brief", "Get in touch", "Connect", "Profiles to view", "Ways to message", "mailto:", "tel:", "Directions"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).toContain("Save Contact");
    expect(html).toContain("COVER STORY");
  });

  it("uses one column when only one link group has links", () => {
    const onlyMessaging: PageData = {
      ...SAMPLE_PAGE_DATA,
      featuredLink: undefined,
      socials: [{ type: "messenger", handle: "m", url: "https://m.me/m" }],
    };
    const html = render(onlyMessaging);
    expect(html).toContain("--cols:1");
    expect(html).toContain("Ways to message");
    expect(html).not.toContain("Profiles to view");
  });

  it("hides phone numbers everywhere in the markup", () => {
    const hidden: PageData = { ...SAMPLE_PAGE_DATA, contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false } };
    const html = render(hidden);
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).not.toContain("+63 917");
    expect(html).not.toContain("+639171234567");
  });

  it("removes the branding credit and brand label when branding is off", () => {
    const html = render(SAMPLE_PAGE_DATA, "light", { ...META, showBranding: false });
    expect(html).not.toContain("Digital card by");
    expect(html).not.toContain("[JIBUN]");
    expect(render(SAMPLE_PAGE_DATA)).toContain("[JIBUN]");
  });

  it("flags an accent that is too faint to read as text", () => {
    expect(render({ ...SAMPLE_PAGE_DATA, style: { theme: "light", accent: "pearl" } })).toContain('data-weak-on-light="true"');
    expect(render({ ...SAMPLE_PAGE_DATA, style: { theme: "dark", accent: "graphite" } })).toContain('data-weak-on-dark="true"');
    const red = render({ ...SAMPLE_PAGE_DATA, style: { theme: "light", accent: "#D7261E" } });
    expect(red).not.toContain("data-weak-on-light");
    expect(red).not.toContain("data-weak-on-dark");
  });

  it("copes with a 30-character name and a long email", () => {
    const long: PageData = {
      ...SAMPLE_PAGE_DATA,
      profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "Maximiliano Bartholomew Santia" },
      contact: { ...SAMPLE_PAGE_DATA.contact, email: `${"a".repeat(50)}@example.com` },
    };
    const html = render(long);
    expect(html).toContain("Maximiliano");
    expect(html).toContain("Bartholomew Santia");
    expect(html).toContain("a".repeat(50));
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "pro-magazine.css"), "utf8");
  const tokens = (theme: "dark" | "light") => {
    const m = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*{([^}]*)}`));
    if (!m) throw new Error(`no ${theme} token block`);
    const vars: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[k] = v;
    return vars;
  };

  it.each(["dark", "light"] as const)("text tokens are readable on page and card surfaces (%s)", (theme) => {
    const t = tokens(theme);
    for (const token of ["text", "text-muted", "text-soft", "text-dim", "text-faint"]) {
      for (const bg of ["bg", "surface"]) {
        expect(contrastRatio(t[token], t[bg]), `${theme}: ${token} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("white cover text stays readable on the no-photo cover colour", () => {
    const empty = /--cover-empty:\s*(#[0-9a-f]{6})/i.exec(css)?.[1];
    expect(contrastRatio("#ffffff", empty!)).toBeGreaterThanOrEqual(4.5);
  });
});
