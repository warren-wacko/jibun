import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/accents";
import { parsePageData, type PageData, type SocialLink, type SocialType } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { SocialBentoTemplate } from "./index";
import { buildBentoModel, contactLine, greetingName, layoutTiles, pickHero, rowSpans } from "./model";

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
    status: "surviving finals",
    student: { school: "Cavite State University", program: "BSCS", year: "3rd year" },
  },
  featuredLink: undefined,
  // social pages hide phone numbers by default
  contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false },
  socials: [
    link("instagram", "@maria"),
    link("tiktok", "@maria"),
    { ...link("messenger", "maria"), note: "say hi!" },
    link("facebook", "/maria"),
    link("discord", "maria"),
    link("spotify"),
    link("x"),
    link("youtube"),
  ],
  style: { theme: "light", accent: "butter" },
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<SocialBentoTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "butter" },
  });

describe("rowSpans", () => {
  it("always adds up to the 4 columns", () => {
    for (const k of [1, 2, 3, 4]) expect(rowSpans(k).reduce((a, b) => a + b, 0)).toBe(4);
    expect(rowSpans(3)).toEqual([2, 1, 1]);
  });
});

/** A set of tiles fills the grid with no gaps when every row of 4 columns is completely used. */
function cellsUsed(tiles: ReturnType<typeof layoutTiles>): number {
  return tiles.reduce((sum, t) => sum + t.colSpan * t.rowSpan, 0);
}

describe("layoutTiles", () => {
  it("matches the design: a big TikTok beside two wide tiles, then a pair, then a row of icons", () => {
    const tiles = layoutTiles(
      [link("tiktok"), link("facebook"), link("messenger"), link("discord"), link("spotify"), link("x"), link("pinterest"), link("youtube")],
      true,
    );
    expect(tiles.map((t) => [t.kind, t.colSpan, t.rowSpan])).toEqual([
      ["big", 2, 2],
      ["wide", 2, 1],
      ["wide", 2, 1],
      ["wide", 2, 1],
      ["status", 2, 1],
      ["icon", 1, 1],
      ["icon", 1, 1],
      ["icon", 1, 1],
      ["icon", 1, 1],
    ]);
    expect(cellsUsed(tiles) % 4).toBe(0);
  });

  it("makes the big tile full width when there is nothing to put beside it", () => {
    const tiles = layoutTiles([link("tiktok")], false);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toMatchObject({ kind: "big", colSpan: 4, rowSpan: 2 });
  });

  it("stretches a lone wide tile beside the big one over two rows", () => {
    const tiles = layoutTiles([link("tiktok"), link("facebook")], false);
    expect(tiles.map((t) => [t.kind, t.colSpan, t.rowSpan])).toEqual([
      ["big", 2, 2],
      ["wide", 2, 2],
    ]);
  });

  it("stretches an odd last wide tile across the row", () => {
    const withBig = layoutTiles([link("tiktok"), link("facebook"), link("messenger"), link("discord")], false);
    expect(withBig.at(-1)).toMatchObject({ kind: "wide", colSpan: 4 });
    const noBig = layoutTiles([link("facebook"), link("messenger"), link("discord")], false);
    expect(noBig.at(-1)).toMatchObject({ kind: "wide", colSpan: 4 });
  });

  it("uses the status tile to complete a pair", () => {
    const tiles = layoutTiles([link("facebook")], true);
    expect(tiles.map((t) => [t.kind, t.colSpan])).toEqual([
      ["wide", 2],
      ["status", 2],
    ]);
  });

  it("spreads one to three icon tiles across the full row", () => {
    expect(layoutTiles([link("spotify")], false).map((t) => t.colSpan)).toEqual([4]);
    expect(layoutTiles([link("spotify"), link("x")], false).map((t) => t.colSpan)).toEqual([2, 2]);
    expect(layoutTiles([link("spotify"), link("x"), link("youtube")], false).map((t) => t.colSpan)).toEqual([2, 1, 1]);
  });

  it("starts a second row of icons after four", () => {
    const tiles = layoutTiles([link("spotify"), link("x"), link("pinterest"), link("youtube"), link("spotify", "b")], false);
    expect(tiles.map((t) => t.colSpan)).toEqual([1, 1, 1, 1, 4]);
  });

  it("never leaves a gap, whatever the mix", () => {
    const types: SocialType[] = ["tiktok", "facebook", "messenger", "discord", "whatsapp", "linkedin", "spotify", "x", "pinterest", "youtube", "github"];
    // every subset of a representative set, with and without the status tile
    for (let mask = 0; mask < 1 << 8; mask++) {
      const picked = types.filter((_, i) => i < 8 && mask & (1 << i)).map((t) => link(t));
      for (const status of [false, true]) {
        const tiles = layoutTiles(picked, status);
        expect(cellsUsed(tiles) % 4, `${picked.map((p) => p.type)} status=${status}`).toBe(0);
        expect(tiles.length).toBe(picked.length + (status ? 1 : 0));
      }
    }
  });

  it("returns nothing for nothing", () => {
    expect(layoutTiles([], false)).toEqual([]);
  });
});

describe("pickHero", () => {
  it("uses the featured link, with the matching social's handle as its subtitle", () => {
    const data: PageData = { ...FULL, featuredLink: { label: "Follow me on TikTok", url: "https://example.com/tiktok", icon: "tiktok" } };
    const hero = pickHero(data)!;
    expect(hero).toMatchObject({ label: "Follow me on TikTok", sub: "@maria", type: "tiktok" });
    expect(hero.used?.type).toBe("tiktok");
  });

  it("falls back to Instagram, and to nothing without it", () => {
    expect(pickHero(FULL)).toMatchObject({ label: "Follow me on IG", sub: "@maria", type: "instagram" });
    expect(pickHero({ ...FULL, socials: [link("facebook")] })).toBeNull();
  });
});

