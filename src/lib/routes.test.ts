import { describe, expect, it } from "vitest";
import { canDownload, canViewPage } from "./page-access";
import { buildTemplateMeta } from "./page-meta";
import { createRateLimiter, getClientIp } from "./rate-limit";
import { isSafePhotoUrl } from "./vcard-photo";

const now = new Date("2026-10-15T00:00:00Z");
const future = new Date("2030-01-01T00:00:00Z");
const longAgo = new Date("2026-01-01T00:00:00Z");

describe("canViewPage / canDownload", () => {
  it("ACTIVE and paid is visible and downloadable", () => {
    const p = { status: "ACTIVE" as const, paidUntil: future };
    expect(canViewPage(p, now)).toBe(true);
    expect(canDownload(p, now)).toBe(true);
  });

  it("ACTIVE but lapsed past grace is hidden", () => {
    const p = { status: "ACTIVE" as const, paidUntil: longAgo };
    expect(canViewPage(p, now)).toBe(false);
    expect(canDownload(p, now)).toBe(false);
  });

  it("DRAFT is viewable for preview but not downloadable", () => {
    const p = { status: "DRAFT" as const, paidUntil: null };
    expect(canViewPage(p, now)).toBe(true);
    expect(canDownload(p, now)).toBe(false);
  });

  it("INACTIVE is never visible", () => {
    const p = { status: "INACTIVE" as const, paidUntil: future };
    expect(canViewPage(p, now)).toBe(false);
    expect(canDownload(p, now)).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit then blocks, with a retry hint", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const results = [1, 2, 3, 4].map(() => rl.check("ip", 1000));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSec).toBe(60);
    expect(results[0].remaining).toBe(2);
  });

  it("tracks keys separately and resets after the window", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(rl.check("a", 0).allowed).toBe(true);
    expect(rl.check("a", 10).allowed).toBe(false);
    expect(rl.check("b", 10).allowed).toBe(true);
    expect(rl.check("a", 1001).allowed).toBe(true);
  });

  it("reads the client IP from forwarding headers", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(getClientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("isSafePhotoUrl", () => {
  it("accepts a normal https image host", () => {
    expect(isSafePhotoUrl("https://res.cloudinary.com/demo/image/upload/a.jpg")).toBe(true);
  });

  it.each([
    "http://example.com/a.jpg",
    "https://localhost/a.jpg",
    "https://127.0.0.1/a.jpg",
    "https://192.168.1.5/a.jpg",
    "https://[::1]/a.jpg",
    "https://metadata.internal/a.jpg",
    "not a url",
    "javascript:alert(1)",
  ])("rejects %s", (url) => {
    expect(isSafePhotoUrl(url)).toBe(false);
  });
});

describe("buildTemplateMeta", () => {
  it("points at the page's vcard and qr routes", () => {
    const m = buildTemplateMeta({ username: "maria", tier: "STARTER", addOns: [] });
    expect(m).toMatchObject({ username: "maria", vcardHref: "/maria/vcard", qrHref: "/maria/qr", showBranding: true });
    expect(m.pageUrl.endsWith("/maria")).toBe(true);
  });

  it("hides branding with remove_branding or on CUSTOM", () => {
    expect(buildTemplateMeta({ username: "m", tier: "STARTER", addOns: ["remove_branding"] }).showBranding).toBe(false);
    expect(buildTemplateMeta({ username: "m", tier: "CUSTOM", addOns: [] }).showBranding).toBe(false);
  });
});
