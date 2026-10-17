import { describe, expect, it } from "vitest";
import { buildRenewalWhere, describeDays, renewalInfo, reminderMailto } from "./renewals";

const NOW = new Date("2026-06-15T00:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe("renewalInfo", () => {
  it("has no stage without a term", () => {
    expect(renewalInfo(null, NOW)).toEqual({ stage: "none", daysLeft: null, graceEnds: null });
  });

  it.each([
    [400, "ok"],
    [31, "ok"],
    [30, "due"],
    [1, "due"],
    [0, "due"],
    [-1, "grace"],
    [-30, "grace"],
    [-31, "lapsed"],
    [-400, "lapsed"],
  ] as const)("a term ending in %i days is %s", (days, stage) => {
    expect(renewalInfo(day(days), NOW).stage).toBe(stage);
  });

  it("counts whole days left and works out when the grace period ends", () => {
    const info = renewalInfo(day(10), NOW);
    expect(info.daysLeft).toBe(10);
    expect(info.graceEnds?.toISOString()).toBe(day(40).toISOString());
    expect(renewalInfo(day(-5), NOW).daysLeft).toBe(-5);
  });

  it("agrees with the rule that decides whether the page shows (grace of 30 days)", () => {
    // 30 days after the end, the page still shows; a moment later it does not.
    const end = day(-30);
    expect(renewalInfo(end, NOW).stage).toBe("grace");
    expect(renewalInfo(end, new Date(NOW.getTime() + 1000)).stage).toBe("lapsed");
  });
});

describe("describeDays", () => {
  it("reads naturally", () => {
    expect(describeDays(12)).toBe("in 12 days");
    expect(describeDays(1)).toBe("in 1 day");
    expect(describeDays(0)).toBe("today");
    expect(describeDays(-3)).toBe("3 days ago");
    expect(describeDays(-1)).toBe("1 day ago");
  });
});

describe("buildRenewalWhere", () => {
  it("lists live pages whose term ends within 30 days or has ended", () => {
    expect(buildRenewalWhere(NOW)).toEqual({ paidUntil: { not: null, lte: day(30) }, status: "ACTIVE" });
  });
  it("can include pages already switched off", () => {
    expect(buildRenewalWhere(NOW, { includeInactive: true }).status).toEqual({ in: ["ACTIVE", "INACTIVE"] });
  });
});

describe("reminderMailto", () => {
  const base = { name: "Maria", paidUntil: new Date("2026-07-01T00:00:00Z"), now: NOW };

  it("needs an email address", () => {
    expect(reminderMailto({ ...base, email: null })).toBeNull();
  });

  it("builds an encoded message with the end date", () => {
    const url = reminderMailto({ ...base, email: "maria@example.com" }) as string;
    expect(url.startsWith("mailto:maria%40example.com?subject=")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toBe("Your Jibun digital card term ends on July 1, 2026");
    expect(params.get("body")).toContain("Hi Maria,");
    expect(params.get("body")).toContain("are covered until July 1, 2026");
  });

  it("uses past tense once the term has ended", () => {
    const url = reminderMailto({ ...base, email: "m@example.com", paidUntil: new Date("2026-05-01T00:00:00Z") }) as string;
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toContain("ended on May 1, 2026");
    expect(params.get("body")).toContain("were covered until");
  });
});