describe("contactLine", () => {
  it("names up to two DM networks the person has", () => {
    expect(contactLine(["instagram", "messenger", "discord"])).toBe("DM me on IG or Messenger, that’s the fastest.");
    expect(contactLine(["whatsapp"])).toBe("DM me on WhatsApp, that’s the fastest.");
  });

  it("has a sensible line when there is no DM network", () => {
    expect(contactLine(["spotify"])).toBe("Tap save and I’m in your contacts.");
  });
});

describe("greetingName", () => {
  it("prefers the nickname", () => {
    expect(greetingName({ fullName: "Maria Santos", displayName: "Mia" })).toBe("Mia");
    expect(greetingName({ fullName: "Maria Santos" })).toBe("Maria");
  });
});

describe("buildBentoModel", () => {
  it("builds the year badge from the student fields, else nothing (the tile shows a tap icon)", () => {
    expect(buildBentoModel(FULL).badge).toEqual({ big: "3rd", small: "BSCS" });
    expect(buildBentoModel({ ...FULL, profile: { fullName: "Maria Santos" } }).badge).toBeNull();
  });

  it("shows the full name in the tagline slot when there is no bio and a shorter name is shown big", () => {
    expect(buildBentoModel({ ...FULL, profile: { fullName: "Maria Santos" } }).tagline).toBe("Maria Santos");
    expect(buildBentoModel({ ...FULL, profile: { fullName: "Maria" } }).tagline).toBeNull();
    expect(buildBentoModel(FULL).tagline).toBe("coffee, anime & last-minute requirements");
  });

  it("keeps the hero's network out of the tiles", () => {
    const m = buildBentoModel(FULL);
    expect(m.hero?.type).toBe("instagram");
    expect(m.tiles.map((t) => t.link?.type)).not.toContain("instagram");
  });
});

describe("SocialBentoTemplate", () => {
  it("renders the sample page in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(FULL, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="social-bento"');
      expect(html).toContain("hi, I’m Mia");
      expect(html).toContain("Save contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("shows the identity, hero, status and network tiles", () => {
    const html = render(FULL);
    expect(html).toContain("Cavite State University");
    expect(html).toContain("Follow me on IG");
    expect(html).toContain("CURRENTLY");
    expect(html).toContain("surviving finals");
    expect(html).toContain("say hi!"); // the Messenger note replaces its handle
    expect(html).toContain("DM me on IG or Messenger");
    expect(html).toContain('aria-label="Spotify"');
  });

  it("has a QR dialog sheet with the card's QR image", () => {
    const html = render(FULL);
    expect(html).toContain("<dialog");
    expect(html).toContain("Scan to add Mia");
    expect(html).toContain('src="/maria/qr"');
  });

  it("shows the photo only when there is one, else the initials on the accent", () => {
    const empty = render(FULL);
    expect(empty).toContain("pb-photo-empty");
    expect(empty).not.toContain("Photo of");
    const withPhoto: PageData = { ...FULL, profile: { ...FULL.profile, photoUrl: "https://res.cloudinary.com/demo/m.jpg" } };
    expect(render(withPhoto)).toContain("Photo of Maria Santos");
  });

  it("hides every empty tile and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["CURRENTLY", "Follow me on IG", "tel:", "sms:", "pb-hero", "pb-big", "pb-icon", "pb-wide"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).toContain("Save contact");
    expect(html).toContain("Tap save and I’m in your contacts.");
  });

  it("hides Call and Text unless numbers are shown (the social default is off)", () => {
    expect(render(FULL)).not.toContain("tel:");
    const shown: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: true, sms: true } };
    const html = render(shown);
    expect(html).toContain('href="tel:+639171234567"');
    expect(html).toContain('href="sms:+639171234567"');
  });

  it("says Chat instead of a number for WhatsApp when numbers are hidden", () => {
    const data: PageData = { ...FULL, socials: [link("whatsapp", "+639171234567")] };
    const html = render(data);
    expect(html).toContain(">Chat<");
    expect(html).not.toContain("+639171234567");
  });

  it("removes the branding credit and brand label when branding is off", () => {
    const html = render(FULL, "light", { ...META, showBranding: false });
    expect(html).not.toContain("Digital card by");
    expect(html).not.toContain("[JIBUN]");
    expect(render(FULL)).toContain("[JIBUN]");
  });

  it("copes with a 30-character name", () => {
    const long: PageData = {
      ...FULL,
      profile: { ...FULL.profile, displayName: undefined, fullName: "Maximiliano Bartholomew Santia" },
    };
    const html = render(long);
    expect(html).toContain("hi, I’m Maximiliano");
    expect(html).toContain("--chars:11");
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "social-bento.css"), "utf8");
  const tokens = (theme: "dark" | "light") => {
    const m = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*{([^}]*)}`));
    if (!m) throw new Error(`no ${theme} token block`);
    const vars: Record<string, string> = {};
    for (const [, k, v] of m[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) vars[k] = v;
    return vars;
  };

  it.each(["dark", "light"] as const)("text tokens are readable on the page and the tiles (%s)", (theme) => {
    const t = tokens(theme);
    for (const token of ["text", "text-soft", "text-muted"]) {
      for (const bg of ["bg", "surface"]) {
        expect(contrastRatio(t[token], t[bg]), `${theme}: ${token} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
