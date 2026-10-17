import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../rate-limit";
import { loginEmailLimiter, loginIpLimiter, verifyAdminLogin, type LoginUser } from "./credentials";
import { SESSION_MAX_AGE, signSession, verifySession } from "./session";

const SECRET = "x".repeat(40);
const OTHER = "y".repeat(40);

describe("admin session", () => {
  it("round-trips a user id", async () => {
    const token = await signSession("user_1", { secret: SECRET });
    expect(await verifySession(token, { secret: SECRET })).toEqual({ userId: "user_1" });
  });

  it("rejects a missing, tampered or wrongly signed token", async () => {
    const token = await signSession("user_1", { secret: SECRET });
    expect(await verifySession(undefined, { secret: SECRET })).toBeNull();
    expect(await verifySession("garbage", { secret: SECRET })).toBeNull();
    expect(await verifySession(token.slice(0, -2) + "xx", { secret: SECRET })).toBeNull();
    expect(await verifySession(token, { secret: OTHER })).toBeNull();
  });

  it("expires after seven days", async () => {
    const issued = new Date("2026-01-01T00:00:00Z");
    const token = await signSession("user_1", { secret: SECRET, now: issued });
    const justBefore = new Date(issued.getTime() + (SESSION_MAX_AGE - 60) * 1000);
    const after = new Date(issued.getTime() + (SESSION_MAX_AGE + 60) * 1000);
    expect(await verifySession(token, { secret: SECRET, now: justBefore })).not.toBeNull();
    expect(await verifySession(token, { secret: SECRET, now: after })).toBeNull();
  });

  it("refuses to run without a long enough secret", async () => {
    await expect(signSession("u", { secret: "short" })).rejects.toThrow(/AUTH_SECRET/);
  });
});

describe("verifyAdminLogin", () => {
  const user: LoginUser = { id: "u1", passwordHash: bcrypt.hashSync("correct horse battery", 4), role: "ADMIN" };
  const find = async (email: string) => (email === "admin@example.com" ? user : null);
  let n = 0;
  const ip = () => `10.0.0.${++n}`; // a fresh IP per test so the limiters do not interfere

  it("accepts the right password (email is trimmed and lower-cased)", async () => {
    const r = await verifyAdminLogin({ email: "  Admin@Example.com ", password: "correct horse battery" }, ip(), find);
    expect(r).toEqual({ ok: true, userId: "u1" });
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const wrong = await verifyAdminLogin({ email: "admin@example.com", password: "nope" }, ip(), find);
    const unknown = await verifyAdminLogin({ email: "who@example.com", password: "nope" }, ip(), find);
    expect(wrong).toEqual({ ok: false, reason: "invalid" });
    expect(unknown).toEqual(wrong);
  });

  it("rejects a non-admin role and malformed input", async () => {
    const client = async () => ({ ...user, role: "CLIENT" });
    expect(await verifyAdminLogin({ email: "admin@example.com", password: "correct horse battery" }, ip(), client)).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(await verifyAdminLogin({ email: "not-an-email", password: "x" }, ip(), find)).toEqual({ ok: false, reason: "invalid" });
    expect(await verifyAdminLogin({ email: undefined, password: 5 }, ip(), find)).toEqual({ ok: false, reason: "invalid" });
  });

  it("blocks repeated attempts for one email, even from new IPs", async () => {
    const email = "target@example.com";
    for (let i = 0; i < 5; i++) await verifyAdminLogin({ email, password: "bad" }, ip(), find);
    const r = await verifyAdminLogin({ email, password: "bad" }, ip(), find);
    expect(r).toMatchObject({ ok: false, reason: "rate-limited" });
  });

  it("blocks repeated attempts from one IP", async () => {
    const same = ip();
    for (let i = 0; i < 10; i++) await verifyAdminLogin({ email: `a${i}@example.com`, password: "bad" }, same, find);
    expect(await verifyAdminLogin({ email: "z@example.com", password: "bad" }, same, find)).toMatchObject({
      ok: false,
      reason: "rate-limited",
    });
  });

  it("uses limiters that reset after their window", () => {
    expect(loginIpLimiter.check).toBeTypeOf("function");
    expect(loginEmailLimiter.check).toBeTypeOf("function");
    const l = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(l.check("k", 0).allowed).toBe(true);
    expect(l.check("k", 10).allowed).toBe(false);
    expect(l.check("k", 2000).allowed).toBe(true);
  });
});
