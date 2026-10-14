import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db } from "./db";
import type { Tier } from "./entitlements";
import { canDownload, canViewPage } from "./page-access";
import { parsePageData, type PageData } from "./page-schema";
import { validateUsername } from "./usernames";

/** Plain, serializable view of a page, safe to hold in the Next.js cache. */
export type PublicPage = {
  username: string;
  tier: Tier;
  templateKey: string;
  addOns: string[];
  data: PageData;
  /** Code of the page's first ACTIVE card; the QR encodes this card's URL. */
  cardCode: string | null;
  /** May visitors see the page? (ACTIVE and in term, or DRAFT for preview.) */
  canView: boolean;
  /** May the vCard and QR be served? (paid, ACTIVE pages only.) */
  canDownload: boolean;
};

export const pageTag = (username: string) => `page:${username}`;

/**
 * Cached lookup for public routes. The entry lives for about an hour and is expired at once by
 * revalidatePage(), so most visits never touch the database. The paid-term check runs inside the
 * cache (render code cannot read the clock), so a term that lapses is noticed within the hour.
 * Returns null for an unknown or malformed username.
 */
export async function getPublicPage(rawUsername: string): Promise<PublicPage | null> {
  "use cache";
  cacheLife("hours");

  const username = rawUsername.toLowerCase();
  cacheTag(pageTag(username));
  if (!validateUsername(username).ok) return null;

  const row = await db.page.findUnique({
    where: { username },
    include: { cards: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!row) return null;

  const now = new Date();
  return {
    username: row.username,
    tier: row.tier,
    templateKey: row.templateKey,
    addOns: row.addOns,
    // Page.data is validated on read as well as on write.
    data: parsePageData(row.data),
    cardCode: row.cards[0]?.code ?? null,
    canView: canViewPage(row, now),
    canDownload: canDownload(row, now),
  };
}

/** Call after the admin saves a page, changes its cards, or renews it. Expires the cache entry immediately. */
export function revalidatePage(username: string) {
  revalidateTag(pageTag(username.toLowerCase()), { expire: 0 });
}
