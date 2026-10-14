import { describe, expect, it } from "vitest";
import type { PageData } from "./page-schema";
import { SAMPLE_PAGE_DATA } from "./sample-data";
import { buildVCard, foldLine } from "./vcard";

const URL = "https://example.test/maria";
const build = (data: PageData = SAMPLE_PAGE_DATA, photo = null as Parameters<typeof buildVCard>[1]["photo"]) =>
  buildVCard(data, { pageUrl: URL, photo });

describe("buildVCard", () => {
  it("is a vCard 3.0 with CRLF line endings", () => {
    const v = build();
    expect(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(v.endsWith("END:VCARD\r\n")).toBe(true);
    expect(v.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("includes name, title, company, phone, email and URL", () => {
    const v = build();
    expect(v).toContain("FN:Maria Santos");
    expect(v).toContain("N:Santos;Maria;;;");
    expect(v).toContain("TITLE:Product Designer");
    expect(v).toContain("ORG:Northwind Studio");
    expect(v).toContain("TEL;TYPE=CELL:+639171234567");
    expect(v).toContain("EMAIL;TYPE=INTERNET:maria@example.com");
    expect(v).toContain(`URL:${URL}`);
  });

  it("omits the phone number when showPhoneNumbers is off", () => {
    const hidden: PageData = { ...SAMPLE_PAGE_DATA, contact: { ...SAMPLE_PAGE_DATA.contact, showPhoneNumbers: false } };
    const v = build(hidden);
    expect(v).not.toContain("TEL");
    expect(v).not.toContain("639171234567");
  });

  it("omits fields that are not set", () => {
    const min: PageData = {
      profile: { fullName: "Cher" },
      contact: { showPhoneNumbers: false },
      socials: [],
      sections: [],
      style: { theme: "light", accent: "blue" },
    };
    const v = build(min);
    for (const key of ["TITLE", "ORG", "TEL", "EMAIL", "ADR", "PHOTO", "NICKNAME"]) expect(v).not.toContain(key);
    expect(v).toContain("N:;Cher;;;");
  });

  it("escapes commas, semicolons and newlines", () => {
    const data: PageData = {
      ...SAMPLE_PAGE_DATA,
      profile: { ...SAMPLE_PAGE_DATA.profile, company: "Smith, Jones; & Co" },
    };
    expect(build(data)).toContain("ORG:Smith\\, Jones\\; & Co");
  });

  it("splits a multi-word given name from the family name", () => {
    const data: PageData = { ...SAMPLE_PAGE_DATA, profile: { ...SAMPLE_PAGE_DATA.profile, fullName: "Maria Clara Santos" } };
    expect(build(data)).toContain("N:Santos;Maria Clara;;;");
  });

  it("embeds a photo as base64", () => {
    const v = build(SAMPLE_PAGE_DATA, { type: "JPEG", base64: "QUJD" });
    expect(v.replace(/\r\n /g, "")).toContain("PHOTO;ENCODING=b;TYPE=JPEG:QUJD");
  });
});

describe("foldLine", () => {
  it("leaves short lines alone", () => {
    expect(foldLine("FN:Maria")).toBe("FN:Maria");
  });

  it("folds long lines at 75 octets and unfolds back to the original", () => {
    const line = "PHOTO;ENCODING=b;TYPE=JPEG:" + "A".repeat(500);
    const folded = foldLine(line);
    const physical = folded.split("\r\n");
    expect(physical.length).toBeGreaterThan(1);
    for (const l of physical) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
  });

  it("never splits a multi-byte character", () => {
    const line = "NOTE:" + "é".repeat(80);
    const folded = foldLine(line);
    expect(folded.replace(/\r\n /g, "")).toBe(line);
    for (const l of folded.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });
});
