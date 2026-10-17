import { describe, expect, it } from "vitest";
import { DEFAULT_FONTS, FONT_PAIRS, fontPairsFor, findFontPair } from "./font-pairs";
import { TEMPLATE_KEYS } from "./keys";

describe("font pairs", () => {
  it("describe templates that exist, with unique ids and readable labels", () => {
    for (const [key, pairs] of Object.entries(FONT_PAIRS)) {
      expect(TEMPLATE_KEYS, key).toContain(key);
      const ids = pairs.map((p) => p.id);
      expect(new Set(ids).size, `${key} ids`).toBe(ids.length);
      for (const p of pairs) {
        expect(p.id).toMatch(/^[a-z0-9-]{2,40}$/); // a valid PageData fontPair id
        expect(p.label.length).toBeGreaterThan(0);
        expect(p.heading && p.body).toBeTruthy();
      }
    }
  });

  it("match the Standard designs: three alternatives on each professional template, none elsewhere", () => {
    for (const key of ["pro-classic", "pro-magazine", "pro-signature", "pro-company"]) expect(fontPairsFor(key), key).toHaveLength(3);
    for (const key of ["student-notebook", "social-bento", "social-scrapbook", "social-minimalist"]) expect(fontPairsFor(key), key).toEqual([]);
  });

  it("names the default fonts of every template", () => {
    for (const key of TEMPLATE_KEYS) expect(DEFAULT_FONTS[key], key).toBeTruthy();
  });

  it("finds a pair by id for its own template only", () => {
    expect(findFontPair("pro-company", "executive")?.heading).toBe("IBM Plex Sans");
    expect(findFontPair("pro-classic", "executive")).toBeUndefined();
    expect(findFontPair("social-bento", "bold")).toBeUndefined();
  });
});
