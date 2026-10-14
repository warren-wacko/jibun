import { describe, expect, it } from "vitest";
import { getUsageStatus } from "./usage";

const now = new Date("2026-10-15T00:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

describe("getUsageStatus", () => {
  it("active within 30 days", () => {
    expect(getUsageStatus(daysAgo(0), daysAgo(200), now)).toBe("active");
    expect(getUsageStatus(daysAgo(30), daysAgo(200), now)).toBe("active");
  });

  it("quiet from 31 to 90 days", () => {
    expect(getUsageStatus(daysAgo(31), daysAgo(200), now)).toBe("quiet");
    expect(getUsageStatus(daysAgo(90), daysAgo(200), now)).toBe("quiet");
  });

  it("dormant after 90 days", () => {
    expect(getUsageStatus(daysAgo(91), daysAgo(400), now)).toBe("dormant");
  });

  it("new when never tapped and live 14 days or less", () => {
    expect(getUsageStatus(null, daysAgo(14), now)).toBe("new");
    expect(getUsageStatus(null, daysAgo(1), now)).toBe("new");
  });

  it("never used when never tapped and live more than 14 days", () => {
    expect(getUsageStatus(null, daysAgo(15), now)).toBe("never_used");
  });

  it("new when the page is not live yet", () => {
    expect(getUsageStatus(null, null, now)).toBe("new");
  });
});
