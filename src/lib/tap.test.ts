import { describe, expect, it } from "vitest";
import { countryFromHeaders, createTapDedup, dedupKey, deviceClass, isBot, parseSource } from "./tap";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

describe("parseSource", () => {
  it("treats only src=qr as a QR scan", () => {
    expect(parseSource("qr")).toBe("qr");
    expect(parseSource(null)).toBe("nfc");
    expect(parseSource("nfc")).toBe("nfc");
    expect(parseSource("anything-else")).toBe("nfc");
  });
});

describe("isBot", () => {
  it("lets real phone and desktop browsers through", () => {
    for (const ua of [IPHONE, ANDROID, DESKTOP]) expect(isBot(ua), ua).toBe(false);
  });

  it.each([
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "facebookexternalhit/1.1",
    "WhatsApp/2.23.20 A",
    "Twitterbot/1.0",
    "Mozilla/5.0 (compatible; Discordbot/2.0)",
    "TelegramBot (like TwitterBot)",
    "Slackbot-LinkExpanding 1.0",
    "curl/8.4.0",
    "python-requests/2.31",
    "Mozilla/5.0 HeadlessChrome/120",
    "Mozilla/5.0 (Macintosh) Applebot/0.1",
  ])("flags %s", (ua) => {
    expect(isBot(ua)).toBe(true);
  });

  it("treats a missing or blank user agent as a bot", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot("   ")).toBe(true);
  });
});

describe("deviceClass", () => {
  it("classifies devices coarsely", () => {
    expect(deviceClass(IPHONE)).toBe("ios");
    expect(deviceClass(ANDROID)).toBe("android");
    expect(deviceClass(DESKTOP)).toBe("desktop");
    expect(deviceClass(null)).toBe("other");
    expect(deviceClass("SomethingElse/1.0")).toBe("other");
  });
});

describe("countryFromHeaders", () => {
  it("reads a two-letter code from CDN headers", () => {
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "ph" }))).toBe("PH");
    expect(countryFromHeaders(new Headers({ "x-vercel-ip-country": "US" }))).toBe("US");
  });

  it("ignores missing, unknown and malformed values", () => {
    expect(countryFromHeaders(new Headers())).toBeNull();
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "XX" }))).toBeNull();
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "Philippines" }))).toBeNull();
  });
});

describe("tap de-duplication", () => {
  const TEN_MIN = 10 * 60_000;

  it("counts a repeat from the same device inside 10 minutes once", () => {
    const d = createTapDedup(TEN_MIN);
    const key = dedupKey("card1", "1.2.3.4", IPHONE);
    expect(d.isDuplicate(key, 0)).toBe(false);
    expect(d.isDuplicate(key, TEN_MIN - 1)).toBe(true);
  });

  it("counts again once the window has passed", () => {
    const d = createTapDedup(TEN_MIN);
    const key = dedupKey("card1", "1.2.3.4", IPHONE);
    expect(d.isDuplicate(key, 0)).toBe(false);
    expect(d.isDuplicate(key, TEN_MIN)).toBe(false);
  });

  it("does not merge different cards or devices", () => {
    const d = createTapDedup(TEN_MIN);
    expect(d.isDuplicate(dedupKey("card1", "1.2.3.4", IPHONE), 0)).toBe(false);
    expect(d.isDuplicate(dedupKey("card2", "1.2.3.4", IPHONE), 1)).toBe(false);
    expect(d.isDuplicate(dedupKey("card1", "9.9.9.9", IPHONE), 2)).toBe(false);
    expect(d.isDuplicate(dedupKey("card1", "1.2.3.4", ANDROID), 3)).toBe(false);
  });

  it("keys are hashes that do not contain the IP", () => {
    const key = dedupKey("card1", "203.0.113.7", IPHONE);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("203");
  });
});
