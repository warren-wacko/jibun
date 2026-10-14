/** Usernames that collide with app routes. */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  "admin",
  "c",
  "api",
  "dashboard",
  "inactive",
  "login",
  "about",
  "pricing",
]);

const USERNAME_RE = /^[a-z0-9-]{3,30}$/;

export function validateUsername(username: string): { ok: true } | { ok: false; reason: string } {
  if (!USERNAME_RE.test(username)) {
    return { ok: false, reason: "Use 3-30 characters: lowercase letters, numbers and hyphens" };
  }
  if (RESERVED_USERNAMES.has(username)) return { ok: false, reason: "That username is reserved" };
  return { ok: true };
}
