import { db } from "./db";
import { dedupKey, deviceClass, isBot, tapDedup, type TapSource } from "./tap";

export type TapInput = {
  cardId: string;
  pageId: string;
  source: TapSource;
  userAgent: string | null;
  ip: string;
  country: string | null;
};

/**
 * Record a tap and set lastTapAt on the card and its page. Runs after the redirect has been
 * sent, never throws, and writes no IP (Tap.userAgent holds a coarse device class only).
 * Returns whether a row was written.
 */
export async function recordTap(input: TapInput): Promise<boolean> {
  try {
    if (isBot(input.userAgent)) return false;
    if (tapDedup.isDuplicate(dedupKey(input.cardId, input.ip, input.userAgent))) return false;

    const now = new Date();
    await db.$transaction([
      db.tap.create({
        data: {
          cardId: input.cardId,
          pageId: input.pageId,
          source: input.source,
          userAgent: deviceClass(input.userAgent),
          country: input.country,
          createdAt: now,
        },
      }),
      db.card.update({ where: { id: input.cardId }, data: { lastTapAt: now } }),
      db.page.update({ where: { id: input.pageId }, data: { lastTapAt: now } }),
    ]);
    return true;
  } catch (error) {
    console.error("tap logging failed", error);
    return false;
  }
}
