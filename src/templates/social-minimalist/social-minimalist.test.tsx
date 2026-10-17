import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/accents";
import { parsePageData, type PageData, type SocialLink, type SocialType } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { SocialMinimalistTemplate } from "./index";
import { buildMinimalModel, splitBio } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
};

const link = (type: SocialType, handle: string = type): SocialLink => ({ type, handle, url: `https://example.com/${type}` });

const FULL: PageData = {
  ...SAMPLE_PAGE_DATA,
  profile: {
    ...SAMPLE_PAGE_DATA.profile,
    displayName: "Mia",
    bio: "coffee, anime & last-minute requirements.",
    student: { school: "Cavite State University", program: "BSCS", year: "3rd year" },
  },
  contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false },
  featuredLink: undefined,
  socials: [
    link("instagram", "@mia"),
    link("tiktok", "@mia"),
    { ...link("facebook", "/mia"), note: "Say hi" },
    link("messenger", "mia"),
    link("discord", "mia"),
    link("spotify", "mia"),
    link("x", "@mia"),
  ],
  style: { theme: "light", accent: "cobalt" },
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<SocialMinimalistTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "cobalt" },
  });

describe("splitBio", () => {
  it("italicises the part before the first '&'", () => {
    expect(splitBio("coffee, anime & last-minute requirements.")).toEqual({
      lead: "coffee, anime",
      rest: " & last-minute requirements.",
    });
  });

  it("falls back to the first two words, and never loses a character", () => {
    const { lead, rest } = splitBio("Building small things for the web every day");
    expect(lead).toBe("Building small");
    expect(lead + rest).toBe("Building small things for the web every day");
  });

  it("leaves a very short bio as plain text", () => {
    expect(splitBio("Hello there")).toEqual({ lead: "", rest: "Hello there" });
  });
});

describe("buildMinimalModel", () => {
  it("uses the nickname and joins program and year", () => {
    const m = buildMinimalModel(FULL);
    expect(m.name).toBe("Mia");
    expect(m.program).toBe("BSCS · 3rd year");
    expect(m.school).toBe("Cavite State University");
  });

  it("makes Instagram the follow pill (spelled out) and keeps it out of the tiles", () => {
    const m = buildMinimalModel(FULL);
    expect(m.hero?.label).toBe("Follow me on Instagram");
    expect(m.cards.map((c) => c.type)).toEqual(["tiktok", "facebook", "messenger", "discord"]);
  });

  it("puts spotify, x, pinterest and youtube in 'Also on'", () => {
    expect(buildMinimalModel(FULL).icons.map((s) => s.type)).toEqual(["spotify", "x"]);
  });

  it("measures the longest word of the name for sizing", () => {
    expect(buildMinimalModel({ ...FULL, profile: { ...FULL.profile, displayName: "Ana Maximiliano" } }).nameChars).toBe(11);
  });

  it("has nothing to show for an empty page", () => {
    const m = buildMinimalModel(minimal());
    expect(m.hero).toBeNull();
    expect(m.cards).toEqual([]);
    expect(m.icons).toEqual([]);
    expect(m.program).toBeNull();
    expect(m.bio).toBeNull();
  });
});

describe("SocialMinimalistTemplate", () => {
  it("renders the sample page in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(FULL, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="social-minimalist"');
      expect(html).toContain("Save contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("shows the program line, the name, the tagline and the follow pill", () => {
    const html = render(FULL);
    expect(html).toContain("BSCS · 3rd year");
    expect(html).toContain("Cavite State University");
    expect(html).toContain("<em>coffee, anime</em> &amp; last-minute requirements.");
    expect(html).toContain("Follow me on Instagram");
    expect(html).toContain("@mia");
  });

  it("shows a tile's note in place of its handle", () => {
    expect(render(FULL)).toContain("Say hi");
  });

  it("has a QR sheet with the card's QR image", () => {
    const html = render(FULL);
    expect(html).toContain("<dialog");
    expect(html).toContain("<em>Mia</em>");
    expect(html).toContain('src="/maria/qr"');
  });

  it("shows the photo and the spinning badge only when there is a photo, else the initials", () => {
    const empty = render(FULL);
    expect(empty).not.toContain("Photo of");
    expect(empty).not.toContain("SAY HI");
    expect(empty).toContain("mn-photo-initials");
    const withPhoto: PageData = { ...FULL, profile: { ...FULL.profile, photoUrl: "https://res.cloudinary.com/demo/m.jpg" } };
    const html = render(withPhoto);
    expect(html).toContain("Photo of Maria Santos");
    expect(html).toContain("SAY HI");
  });

  it("hides every empty piece and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["mn-tile", "mn-follow", "mn-also", "mn-badge", "mn-line", "mn-tagline", "tel:"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).toContain("Save contact");
  });

  it("sizes a 30-character name from its longest word", () => {
    const long: PageData = { ...FULL, profile: { ...FULL.profile, displayName: "Maximiliano Bartholomew Santia" } };
    expect(render(long)).toContain("--n:11");
  });

  it("hides Call and Text unless numbers are shown", () => {
    expect(render(FULL)).not.toContain("tel:");
    const shown: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: true, sms: true } };
    const html = render(shown);
    expect(html).toContain('href="tel:+639171234567"');
    expect(html).toContain('href="sms:+639171234567"');
  });

  it("removes the branding credit and brand label when branding is off", () => {
    const html = render(FULL, "light", { ...META, showBranding: false });
    expect(html).not.toContain("Digital card by");
    expect(html).not.toContain("[JIBUN]");
    expect(render(FULL)).toContain("[JIBUN]");
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "social-minimalist.css"), "utf8");
  const tokens = (theme: "dark" | "light") => {
    const m = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*{([^}]*)}`));
    if (!m) throw new Error(`no ${theme} token block`);
    const vars: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[k] = v;
    return vars;
  };

  it.each(["dark", "light"] as const)("text and muted text are readable on the page and on the tiles (%s)", (theme) => {
    const t = tokens(theme);
    for (const bg of ["bg", "surface", "card-bg"]) {
      for (const token of ["text", "text-muted"]) {
        expect(contrastRatio(t[token], t[bg]), `${theme}: ${token} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
