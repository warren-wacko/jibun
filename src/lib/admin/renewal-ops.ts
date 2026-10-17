import "server-only";
import { db } from "../db";
import { revalidatePage } from "../pages";
import { renewedUntil } from "../plan-term";

export type OpResult = { ok: true; message?: string } | { ok: false; message: string };

const fail = (message: string): OpResult => ({ ok: false, message });

const dateText = new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" });

const pick = { id: true, username: true, status: true, paidUntil: true, editsUsed: true } as const;
const findPage = (pageId: string) => db.page.findUnique({ where: { id: pageId }, select: pick });

/** Record that the renewal reminder was sent (or take the mark off again). */
export async function setReminderSent(pageId: string, sent: boolean): Promise<OpResult> {
  const page = await findPage(pageId);
  if (!page) return fail("That page no longer exists.");
  await db.page.update({ where: { id: page.id }, data: { reminderSentAt: sent ? new Date() : null } });
  return { ok: true };
}

/**
 * Renew: extends the paid term by another 4 years (from the current end, or from today when it has already
 * lapsed), clears the reminder mark, and makes the page live again if it had been switched off.
 */
export async function renewPage(pageId: string, now: Date = new Date()): Promise<OpResult> {
  const page = await findPage(pageId);
  if (!page) return fail("That page no longer exists.");
  if (page.status === "DRAFT") return fail("A draft page has no term to renew. Set it to Active with a paid-until date in the editor.");

  const paidUntil = renewedUntil(page.paidUntil, now);
  await db.page.update({ where: { id: page.id }, data: { paidUntil, reminderSentAt: null, status: "ACTIVE" } });
  revalidatePage(page.username);
  return { ok: true, message: `Renewed until ${dateText.format(paidUntil)}.` };
}

/** Count a small edit made for the client (+1), take one back (-1, never below 0), or start the count again (0). */
export async function changeEdits(pageId: string, action: "add" | "remove" | "reset"): Promise<OpResult> {
  const page = await findPage(pageId);
  if (!page) return fail("That page no longer exists.");
  if (action === "add") await db.page.update({ where: { id: page.id }, data: { editsUsed: { increment: 1 } } });
  else if (action === "remove") await db.page.updateMany({ where: { id: page.id, editsUsed: { gt: 0 } }, data: { editsUsed: { decrement: 1 } } });
  else await db.page.update({ where: { id: page.id }, data: { editsUsed: 0 } });
  return { ok: true };
}

/** Switch a page off (visitors see the inactive page). Turn it back on by renewing or in the editor. */
export async function deactivatePage(pageId: string): Promise<OpResult> {
  const page = await findPage(pageId);
  if (!page) return fail("That page no longer exists.");
  if (page.status === "INACTIVE") return { ok: true };
  await db.page.update({ where: { id: page.id }, data: { status: "INACTIVE" } });
  revalidatePage(page.username);
  return { ok: true, message: `/${page.username} is now inactive.` };
}
