import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BRAND_GLYPHS } from "@/components/brand-glyphs";
import { ICON_PATHS } from "@/components/icons";
import { contrastRatio } from "@/lib/accents";
import { parsePageData, type PageData } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { ProClassicTemplate } from "./index";
import { buildModel, displayUrl } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<ProClassicTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "pearl" },
  });

describe("displayUrl", () => {
  it("drops the scheme, www and trailing slash", () => {
    expect(displayUrl("https://www.linkedin.com/in/maria/")).toBe("linkedin.com/in/maria");
    expect(displayUrl("http://example.com")).toBe("example.com");
  });
});

describe("buildModel", () => {
  it("uses the featured link and keeps it out of the profile grid", () => {
    const data: PageData = {
      ...SAMPLE_PAGE_DATA,
      featuredLink: { label: "Follow me", url: "https://www.instagram.com/maria.designs", icon: "instagram" },
    };
    const m = buildModel(data);
    expect(m.featured).toMatchObject({ label: "Follow me", icon: "instagram" });
    expect(m.profiles.map((s) => s.type)).toEqual(["linkedin"]);
  });

  it("promotes a LinkedIn profile into CONNECT when there is no featured link", () => {
    const m = buildModel({ ...SAMPLE_PAGE_DATA, featuredLink: undefined });
    expect(m.featured).toMatchObject({ label: "Connect on LinkedIn", icon: "linkedin", sub: "linkedin.com/in/mariasantos" });
    expect(m.profiles.map((s) => s.type)).toEqual(["instagram"]);
  });

  it("has no CONNECT content when there is nothing to show", () => {
    const m = buildModel(minimal());
    expect(m.featured).toBeNull();
    expect(m.email).toBeNull();
    expect(m.actions).toEqual([]);
    expect(m.profiles).toEqual([]);
    expect(m.messaging).toEqual([]);
    expect(m.cardLabel).toBe("");
  });

  it("orders actions like the design: call, email, text, directions", () => {
    const data: PageData = {
      ...SAMPLE_PAGE_DATA,
      contact: { ...SAMPLE_PAGE_DATA.contact, officeAddress: "1 Main St" },
    };
    expect(buildModel(data).actions.map((a) => a.key)).toEqual(["call", "email", "text", "directions"]);
  });

  it("builds the card label from company and location", () => {
    expect(buildModel(SAMPLE_PAGE_DATA).cardLabel).toBe("Northwind Studio · Cavite, PH");
    const onlyLocation: PageData = { ...SAMPLE_PAGE_DATA, profile: { fullName: "A", location: "Cebu" } };
    expect(buildModel(onlyLocation).cardLabel).toBe("Cebu");
  });
});

