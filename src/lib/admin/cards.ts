import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { generateCardCode } from "../card-code";
import { db } from "../db";
import { revalidatePage } from "../pages";
import { CARD_LABEL_MAX, MAX_CARDS_PER_PAGE } from "./card-urls";

export type CardResult = { ok: true; message?: string } | { ok: false; message: string };

const fail = (message: string): CardResult => ({ ok: false, message });

const labelSchema = z.string().trim().max(CARD_LABEL_MAX, `Use at most ${CARD_LABEL_MAX} characters`);
const statusSchema = z.enum(["ACTIVE", "DISABLED", "LOST"]);

const isCodeCollision = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError &&
  e.code === "P2002" &&
  String((e.meta as { target?: unknown } | undefined)?.target ?? "").includes("code");

/** Add a card (for example a spare) to a page. The code is random; on the rare collision another is drawn. */
export async function addCard(username: string, rawLabel: string): Promise<CardResult> {
  const label = labelSchema.safeParse(rawLabel);
  if (!label.success) return fail(label.error.issues[0].message);

  const page = await db.page.findUnique({ where: { username }, select: { id: true, _count: { select: { cards: true } } } });
  if (!page) return fail("That page no longer exists.");
  if (page._count.cards >= MAX_CARDS_PER_PAGE) return fail(`A page can have at most ${MAX_CARDS_PER_PAGE} cards.`);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const card = await db.card.create({ data: { pageId: page.id, code: generateCardCode(), label: label.data || null } });
      revalidatePage(username);
      return { ok: true, message: `Card ${card.code} added.` };
    } catch (e) {
      if (!isCodeCollision(e)) throw e;
    }
  }
  return fail("Could not generate a unique card code. Try again.");
}

async function findCard(cardId: string) {
  return db.card.findUnique({
    where: { id: cardId },
    select: { id: true, code: true, status: true, pageId: true, page: { select: { username: true } }, _count: { select: { taps: true } } },
  });
}

/** Rename a card and/or change its status (active, disabled, lost). Takes effect on the next tap. */
export async function updateCard(cardId: string, change: { label?: string; status?: string }): Promise<CardResult> {
  const data: { label?: string | null; status?: "ACTIVE" | "DISABLED" | "LOST" } = {};
  if (change.label !== undefined) {
    const label = labelSchema.safeParse(change.label);
    if (!label.success) return fail(label.error.issues[0].message);
    data.label = label.data || null;
  }
  if (change.status !== undefined) {
    const status = statusSchema.safeParse(change.status);
    if (!status.success) return fail("Unknown card status.");
    data.status = status.data;
  }
  if (Object.keys(data).length === 0) return { ok: true };

  const card = await findCard(cardId);
  if (!card) return fail("That card no longer exists.");
  await db.card.update({ where: { id: card.id }, data });
  revalidatePage(card.page.username);
  return { ok: true };
}

/**
 * Forget a card's taps: deletes them and clears its last-tapped time, then points the page's last-tapped
 * time at its latest remaining tap. Used after writing a chip, so the test taps do not count as the client's first use.
 */
export async function resetCardUsage(cardId: string): Promise<CardResult> {
  const card = await findCard(cardId);
  if (!card) return fail("That card no longer exists.");

  const removed = await db.$transaction(async (tx) => {
    const { count } = await tx.tap.deleteMany({ where: { cardId: card.id } });
    await tx.card.update({ where: { id: card.id }, data: { lastTapAt: null } });
    const latest = await tx.tap.aggregate({ where: { pageId: card.pageId }, _max: { createdAt: true } });
    await tx.page.update({ where: { id: card.pageId }, data: { lastTapAt: latest._max.createdAt } });
    return count;
  });
  revalidatePage(card.page.username);
  return {
    ok: true,
    message: removed === 0 ? "Usage cleared (there were no taps)." : `Usage cleared: ${removed} ${removed === 1 ? "tap" : "taps"} removed.`,
  };
}

/** Delete a card that was never used (a mistake). A used card is disabled instead, so its history stays. */
export async function deleteUnusedCard(cardId: string): Promise<CardResult> {
  const card = await findCard(cardId);
  if (!card) return fail("That card no longer exists.");
  if (card._count.taps > 0) return fail("This card has taps. Disable it instead, or reset its usage first.");
  await db.card.delete({ where: { id: card.id } });
  revalidatePage(card.page.username);
  return { ok: true, message: `Card ${card.code} deleted.` };
}
