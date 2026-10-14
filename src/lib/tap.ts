import { createHash } from "node:crypto";
import { TAP_DEDUP_MINUTES } from "./usage";

export type TapSource = "nfc" | "qr";
export type DeviceClass = "ios" | "android" | "desktop" | "other";

/** The QR encodes /c/[code]?src=qr; anything else (the chip's bare URL) is an NFC tap. */
export function parseSource(param: string | null): TapSource {
  return param === "qr" ? "qr" : "nfc";
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|slack|skype|embedly|quora|pinterest|curl|wget|python-requests|httpclient|okhttp|headless|lighthouse|pingdom|uptime|monitor|scan|fetch/i;

/**
 * Bots and link-preview fetchers are redirected like anyone else but not logged.
 * A request with no user agent is treated as a bot: phones always send one.
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent || !userAgent.trim()) return true;
  return BOT_PATTERN.test(userAgent);
}

/** Coarse device class. Stored instead of the full user agent: device type is all analytics needs. */
export function deviceClass(userAgent: string | null): DeviceClass {
  const ua = userAgent ?? "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows|macintosh|linux|cros/i.test(ua)) return "desktop";
  return "other";
}

/** Two-letter country code from the CDN/proxy header, if one is present. */
export function countryFromHeaders(headers: Headers): string | null {
  const raw = headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country") ?? headers.get("x-country-code");
  const code = raw?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
}

/**
 * Key for "the same device tapped the same card". It is hashed and kept only in memory for
 * the de-dup window: the IP is never written to the database.
 */
export function dedupKey(cardId: string, ip: string, userAgent: string | null): string {
  return createHash("sha256").update(`${cardId}|${ip}|${userAgent ?? ""}`).digest("hex");
}

export type TapDedup = { isDuplicate(key: string, now?: number): boolean };

const MAX_KEYS = 10_000;

/** In-memory window: the first sighting is recorded and returns false, repeats inside the window return true. */
export function createTapDedup(windowMs: number = TAP_DEDUP_MINUTES * 60_000): TapDedup {
  const seen = new Map<string, number>();
  return {
    isDuplicate(key, now = Date.now()) {
      if (seen.size >= MAX_KEYS) {
        for (const [k, t] of seen) if (now - t >= windowMs) seen.delete(k);
        while (seen.size >= MAX_KEYS) {
          const oldest = seen.keys().next().value;
          if (oldest === undefined) break;
          seen.delete(oldest);
        }
      }
      const last = seen.get(key);
      if (last !== undefined && now - last < windowMs) return true;
      seen.set(key, now);
      return false;
    },
  };
}

export const tapDedup = createTapDedup();