describe("ProClassicTemplate", () => {
  it("renders the sample page in both themes with the accent tone and template scope", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(SAMPLE_PAGE_DATA, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="pro-classic"');
      expect(html).toContain("Maria Santos");
      expect(html).toContain("Save Contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("has a QR face that is pre-rotated and a front/back pair with backface hidden via CSS classes", () => {
    const html = render(SAMPLE_PAGE_DATA);
    expect(html).toContain("QR code for Maria Santos");
    expect(html).toContain('src="/maria/qr"');
    expect(html).toContain("pc-front");
    expect(html).toContain("pc-back");
    const css = readFileSync(path.join(__dirname, "pro-classic.css"), "utf8");
    expect(css).toMatch(/\.pc-back\s*{[^}]*rotateY\(180deg\)/);
    expect(css.match(/backface-visibility:\s*hidden/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it("tags a light accent as light so the face gets dark tints", () => {
    expect(render({ ...SAMPLE_PAGE_DATA, style: { theme: "light", accent: "pearl" } })).toContain('data-accent-tone="light"');
    expect(render({ ...SAMPLE_PAGE_DATA, style: { theme: "light", accent: "graphite" } })).toContain('data-accent-tone="dark"');
  });

  it("hides every empty section and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["About", "Connect", "Profiles to view", "Ways to message", "mailto:", "tel:", "Directions"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).not.toContain("pc-photo");
    expect(html).toContain("Save Contact");
  });

  it("shows the photo only when there is one", () => {
    const withPhoto: PageData = {
      ...SAMPLE_PAGE_DATA,
      profile: { ...SAMPLE_PAGE_DATA.profile, photoUrl: "https://res.cloudinary.com/demo/maria.jpg" },
    };
    const html = render(withPhoto);
    expect(html).toContain("pc-photo");
    expect(html).toContain("Portrait of Maria Santos");
  });

  it("hides phone numbers: no Call or Text, messaging says Chat, no number in the markup", () => {
    const hidden: PageData = { ...SAMPLE_PAGE_DATA, contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false } };
    const html = render(hidden);
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).not.toContain(">+639171234567<");
    expect(html).toContain(">Chat<");
  });

  it("removes the branding credit and header brand when branding is off", () => {
    const html = render(SAMPLE_PAGE_DATA, "light", { ...META, showBranding: false });
    expect(html).not.toContain("Digital card by");
    expect(html).not.toContain("[JIBUN]");
    expect(render(SAMPLE_PAGE_DATA)).toContain("[JIBUN]");
  });

  it("copes with a 30-character name and long handles", () => {
    const long: PageData = {
      ...SAMPLE_PAGE_DATA,
      profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "Maximiliano Bartholomew Santiag" },
      socials: [{ type: "instagram", handle: "a".repeat(60), url: "https://www.instagram.com/x" }],
    };
    const html = render(long);
    expect(html).toContain("Maximiliano Bartholomew Santiag");
    expect(html).toContain("a".repeat(60));
  });

  it("uses a grid with 1, 2 and 3 columns for 1, 2 and 3+ tiles", () => {
    const mk = (n: number): PageData => ({
      ...SAMPLE_PAGE_DATA,
      featuredLink: undefined,
      socials: Array.from({ length: n }, (_, i) => ({
        type: "github" as const,
        handle: `h${i}`,
        url: "https://github.com/x",
      })),
    });
    expect(render(mk(1))).toContain("--cols:1");
    expect(render(mk(2))).toContain("--cols:2");
    expect(render(mk(5))).toContain("--cols:3");
  });
});

describe("fidelity to the reference design", () => {
  const reference = readFileSync(
    path.join(process.cwd(), "design-reference/01-pro-classic/starter/index.html"),
    "utf8",
  );

  it("every UI icon path exists in one of the reference files", () => {
    const refRoot = path.join(process.cwd(), "design-reference");
    const all = readdirSync(refRoot)
      .map((dir) => path.join(refRoot, dir, "starter", "index.html"))
      .filter((file) => existsSync(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    for (const [name, d] of Object.entries(ICON_PATHS)) {
      // the link glyph is ours (used for networks without a brand glyph yet), not from a design
      if (name === "linkA" || name === "linkB") continue;
      expect(all, name).toContain(d.replace(/&/g, "&amp;"));
    }
  });

  it("every brand glyph path exists in one of the reference files", () => {
    const refRoot = path.join(process.cwd(), "design-reference");
    const all = readdirSync(refRoot)
      .map((dir) => path.join(refRoot, dir, "starter", "index.html"))
      .filter((file) => existsSync(file))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    for (const [name, g] of Object.entries(BRAND_GLYPHS)) {
      expect(all, name).toContain(g.d);
    }
  });

  it("token values match the reference palette", () => {
    const css = readFileSync(path.join(__dirname, "pro-classic.css"), "utf8");
    for (const hex of ["#0c0d0f", "#f2f2f0", "#9aa0a9", "#17191c", "#2b2f35", "#f4f5f7", "#121417", "#5c626b", "#e1e3e7"]) {
      expect(css.toLowerCase(), hex).toContain(hex);
      expect(reference.toLowerCase(), hex).toContain(hex);
    }
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "pro-classic.css"), "utf8");
  const block = (theme: "dark" | "light") => {
    const m = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*{([^}]*)}`));
    if (!m) throw new Error(`no ${theme} token block`);
    const vars: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[k] = v;
    return vars;
  };

  it.each(["dark", "light"] as const)("muted text tokens are readable on page and card surfaces (%s)", (theme) => {
    const t = block(theme);
    for (const token of ["text", "text-muted", "text-soft", "text-dim", "text-faint"]) {
      for (const bg of ["bg", "surface"]) {
        expect(contrastRatio(t[token], t[bg]), `${theme}: ${token} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
