import { describe, expect, it } from "vitest";
import { buildClientOrderBy, buildClientWhere, clientsHref, parseClientFilter, termState, toClientRow } from "./clients";

const NOW = new Date("2026-06-15T00:00:00Z");
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe("parseClientFilter", () => {
  it("has sensible defaults", () => {
    expect(parseClientFilter({})).toEqual({ q: undefined, tier: undefined, status: undefined, usage: undefined, sort: "recent", page: 1 });
  });

  it("reads valid values, trims the search and takes the first of a repeated key", () => {
    const f = parseClientFilter({ q: "  maria ", tier: ["STANDARD", "STARTER"], status: "ACTIVE", usage: "dormant", sort: "last_tap", page: "3" });
    expect(f).toMatchObject({ q: "maria", tier: "STANDARD", status: "ACTIVE", usage: "dormant", sort: "last_tap", page: 3 });
  });

  it("ignores junk instead of failing", () => {
    const f = parseClientFilter({ tier: "PREMIUM", status: "x", usage: "??", sort: "drop table", page: "-4", q: "a".repeat(200) });
    expect(f).toEqual({ q: undefined, tier: undefined, status: undefined, usage: undefined, sort: "recent", page: 1 });
  });
});

describe("buildClientWhere", () => {
  const base = parseClientFilter({});
  it("is empty with no filters", () => {
    expect(buildClientWhere(base, NOW)).toEqual({});
  });

  it("searches username, client name and email, case-insensitively", () => {
    const w = buildClientWhere({ ...base, q: "mar" }, NOW) as { AND: { OR: unknown[] }[] };
    expect(w.AND[0].OR).toHaveLength(3);
    expect(JSON.stringify(w)).toContain('"mode":"insensitive"');
  });

  it("combines tier and status", () => {
    expect(buildClientWhere({ ...base, tier: "STANDARD", status: "ACTIVE" }, NOW)).toEqual({
      AND: [{ tier: "STANDARD" }, { status: "ACTIVE" }],
    });
  });

  it.each([
    ["active", { lastTapAt: { gte: day(30) } }],
    ["quiet", { lastTapAt: { lt: day(30), gte: day(90) } }],
    ["dormant", { lastTapAt: { lt: day(90) } }],
    ["never_used", { lastTapAt: null, createdAt: { lt: day(14) } }],
    ["new", { lastTapAt: null, createdAt: { gte: day(14) } }],
  ] as const)("usage filter %s matches the thresholds in lib/usage.ts", (usage, expected) => {
    expect(buildClientWhere({ ...base, usage }, NOW)).toEqual({ AND: [expected] });
  });
});

describe("buildClientOrderBy", () => {
  it("puts pages with no tap last when sorting by last tap", () => {
    expect(buildClientOrderBy("last_tap")[0]).toEqual({ lastTapAt: { sort: "desc", nulls: "last" } });
  });
  it("sorts the soonest-ending term first", () => {
    expect(buildClientOrderBy("paid_until")[0]).toEqual({ paidUntil: { sort: "asc", nulls: "last" } });
  });
  it("defaults to newest first", () => {
    expect(buildClientOrderBy("recent")).toEqual([{ createdAt: "desc" }]);
  });
});

describe("termState", () => {
  it("tells ended, due, ok and none apart", () => {
    expect(termState(null, NOW)).toBe("none");
    expect(termState(day(1), NOW)).toBe("ended");
    expect(termState(new Date(NOW.getTime() + 10 * 86_400_000), NOW)).toBe("due");
    expect(termState(new Date(NOW.getTime() + 400 * 86_400_000), NOW)).toBe("ok");
  });
});

describe("toClientRow", () => {
  it("derives usage and term from the page", () => {
    const row = toClientRow(
      { id: "1", username: "maria", tier: "STARTER", status: "ACTIVE", paidUntil: day(-500), lastTapAt: day(5), createdAt: day(60), client: { name: "Maria" } },
      NOW,
    );
    expect(row).toMatchObject({ name: "Maria", usage: "active", term: "ok" });
  });

  it("flags a live page nobody has tapped", () => {
    const row = toClientRow(
      { id: "1", username: "x", tier: "STARTER", status: "ACTIVE", paidUntil: null, lastTapAt: null, createdAt: day(40), client: { name: "X" } },
      NOW,
    );
    expect(row.usage).toBe("never_used");
  });
});

describe("clientsHref", () => {
  const f = parseClientFilter({ q: "maria", tier: "STARTER", page: "2" });
  it("keeps filters, changes some, and drops defaults", () => {
    expect(clientsHref(f, { page: 3 })).toBe("/admin/clients?q=maria&tier=STARTER&page=3");
    expect(clientsHref(f, { tier: undefined, page: 1 })).toBe("/admin/clients?q=maria");
    expect(clientsHref(parseClientFilter({}))).toBe("/admin/clients");
  });
});
