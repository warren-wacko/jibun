/**
 * In-memory fixed-window limiter. The app runs as one always-on Node process, so this is
 * enough; it resets on restart and is not shared between instances.
 */
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSec: number };

export type RateLimiter = { check(key: string, now?: number): RateLimitResult };

const MAX_TRACKED_KEYS = 5000;

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function prune(now: number) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    // Still too many live keys (a flood of distinct IPs): drop the oldest rather than grow without bound.
    while (hits.size > MAX_TRACKED_KEYS) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  }

  return {
    check(key, now = Date.now()) {
      if (hits.size >= MAX_TRACKED_KEYS) prune(now);
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count), retryAfterSec };
    },
  };
}

/** Roughly 30 requests a minute per IP on /c/* and /[username]/vcard. */
export const publicLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

/** Client IP behind Hostinger's proxy. Used only as a rate-limit key; never stored. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
