import { SignJWT, jwtVerify } from "jose";

/** The admin session is a signed (HS256) token in an httpOnly cookie: stateless, so no session table. */
export const SESSION_COOKIE = "jibun_admin";
export const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export type AdminSession = { userId: string };

function key(secret = process.env.AUTH_SECRET): Uint8Array {
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string, opts: { secret?: string; now?: Date } = {}): Promise<string> {
  const issued = Math.floor((opts.now ?? new Date()).getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(issued)
    .setExpirationTime(issued + SESSION_MAX_AGE)
    .sign(key(opts.secret));
}

/** The session for a cookie value, or null when it is missing, tampered with or expired. */
export async function verifySession(
  token: string | undefined,
  opts: { secret?: string; now?: Date } = {},
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(opts.secret), { algorithms: ["HS256"], currentDate: opts.now });
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}
