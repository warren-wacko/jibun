import { describe, expect, it } from "vitest";
import { ACCENT_PRESETS, contrastRatio, resolveAccent } from "./accents";
import { CARD_CODE_ALPHABET, generateCardCode, normalizeCardCode } from "./card-code";
import { RESERVED_USERNAMES, validateUsername } from "./usernames";

describe("card codes", () => {
  it("are 7 characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCardCode();
      expect(code).toHaveLength(7);
      expect([...code].every((c) => CARD_CODE_ALPHABET.includes(c))).toBe(true);
    }
  });

  it("exclude 0, O, 1, I and L", () => {
    expect(CARD_CODE_ALPHABET).not.toMatch(/[01OIL]/);
  });

  it("are not repeated across a batch", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateCardCode()));
    expect(codes.size).toBe(500);
  });

  it("normalize to uppercase", () => {
    expect(normalizeCardCode(" ab3kz9q ")).toBe("AB3KZ9Q");
  });
});

describe("validateUsername", () => {
  it("accepts valid usernames", () => {
    expect(validateUsername("maria-santos")).toEqual({ ok: true });
    expect(validateUsername("abc")).toEqual({ ok: true });
  });

  it("rejects bad length and characters", () => {
    for (const u of ["ab", "a".repeat(31), "Maria", "ma ria", "maria_s"]) {
      expect(validateUsername(u).ok, u).toBe(false);
    }
  });

  it("rejects every reserved route name", () => {
    for (const u of RESERVED_USERNAMES) {
      // "c" is too short to pass the length rule first; either way it must be rejected
      expect(validateUsername(u).ok, u).toBe(false);
    }
  });
});

describe("accents", () => {
  it("every preset has readable text on its accent (AA)", () => {
    for (const p of ACCENT_PRESETS) {
      expect(contrastRatio(p.accent, p.onAccent), p.id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("resolves hex and preset ids, with a safe fallback", () => {
    expect(resolveAccent("#fff").accent).toBe("#ffffff");
    expect(resolveAccent("#fff").onAccent).toBe("#0e1013");
    expect(resolveAccent("school-blue-gold").accent).toBe("#1e3a8a");
    expect(resolveAccent("does-not-exist").accent).toBe("#2563eb"); // falls back to blue
  });

  it("reports whether the accent is a light or dark surface", () => {
    expect(resolveAccent("pearl").tone).toBe("light");
    expect(resolveAccent("graphite").tone).toBe("dark");
    expect(resolveAccent("#fff").tone).toBe("light");
    expect(resolveAccent("#101010").tone).toBe("dark");
  });
});

describe("resolveAccent: small-text flags", () => {
  it("marks a pale accent as weak text on a light page and a dark one as weak on a dark page", () => {
    const pearl = resolveAccent("pearl");
    expect(pearl.textOnLight).toBe(false);
    expect(pearl.textOnDark).toBe(true);
    const graphite = resolveAccent("graphite");
    expect(graphite.textOnLight).toBe(true);
    expect(graphite.textOnDark).toBe(false);
  });

  it("agrees with the contrast it describes", () => {
    for (const p of ACCENT_PRESETS) {
      const r = resolveAccent(p.id);
      expect(r.textOnLight, p.id).toBe(contrastRatio(r.accent, "#f4f5f7") >= 4.5);
      expect(r.textOnDark, p.id).toBe(contrastRatio(r.accent, "#17191c") >= 4.5);
    }
  });
});
