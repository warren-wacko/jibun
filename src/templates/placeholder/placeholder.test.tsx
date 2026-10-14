import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parsePageData, type PageData } from "@/lib/page-schema";
import { SAMPLE_PAGE_DATA } from "@/lib/sample-data";
import { getTemplate, hasTemplate } from "../registry";

const render = (key: string, data: PageData, theme: "light" | "dark" = "light") => {
  const Template = getTemplate(key);
  return renderToStaticMarkup(<Template data={data} theme={theme} />);
};

describe("placeholder template", () => {
  it("renders the sample data in both themes", () => {
    for (const theme of ["light", "dark"] as const) {
      const html = render("placeholder", SAMPLE_PAGE_DATA, theme);
      expect(html).toContain("Maria Santos");
      expect(html).toContain(`data-theme="${theme}"`);
      expect(html).toContain("Digital card by Jibun");
    }
  });

  it("renders the minimum data without empty groups or links", () => {
    const minimal = parsePageData({
      profile: { fullName: "A" },
      contact: { showPhoneNumbers: false },
      socials: [],
      sections: [],
      style: { theme: "light", accent: "blue" },
    });
    const html = render("placeholder", minimal);
    expect(html).not.toContain("Profiles to view");
    expect(html).not.toContain("Ways to message");
    expect(html).not.toContain("href=");
  });

  it("hides phone numbers: no Call button, messaging says Chat", () => {
    const hidden: PageData = {
      ...SAMPLE_PAGE_DATA,
      contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false },
    };
    const html = render("placeholder", hidden);
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("+639171234567");
    expect(html).toContain("whatsapp: Chat");
  });

  it("handles a 30-character name", () => {
    const long: PageData = { ...SAMPLE_PAGE_DATA, profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "A".repeat(30) } };
    expect(render("placeholder", long)).toContain("A".repeat(30));
  });
});

describe("registry", () => {
  it("falls back to the placeholder for launch templates not converted yet", () => {
    expect(hasTemplate("pro-classic")).toBe(false);
    expect(getTemplate("pro-classic")).toBe(getTemplate("placeholder"));
  });
});
