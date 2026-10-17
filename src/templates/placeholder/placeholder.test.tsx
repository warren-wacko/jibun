import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parsePageData, type PageData } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { getTemplate, hasTemplate } from "../registry";
import type { TemplateMeta } from "../types";

const META: TemplateMeta = {
  username: "maria",
  pageUrl: "https://example.test/maria",
  vcardHref: "/maria/vcard",
  qrHref: "/maria/qr",
  showBranding: true,
};

const render = (key: string, data: PageData, theme: "light" | "dark" = "light", meta: TemplateMeta = META) => {
  const Template = getTemplate(key);
  return renderToStaticMarkup(<Template data={data} theme={theme} meta={meta} />);
};

const minimal = () =>
  parsePageData({
    profile: { fullName: "A" },
    contact: { showPhoneNumbers: false },
    socials: [],
    sections: [],
    style: { theme: "light", accent: "blue" },
  });

describe("placeholder template", () => {
  it("renders the sample data in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render("placeholder", SAMPLE_PAGE_DATA, theme);
      expect(html).toContain("Maria Santos");
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain("Digital card by");
      expect(html).toContain("Save Contact");
      expect(html).toContain('href="/maria/vcard"');
    }
  });

  it("renders the minimum data without empty groups or contact links", () => {
    const html = render("placeholder", minimal());
    expect(html).not.toContain("Profiles to view");
    expect(html).not.toContain("Ways to message");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("Directions");
  });

  it("hides phone numbers: no Call or Text, messaging says Chat", () => {
    const hidden: PageData = {
      ...SAMPLE_PAGE_DATA,
      contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false },
    };
    const html = render("placeholder", hidden);
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("sms:");
    expect(html).not.toContain(">+639171234567<");
    expect(html).toContain("Chat");
  });

  it("handles a 30-character name", () => {
    const long: PageData = { ...SAMPLE_PAGE_DATA, profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "A".repeat(30) } };
    expect(render("placeholder", long)).toContain("A".repeat(30));
  });

  it("removes the branding credit when branding is off", () => {
    expect(render("placeholder", SAMPLE_PAGE_DATA, "light", { ...META, showBranding: false })).not.toContain(
      "Digital card by",
    );
  });
});

describe("registry", () => {
  it("falls back to the placeholder for keys that are not registered", () => {
    expect(hasTemplate("not-a-template")).toBe(false);
    expect(getTemplate("not-a-template")).toBe(getTemplate("placeholder"));
  });
});
