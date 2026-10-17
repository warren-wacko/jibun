import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contrastRatio, resolveAccent } from "@/lib/accents";
import { parsePageData, type PageData } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { ProCompanyTemplate } from "./index";
import { BADGE_RING_TEXT, buildCompanyModel } from "./model";

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
    bio: "I design simple, useful products.",
    availability: "Calls & texts, Mon-Sat",
  },
  contact: { ...SAMPLE_PAGE_DATA.contact, officeAddress: "Tagaytay Road, Silang, Cavite" },
  style: { theme: "light", accent: "navy" },
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<ProCompanyTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "navy" },
  });

describe("badge ring", () => {
  it("is 46 characters, so each sits 360/46 degrees from the last", () => {
    expect(Array.from(BADGE_RING_TEXT)).toHaveLength(46);
  });
});

describe("buildCompanyModel", () => {
  it("builds the info strip from company, location and work mode, in that order", () => {
    const m = buildCompanyModel(FULL);
    expect(m.info.map((i) => [i.label, i.value])).toEqual([
      ["Company", "Northwind Studio"],
      ["Based in", "Cavite, PH"],
      ["Works", "Hybrid"],
    ]);
  });

  it("drops info items with no value", () => {
    const data: PageData = { ...FULL, profile: { fullName: "A", location: "Cebu" } };
    expect(buildCompanyModel(data).info).toEqual([{ label: "Based in", value: "Cebu" }]);
  });

  it("labels each work mode", () => {
    const mode = (workMode: "remote" | "onsite" | "hybrid") =>
      buildCompanyModel({ ...FULL, profile: { fullName: "A", workMode } }).info[0].value;
    expect(mode("remote")).toBe("Remote");
    expect(mode("onsite")).toBe("On-site");
    expect(mode("hybrid")).toBe("Hybrid");
  });

  it("numbers only the sections that are shown, after 00 for Get in touch", () => {
    const all = buildCompanyModel(FULL);
    expect(all.sections.map((s) => [s.key, s.num])).toEqual([
      ["about", "01"],
      ["connect", "02"],
      ["profiles", "03"],
      ["messages", "04"],
    ]);
    const noBio = buildCompanyModel({ ...FULL, profile: { ...FULL.profile, bio: undefined } });
    expect(noBio.sections.map((s) => [s.key, s.num])).toEqual([
      ["connect", "01"],
      ["profiles", "02"],
      ["messages", "03"],
    ]);
  });

  it("hides the phone panel, the SMS tile and the number when numbers are hidden", () => {
    const hidden: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: false } };
    const m = buildCompanyModel(hidden);
    expect(m.phone).toBeNull();
    expect(m.sms).toBeNull();
    expect(m.office).not.toBeNull();
    expect(m.email).toBe("maria@example.com");
    expect(m.hasTouch).toBe(true);
  });

  it("formats the number for display but links the stored one", () => {
    const m = buildCompanyModel(FULL);
    expect(m.phone).toMatchObject({ display: "+63 917 123 4567", tel: "tel:+639171234567", raw: "+639171234567" });
  });

  it("has nothing to show for an empty page", () => {
    const m = buildCompanyModel(minimal());
    expect(m.hasTouch).toBe(false);
    expect(m.sections).toEqual([]);
    expect(m.info).toEqual([]);
    expect(m.tileCount).toBe(0);
  });
});

