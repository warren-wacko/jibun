import { describe, expect, it } from "vitest";
import { describeTierChange, emptyTierChangeForm, formatPesos, isUpgrade, parsePesos, tierChangeSchema, validateTierChange } from "./tier-change";

describe("isUpgrade", () => {
  it("ranks Starter < Standard < Custom", () => {
    expect(isUpgrade("STARTER", "STANDARD")).toBe(true);
    expect(isUpgrade("STANDARD", "CUSTOM")).toBe(true);
    expect(isUpgrade("STARTER", "CUSTOM")).toBe(true);
    expect(isUpgrade("STANDARD", "STARTER")).toBe(false);
    expect(isUpgrade("STANDARD", "STANDARD")).toBe(false);
  });
});

describe("parsePesos", () => {
  it.each([
    ["800", 800],
    ["1,500", 1500],
    ["₱ 2,000", 2000],
    ["PHP300", 300],
    ["0", 0],
  ])("%s -> %i", (text, value) => expect(parsePesos(text)).toBe(value));

  it.each(["", "abc", "12.50", "-5", "1e3", "12 34 56 78 90 12"])("rejects %j", (text) => expect(parsePesos(text)).toBeNull());
});

describe("validateTierChange", () => {
  const form = (over = {}) => ({ ...emptyTierChangeForm(), amount: "800", ...over });

  it("accepts an amount, with an optional note", () => {
    expect(validateTierChange(form({ reprint: true, note: "  paid by GCash " }))).toEqual({
      ok: true,
      value: { amountPaid: 800, reprint: true, note: "paid by GCash" },
    });
    expect(validateTierChange(form())).toEqual({ ok: true, value: { amountPaid: 800, reprint: false, note: undefined } });
  });

  it("accepts 0 for a free change but requires the amount to be filled in", () => {
    expect(validateTierChange(form({ amount: "0" })).ok).toBe(true);
    const r = validateTierChange(form({ amount: "" }));
    expect(!r.ok && r.errors.amount).toMatch(/Enter the amount/);
  });

  it("rejects decimals, words, negatives and silly amounts", () => {
    for (const amount of ["12.5", "lots", "-1", "99999999"]) expect(validateTierChange(form({ amount })).ok, amount).toBe(false);
  });

  it("rejects a long note", () => {
    const r = validateTierChange(form({ note: "x".repeat(201) }));
    expect(!r.ok && r.errors.note).toBeTruthy();
  });
});

describe("tierChangeSchema (server side)", () => {
  it("checks the same rules on the numbers it receives", () => {
    expect(tierChangeSchema.safeParse({ amountPaid: 500, reprint: false }).success).toBe(true);
    expect(tierChangeSchema.safeParse({ amountPaid: -1, reprint: false }).success).toBe(false);
    expect(tierChangeSchema.safeParse({ amountPaid: 1.5, reprint: false }).success).toBe(false);
    expect(tierChangeSchema.safeParse({ amountPaid: "500", reprint: false }).success).toBe(false);
    expect(tierChangeSchema.safeParse({ amountPaid: 5_000_000, reprint: true }).success).toBe(false);
  });
});

describe("describing a change", () => {
  it("formats pesos and the card choice", () => {
    expect(formatPesos(1500)).toMatch(/1,500/);
    expect(describeTierChange({ fromTier: "STARTER", toTier: "STANDARD", amountPaid: 800, reprint: true })).toMatch(/Starter → Standard · .*800 · new card included/);
    expect(describeTierChange({ fromTier: "STANDARD", toTier: "CUSTOM", amountPaid: 0, reprint: false })).toMatch(/keeps the current card/);
  });
});
