import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/accents";
import { parsePageData, type PageData, type SocialLink, type SocialType } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { SocialScrapbookTemplate } from "./index";
import { LETTER_STYLES, buildScrapbookModel, letterScale, toLetters, toRows } from "./model";
import { TORN_CLIP, tornPolygon } from "./torn";

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
    bio: "coffee, anime & last-minute requirements",
    student: { school: "Cavite State University", program: "BSCS", year: "3rd year" },
  },
  contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false },
  featuredLink: undefined,
  socials: [
    link("instagram", "@mia"),
    link("tiktok", "@mia"),
    { ...link("facebook", "/mia"), note: "mostly memes" },
    link("messenger", "mia"),
    link("discord", "mia"),
    link("spotify", "mia"),
    link("x", "@mia"),
  ],
  style: { theme: "light", accent: "tomato" },
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<SocialScrapbookTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "tomato" },
  });

describe("torn edge", () => {
  it("is the design's polygon: along the top, then a ragged bottom edge from right to left", () => {
    expect(TORN_CLIP.startsWith("polygon(0% 0%, 100% 0%, 100% ")).toBe(true);
    expect(TORN_CLIP.split(",").length).toBe(2 + 26); // two corners + a point every 4% from 100 to 0
  });

  it("is the same every time", () => {
    expect(tornPolygon()).toBe(TORN_CLIP);
    expect(tornPolygon(5)).not.toBe(TORN_CLIP);
  });
});

describe("toLetters / letterScale", () => {
  it("makes upper-case cutouts that cycle through the six looks", () => {
    const letters = toLetters("Warren");
    expect(letters.map((l) => ("ch" in l ? l.ch : " ")).join("")).toBe("WARREN");
    expect(letters.map((l) => ("style" in l ? l.style : -1))).toEqual([0, 1, 2, 3, 4, 5]);
    expect(("style" in toLetters("Warrenx")[6] ? (toLetters("Warrenx")[6] as { style: number }).style : -1)).toBe(6 % LETTER_STYLES);
  });

  it("turns spaces into a single gap and ignores edge spaces", () => {
    expect(toLetters("  Mary   Jane ").map((l) => ("ch" in l ? l.ch : "_")).join("")).toBe("MARY_JANE");
  });

  it("handles letters outside the basic alphabet", () => {
    expect(toLetters("Éloïse").map((l) => ("ch" in l ? l.ch : "_")).join("")).toBe("ÉLOÏSE");
  });

  it("keeps the letter S (a name must never lose letters)", () => {
    expect(toLetters("Susan Moss").map((l) => ("ch" in l ? l.ch : "_")).join("")).toBe("SUSAN_MOSS");
  });

  it("shrinks the letters as the name gets longer, down to a floor", () => {
    expect(letterScale(6)).toBe(1);
    expect(letterScale(7)).toBe(1);
    expect(letterScale(10)).toBeLessThan(1);
    expect(letterScale(11)).toBeLessThan(letterScale(10));
    expect(letterScale(30)).toBe(0.5);
    expect(letterScale(14)).toBe(0.5);
  });
});

const rowText = (rows: ReturnType<typeof toRows>) => rows.map((r) => r.map((l) => ("ch" in l ? l.ch : " ")).join(""));
const lettersIn = (rows: ReturnType<typeof toRows>) => rows.map((r) => r.filter((l) => "ch" in l).length);

describe("toRows", () => {
  it("keeps up to 14 letters on a single row", () => {
    expect(toRows(toLetters("Warren"))).toHaveLength(1);
    expect(toRows(toLetters("Maximiliano"))).toHaveLength(1);
    expect(toRows(toLetters("A".repeat(14)))).toHaveLength(1);
  });

  it("splits a long single word into equal rows with no stragglers", () => {
    const rows = toRows(toLetters("A".repeat(28)));
    expect(lettersIn(rows)).toEqual([10, 9, 9]);
    expect(Math.max(...lettersIn(rows)) - Math.min(...lettersIn(rows))).toBeLessThanOrEqual(1);
    expect(lettersIn(rows).reduce((a, b) => a + b, 0)).toBe(28);
  });

  it("breaks between words where it can", () => {
    const rows = rowText(toRows(toLetters("Maximiliano Bartholomew Santia")));
    expect(rows).toEqual(["MAXIMILIANO", "BARTHOLOMEW", "SANTIA"]);
  });

  it("never exceeds 13 letters on a row and never drops a letter", () => {
    for (const name of ["Maximiliano Bartholomew Santia", "Wolfeschlegelsteinhausenbergerdorff", "A B C D E F G H I J K L M N O P Q"]) {
      const letters = toLetters(name);
      const rows = toRows(letters);
      expect(Math.max(...lettersIn(rows)), name).toBeLessThanOrEqual(13);
      expect(lettersIn(rows).reduce((a, b) => a + b, 0), name).toBe(letters.filter((l) => "ch" in l).length);
    }
  });

  it("returns no rows for an empty name", () => {
    expect(toRows([])).toEqual([]);
  });
});