describe("ProCompanyTemplate", () => {
  it("renders the sample page in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(FULL, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="pro-company"');
      expect(html).toContain("Maria Santos");
      expect(html).toContain("Save contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("passes the accent's brightness to CSS and uses it for the brand colours", () => {
    const html = render(FULL);
    expect(html).toMatch(/--accent-luma:0\.\d+/);
    expect(html).toContain("--accent:#0f2a4a");
  });

  it("shows the contact panels with the caption, email, SMS tile and office tile", () => {
    const html = render(FULL);
    expect(html).toContain("+63 917 123 4567");
    expect(html).toContain("Calls &amp; texts, Mon-Sat");
    expect(html).toContain('href="mailto:maria@example.com"');
    expect(html).toContain("Send an SMS");
    expect(html).toContain("Tagaytay Road, Silang, Cavite");
    expect(html).toContain("--cols:2");
  });

  it("puts the QR in a dialog sheet with an unmirrored, scannable source", () => {
    const html = render(FULL);
    expect(html).toContain("<dialog");
    expect(html).toContain("Scan to save my card");
    expect(html).toContain('src="/maria/qr"');
  });

  it("shows the company name in the logo slot, or the logo image when set", () => {
    expect(render(FULL)).toContain("Northwind Studio");
    const withLogo: PageData = {
      ...FULL,
      profile: { ...FULL.profile, logoUrl: "https://res.cloudinary.com/demo/logo.png" },
    };
    expect(render(withLogo)).toContain("Northwind Studio logo");
  });

  it("shows the person's initials in the arch when there is no photo", () => {
    const html = render(FULL);
    expect(html).toContain("pco-arch-empty");
    expect(html).toContain('class="pco-arch-initials"');
    const withPhoto: PageData = { ...FULL, profile: { ...FULL.profile, photoUrl: "https://res.cloudinary.com/demo/m.jpg" } };
    expect(render(withPhoto)).not.toContain("pco-arch-initials");
  });

  it("gives a light accent dark text on the phone panel, and lets a long email wrap", () => {
    const css = readFileSync(path.join(__dirname, "pro-company.css"), "utf8");
    expect(css).toMatch(/\[data-accent-tone="light"\] \.pco-phone\s*{[^}]*color: var\(--on-accent\)/);
    expect(css).not.toMatch(/\.pco-email-value\s*{[^}]*text-overflow:\s*ellipsis/);
    expect(render({ ...FULL, style: { theme: "light", accent: "#F5C518" } })).toContain('data-accent-tone="light"');
  });

  it("shows the photo only when there is one", () => {
    expect(render(FULL)).not.toContain("Photo of");
    const withPhoto: PageData = {
      ...FULL,
      profile: { ...FULL.profile, photoUrl: "https://res.cloudinary.com/demo/maria.jpg" },
    };
    expect(render(withPhoto)).toContain("Photo of Maria Santos");
  });

  it("hides every empty section and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["Get in touch", "About", "Let’s connect", "Follow me", "Message me", "mailto:", "tel:", "sms:", "Mobile"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).toContain("Save contact");
  });

  it("styles each network's tile by its type, with a generic look for networks without a gradient", () => {
    const html = render(FULL);
    expect(html).toContain('data-net="instagram"');
    expect(html).toContain('data-net="whatsapp"');
    const css = readFileSync(path.join(__dirname, "pro-company.css"), "utf8");
    for (const net of ["linkedin", "facebook", "instagram", "tiktok", "messenger", "whatsapp", "viber"]) {
      expect(css, net).toContain(`.pco-net[data-net="${net}"]`);
    }
    expect(css).toMatch(/--net-bg, linear-gradient/); // fallback for the rest
  });

  it("uses one to three columns for the profile tiles", () => {
    const mk = (n: number): PageData => ({
      ...FULL,
      featuredLink: undefined,
      socials: Array.from({ length: n }, (_, i) => ({ type: "github" as const, handle: `h${i}`, url: "https://github.com/x" })),
    });
    expect(render(mk(1))).toContain("--cols:1");
    expect(render(mk(2))).toContain("--cols:2");
    expect(render(mk(6))).toContain("--cols:3");
  });

  it("hides phone numbers everywhere", () => {
    const hidden: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: false } };
    const html = render(hidden);
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).not.toContain("+63 917");
    expect(html).not.toContain("+639171234567");
    expect(html).toContain(">Chat<");
  });

  it("removes the branding credit when branding is off", () => {
    expect(render(FULL, "light", { ...META, showBranding: false })).not.toContain("Digital card by");
    expect(render(FULL)).toContain("Digital card by");
  });

  it("copes with a 30-character name", () => {
    const long: PageData = { ...FULL, profile: { ...FULL.profile, fullName: "Maximiliano Bartholomew Santia" } };
    const html = render(long);
    expect(html).toContain("Maximiliano Bartholomew Santia");
    expect(html).toContain(">MS<");
  });
});

describe("accent brightness", () => {
  it("reports a simple brightness for the CSS brand maths", () => {
    expect(resolveAccent("navy").luma).toBeLessThan(0.45);
    expect(resolveAccent("#ffffff").luma).toBeGreaterThan(0.6);
    expect(resolveAccent("#808080").luma).toBeGreaterThan(0.45);
    expect(resolveAccent("#808080").luma).toBeLessThan(0.6);
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "pro-company.css"), "utf8");
  const tokens = (theme: "dark" | "light") => {
    const m = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*{([^}]*)}`));
    if (!m) throw new Error(`no ${theme} token block`);
    const vars: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[k] = v;
    return vars;
  };

  it.each(["dark", "light"] as const)("text tokens are readable on page and card surfaces (%s)", (theme) => {
    const t = tokens(theme);
    for (const token of ["text", "text-soft", "text-dim"]) {
      for (const bg of ["bg", "surface"]) {
        expect(contrastRatio(t[token], t[bg]), `${theme}: ${token} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
