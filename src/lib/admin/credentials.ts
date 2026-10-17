import bcrypt from "bcryptjs";
import { z } from "zod";
import { createRateLimiter } from "../rate-limit";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export type LoginUser = { id: string; passwordHash: string; role: string };

/** Compared against when the email is unknown, so a miss takes as long as a wrong password. */
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const WINDOW = 15 * 60_000;
/** 10 attempts per IP and 5 per email in 15 minutes. */
export const loginIpLimiter = createRateLimiter({ limit: 10, windowMs: WINDOW });
export const loginEmailLimiter = createRateLimiter({ limit: 5, windowMs: WINDOW });

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "rate-limited"; retryAfterSec?: number };

/** Checks the form input and credentials. The error never says whether the email exists. */
export async function verifyAdminLogin(
  input: { email: unknown; password: unknown },
  ip: string,
  findUser: (email: string) => Promise<LoginUser | null>,
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { email, password } = parsed.data;

  const byIp = loginIpLimiter.check(ip);
  const byEmail = loginEmailLimiter.check(email);
  if (!byIp.allowed || !byEmail.allowed) {
    return { ok: false, reason: "rate-limited", retryAfterSec: Math.max(byIp.retryAfterSec, byEmail.retryAfterSec) };
  }

  const user = await findUser(email);
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !matches || user.role !== "ADMIN") return { ok: false, reason: "invalid" };
  return { ok: true, userId: user.id };
}