describe("buildScrapbookModel", () => {
  it("uses the nickname for the letters and builds the badge from the student fields", () => {
    const m = buildScrapbookModel(FULL);
    expect(m.name).toBe("Mia");
    expect(m.letters.filter((l) => "ch" in l)).toHaveLength(3);
    expect(m.badge).toBe("BSCS · 3RD YEAR");
    expect(m.school).toBe("Cavite State University");
  });

  it("makes the Instagram profile the ticket and keeps it out of the cards", () => {
    const m = buildScrapbookModel(FULL);
    expect(m.hero?.label).toBe("Follow me on IG");
    expect(m.cards.map((c) => c.link.type)).toEqual(["tiktok", "facebook", "messenger", "discord"]);
  });

  it("puts spotify, x, pinterest and youtube on the receipt", () => {
    expect(buildScrapbookModel(FULL).receipt.map((s) => s.type)).toEqual(["spotify", "x"]);
  });

  it("cycles four paper looks across the cards", () => {
    const m = buildScrapbookModel({ ...FULL, socials: [link("instagram"), ...Array.from({ length: 6 }, (_, i) => link("github", `g${i}`))] });
    expect(m.cards.map((c) => c.variant)).toEqual([0, 1, 2, 3, 0, 1]);
  });

  it("has nothing to show for an empty page", () => {
    const m = buildScrapbookModel(minimal());
    expect(m.hero).toBeNull();
    expect(m.cards).toEqual([]);
    expect(m.receipt).toEqual([]);
    expect(m.badge).toBeNull();
    expect(m.tagline).toBeNull();
  });
});

describe("SocialScrapbookTemplate", () => {
  it("renders the sample page in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(FULL, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="social-scrapbook"');
      expect(html).toContain("Save contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("shows the badge, the school note, the tagline and the ticket", () => {
    const html = render(FULL);
    expect(html).toContain("BSCS · 3RD YEAR");
    expect(html).toContain("Cavite State University");
    expect(html).toContain("coffee, anime &amp; last-minute requirements");
    expect(html).toContain("ADMIT ONE");
    expect(html).toContain("Follow me on IG");
  });

  it("builds the name from letter cutouts but keeps it readable by screen readers", () => {
    const html = render(FULL);
    expect(html).toContain('aria-label="Mia"');
    expect(html.match(/class="pk-letter pk-l\d"/g)).toHaveLength(3);
    expect(html).toContain('aria-hidden="true"');
  });

  it("shows a card's note in place of its handle", () => {
    expect(render(FULL)).toContain("mostly memes");
  });

  it("shows the receipt with a plural total, and a singular one for a single social", () => {
    expect(render(FULL)).toContain("2 socials");
    expect(render({ ...FULL, socials: [link("instagram"), link("spotify")] })).toContain("1 social<");
  });

  it("has a QR sheet with the card's QR image", () => {
    const html = render(FULL);
    expect(html).toContain("<dialog");
    expect(html).toContain("scan to add Mia");
    expect(html).toContain('src="/maria/qr"');
  });

  it("shows the photo only when there is one, else the initials", () => {
    const empty = render(FULL);
    expect(empty).not.toContain("Photo of");
    expect(empty).toContain("pk-photo-initials");
    const withPhoto: PageData = { ...FULL, profile: { ...FULL.profile, photoUrl: "https://res.cloudinary.com/demo/m.jpg" } };
    expect(render(withPhoto)).toContain("Photo of Maria Santos");
  });

  it("hides every empty piece and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["ADMIT ONE", "ALSO FIND ME ON", "pk-card", "pk-badge", "pk-school", "pk-tagline", "tel:"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).toContain("Save contact");
  });

  it("fits a 30-character name by shrinking and wrapping the letters", () => {
    const long: PageData = {
      ...FULL,
      profile: { ...FULL.profile, displayName: "Maximiliano Bartholomew Santia" },
    };
    const html = render(long);
    expect(html.match(/class="pk-letter pk-l\d"/g)).toHaveLength(28);
    expect(html.match(/class="pk-letter-row"/g)).toHaveLength(3); // MAXIMILIANO / BARTHOLOMEW / SANTIA
    expect(html).toContain("--ls:0.5");
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

  it("keeps white text readable on the ticket by using a darker tomato", () => {
    expect(render(FULL)).toContain("--accent:#d43e2b");
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "social-scrapbook.css"), "utf8");
  const tokens = (theme: "dark" | "light") => {
    const m = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*{([^}]*)}`));
    if (!m) throw new Error(`no ${theme} token block`);
    const vars: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[k] = v;
    return vars;
  };
  const fixed = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i").exec(css)?.[1] as string;

  it.each(["dark", "light"] as const)("page text and muted text are readable on the page background (%s)", (theme) => {
    const t = tokens(theme);
    for (const token of ["text", "text-muted"]) {
      expect(contrastRatio(t[token], t.bg), `${theme}: ${token}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("text on the paper pieces and the receipt is readable", () => {
    const ink = fixed("ink");
    expect(contrastRatio(ink, fixed("note-paper"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(fixed("ink-soft"), fixed("note-paper"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(fixed("receipt-muted"), fixed("receipt-paper"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(fixed("cream"), fixed("black"))).toBeGreaterThanOrEqual(4.5);
  });
});
