import "server-only";
import { db } from "../db";
import { revalidatePage } from "../pages";

export type DeleteResult = { ok: true; message: string } | { ok: false; message: string };

/** What deleting a page removes, so the admin can see it before confirming. */
export type DeleteSummary = { cards: number; taps: number; clientName: string; clientRemoved: boolean };

/**
 * Delete a page for good: its taps, cards, tier changes and domains, then the page itself. The client goes too
 * when this was their only page and they have no login. The admin must type the username to confirm (checked
 * here, not only in the form). Used when someone backs out of an order.
 */
export async function deletePage(username: string, confirmation: string): Promise<DeleteResult> {
  const name = username.trim().toLowerCase();
  if (confirmation.trim().toLowerCase() !== name) return { ok: false, message: "Type the page username exactly to confirm." };

  const page = await db.page.findUnique({
    where: { username: name },
    select: { id: true, clientId: true, client: { select: { name: true, user: { select: { id: true } }, _count: { select: { pages: true } } } } },
  });
  if (!page) return { ok: false, message: "That page no longer exists." };

  const removeClient = page.client._count.pages <= 1 && !page.client.user;
  await db.$transaction(async (tx) => {
    await tx.tap.deleteMany({ where: { pageId: page.id } });
    await tx.tierChange.deleteMany({ where: { pageId: page.id } });
    await tx.customDomain.deleteMany({ where: { pageId: page.id } });
    await tx.card.deleteMany({ where: { pageId: page.id } });
    await tx.page.delete({ where: { id: page.id } });
    if (removeClient) await tx.client.delete({ where: { id: page.clientId } });
  });
  revalidatePage(name);
  return { ok: true, message: removeClient ? `Deleted /${name} and ${page.client.name}.` : `Deleted /${name}. The client has other pages, so they were kept.` };
}
