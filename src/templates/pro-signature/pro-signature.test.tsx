import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/accents";
import { parsePageData, type PageData } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import type { TemplateMeta } from "../types";
import { ProSignatureTemplate } from "./index";
import { buildSignatureModel, initials, signatureText } from "./model";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
};

const FULL: PageData = {
  ...SAMPLE_PAGE_DATA,
  profile: { ...SAMPLE_PAGE_DATA.profile, bio: "I design simple, useful products." },
};

const render = (data: PageData, theme: "light" | "dark" = "light", meta = META) =>
  renderToStaticMarkup(<ProSignatureTemplate data={data} theme={theme} meta={meta} />);

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "#14161A" },
  });

describe("initials", () => {
  it("uses the first letter of the first and last word", () => {
    expect(initials("Warren Jacob Abdon")).toBe("WA");
    expect(initials("maria santos")).toBe("MS");
    expect(initials("Cher")).toBe("C");
    expect(initials("  ")).toBe("");
  });

  it("handles letters outside the basic alphabet", () => {
    expect(initials("Éloïse Çelik")).toBe("ÉÇ");
  });
});

describe("signatureText", () => {
  it("prefers the signature field and falls back to the first name", () => {
    expect(signatureText({ fullName: "Maria Santos", signature: "Maria S." })).toBe("Maria S.");
    expect(signatureText({ fullName: "Maria Santos" })).toBe("Maria");
    expect(signatureText({ fullName: "Maria Santos", signature: "  " })).toBe("Maria");
  });
});

describe("buildSignatureModel", () => {
  it("orders the actions like the design and builds the card footer label", () => {
    const m = buildSignatureModel(SAMPLE_PAGE_DATA);
    expect(m.actions.map((a) => a.key)).toEqual(["call", "email", "text"]);
    expect(m.cardLabel).toBe("Northwind Studio · Cavite, PH");
    expect(m.initials).toBe("MS");
  });

  it("is empty when there is nothing to show", () => {
    const m = buildSignatureModel(minimal());
    expect(m.actions).toEqual([]);
    expect(m.featured).toBeNull();
    expect(m.email).toBeNull();
    expect(m.profiles).toEqual([]);
    expect(m.messaging).toEqual([]);
    expect(m.cardLabel).toBe("");
  });
});

describe("ProSignatureTemplate", () => {
  it("renders the sample page in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render(FULL, theme);
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain('data-template="pro-signature"');
      expect(html).toContain("Maria Santos");
      expect(html).toContain("Save Contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("shows the watermark initials, the quote and the handwritten signature", () => {
    const html = render({ ...FULL, profile: { ...FULL.profile, signature: "Maria S." } });
    expect(html).toContain("ps-watermark");
    expect(html).toContain("“I design simple, useful products.”");
    expect(html).toContain("Maria S.");
  });

  it("signs with the first name when no signature is set", () => {
    expect(render(FULL)).toMatch(/ps-signature">Maria</);
  });

  it("has a front and a back with the QR image, and two page dots", () => {
    const html = render(FULL);
    expect(html).toContain("SCAN TO SAVE");
    expect(html).toContain('src="/maria/qr"');
    expect(html).toContain("QR code for Maria Santos");
    expect(html.match(/class="ps-dot(?: is-active)?"/g)).toHaveLength(2);
    const css = readFileSync(path.join(__dirname, "pro-signature.css"), "utf8");
    expect(css).toMatch(/\.ps-back\s*{[^}]*rotateY\(180deg\)/);
    expect(css.match(/backface-visibility:\s*hidden/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it("shows the portrait only when there is one", () => {
    expect(render(FULL)).not.toContain("Portrait of");
    const withPhoto: PageData = {
      ...FULL,
      profile: { ...FULL.profile, photoUrl: "https://res.cloudinary.com/demo/maria.jpg" },
    };
    expect(render(withPhoto)).toContain("Portrait of Maria Santos");
  });

  it("hides every empty section and never shows empty links", () => {
    const html = render(minimal());
    for (const text of ["About", "Connect", "Profiles to view", "Ways to message", "mailto:", "tel:", "Directions", "ps-signature"]) {
      expect(html, text).not.toContain(text);
    }
    expect(html).toContain("Save Contact");
  });

  it("uses 1 to 4 equal columns for the action bar", () => {
    expect(render(FULL)).toContain("--cols:3");
    const two: PageData = { ...FULL, contact: { showPhoneNumbers: true, email: "a@b.co" } };
    expect(render(two)).toContain("--cols:1");
  });

  it("stretches a short last row when there are five actions", () => {
    const five: PageData = {
      ...FULL,
      contact: { ...FULL.contact, officeAddress: "1 Main St" },
      sections: [{ kind: "booking", url: "https://cal.example.com/maria" }],
    };
    const html = render(five);
    expect(html).toContain("--cols:4");
    expect(html).toContain("grid-column:span 4");
  });

  it("hides phone numbers: no Call or Text, messaging says Chat", () => {
    const hidden: PageData = { ...FULL, contact: { ...FULL.contact, showPhoneNumbers: false } };
    const html = render(hidden);
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).not.toContain(">+639171234567<");
    expect(html).toContain(">Chat<");
  });

  it("removes the branding credit and brand label when branding is off", () => {
    const html = render(FULL, "light", { ...META, showBranding: false });
    expect(html).not.toContain("Digital card by");
    expect(html).not.toContain("[JIBUN]");
    expect(render(FULL)).toContain("[JIBUN]");
  });

  it("tags a light card so photo and dot tints flip", () => {
    expect(render({ ...FULL, style: { theme: "light", accent: "pearl" } })).toContain('data-accent-tone="light"');
    expect(render({ ...FULL, style: { theme: "light", accent: "#14161A" } })).toContain('data-accent-tone="dark"');
  });

  it("copes with a 30-character name", () => {
    const long: PageData = { ...FULL, profile: { ...FULL.profile, fullName: "Maximiliano Bartholomew Santia" } };
    const html = render(long);
    expect(html).toContain("Maximiliano Bartholomew Santia");
    expect(html).toContain(">MS<");
  });
});

describe("contrast (WCAG AA 4.5:1)", () => {
  const css = readFileSync(path.join(__dirname, "pro-signature.css"), "utf8");
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
});
