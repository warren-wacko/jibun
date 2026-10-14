import { describe, expect, it } from "vitest";
import { PageDataSchema, parsePageData, safeParsePageData } from "./page-schema";
import { SAMPLE_PAGE_DATA } from "./sample-data";

const clone = () => structuredClone(SAMPLE_PAGE_DATA);

describe("PageDataSchema", () => {
  it("accepts the sample data", () => {
    expect(parsePageData(SAMPLE_PAGE_DATA).profile.fullName).toBe("Maria Santos");
  });

  it("accepts the minimum: a name, showPhoneNumbers, empty lists, a style", () => {
    const minimal = {
      profile: { fullName: "A" },
      contact: { showPhoneNumbers: false },
      socials: [],
      sections: [],
      style: { theme: "dark", accent: "#fff" },
    };
    expect(PageDataSchema.safeParse(minimal).success).toBe(true);
  });

  it("requires a full name and showPhoneNumbers", () => {
    const noName = clone();
    // @ts-expect-error testing invalid input
    delete noName.profile.fullName;
    expect(safeParsePageData(noName).success).toBe(false);

    const noFlag = clone();
    delete (noFlag.contact as Partial<typeof noFlag.contact>).showPhoneNumbers;
    expect(safeParsePageData(noFlag).success).toBe(false);
  });

  it("requires E.164 phone numbers", () => {
    const d = clone();
    d.contact.phone = "0917 123 4567";
    expect(safeParsePageData(d).success).toBe(false);
  });

  it("accepts hex and preset accents but not arbitrary text", () => {
    for (const accent of ["#2563eb", "#abc", "school-blue-gold"]) {
      const d = clone();
      d.style.accent = accent;
      expect(safeParsePageData(d).success, accent).toBe(true);
    }
    const bad = clone();
    bad.style.accent = "red; background:url(x)";
    expect(safeParsePageData(bad).success).toBe(false);
  });

  it("rejects javascript: URLs in images, links and sections", () => {
    const photo = clone();
    photo.profile.photoUrl = "javascript:alert(1)";
    expect(safeParsePageData(photo).success).toBe(false);

    const social = clone();
    social.socials[0].url = "javascript:alert(1)";
    expect(safeParsePageData(social).success).toBe(false);

    const video = clone();
    video.sections = [{ kind: "video", url: "javascript:alert(1)" }];
    expect(safeParsePageData(video).success).toBe(false);
  });

  it("allows viber:// deep links on social links", () => {
    const d = clone();
    d.socials = [{ type: "viber", handle: "+639171234567", url: "viber://chat?number=639171234567" }];
    expect(safeParsePageData(d).success).toBe(true);
  });

  it("limits gallery to 10 images", () => {
    const images = Array.from({ length: 11 }, (_, i) => ({ url: `https://img.example.com/${i}.webp`, alt: `Photo ${i}` }));
    const d = clone();
    d.sections = [{ kind: "gallery", images }];
    expect(safeParsePageData(d).success).toBe(false);
    d.sections = [{ kind: "gallery", images: images.slice(0, 10) }];
    expect(safeParsePageData(d).success).toBe(true);
  });

  it("rejects unknown section kinds and social types", () => {
    const section = { ...clone(), sections: [{ kind: "nope" }] };
    expect(safeParsePageData(section).success).toBe(false);

    const social = { ...clone(), socials: [{ type: "myspace", handle: "x", url: "https://example.com" }] };
    expect(safeParsePageData(social).success).toBe(false);
  });

  it("parsePageData throws on invalid input", () => {
    expect(() => parsePageData({})).toThrow();
  });
});
