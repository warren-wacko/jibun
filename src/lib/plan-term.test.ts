import { describe, expect, it } from "vitest";
import { addYears, isPlanPaid, isRenewalDue, renewedUntil, termEnd } from "./plan-term";

const d = (s: string) => new Date(s);
const daysFrom = (base: Date, n: number) => new Date(base.getTime() + n * 24 * 60 * 60 * 1000);

describe("term dates", () => {
  it("term ends 4 years after purchase", () => {
    expect(termEnd(d("2026-10-15T00:00:00Z")).toISOString()).toBe("2030-10-15T00:00:00.000Z");
  });

  it("29 Feb clamps to 28 Feb on a non-leap year", () => {
    expect(addYears(d("2028-02-29T00:00:00Z"), 1).toISOString()).toBe("2029-02-28T00:00:00.000Z");
  });

  it("renewal extends a live term by another 4 years", () => {
    const now = d("2030-09-15T00:00:00Z");
    expect(renewedUntil(d("2030-10-15T00:00:00Z"), now).toISOString()).toBe("2034-10-15T00:00:00.000Z");
  });

  it("renewal of a lapsed page restarts from today", () => {
    const now = d("2031-01-10T00:00:00Z");
    expect(renewedUntil(d("2030-10-15T00:00:00Z"), now).toISOString()).toBe("2035-01-10T00:00:00.000Z");
  });
});

describe("isPlanPaid", () => {
  const paidUntil = d("2030-10-15T00:00:00Z");

  it("is paid while within term", () => {
    expect(isPlanPaid({ status: "ACTIVE", paidUntil }, d("2029-01-01T00:00:00Z"))).toBe(true);
  });

  it("stays paid through the 30-day grace period", () => {
    expect(isPlanPaid({ status: "ACTIVE", paidUntil }, daysFrom(paidUntil, 30))).toBe(true);
  });

  it("lapses after grace", () => {
    expect(isPlanPaid({ status: "ACTIVE", paidUntil }, daysFrom(paidUntil, 31))).toBe(false);
  });

  it("is not paid when the page is not ACTIVE or has no paidUntil", () => {
    expect(isPlanPaid({ status: "DRAFT", paidUntil }, d("2027-01-01T00:00:00Z"))).toBe(false);
    expect(isPlanPaid({ status: "INACTIVE", paidUntil }, d("2027-01-01T00:00:00Z"))).toBe(false);
    expect(isPlanPaid({ status: "ACTIVE", paidUntil: null }, d("2027-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("isRenewalDue", () => {
  const paidUntil = d("2030-10-15T00:00:00Z");

  it("is due within 30 days of the end", () => {
    expect(isRenewalDue(paidUntil, daysFrom(paidUntil, -30))).toBe(true);
    expect(isRenewalDue(paidUntil, daysFrom(paidUntil, -31))).toBe(false);
  });

  it("stays due once the term has ended", () => {
    expect(isRenewalDue(paidUntil, daysFrom(paidUntil, 5))).toBe(true);
  });

  it("is not due with no paidUntil", () => {
    expect(isRenewalDue(null)).toBe(false);
  });
});
