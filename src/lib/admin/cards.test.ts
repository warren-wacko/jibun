import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const tx = {
    tap: { deleteMany: vi.fn(), aggregate: vi.fn() },
    card: { update: vi.fn() },
    page: { update: vi.fn() },
  };
  return {
    tx,
    page: { findUnique: vi.fn() },
    card: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };
});
const revalidatePage = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ db }));
vi.mock("../pages", () => ({ revalidatePage }));

import { Prisma } from "@/generated/prisma/client";
import { cardWarnings, chipUrl, qrTargetUrl } from "./card-urls";
import { addCard, deleteUnusedCard, resetCardUsage, updateCard } from "./cards";

const card = (over: Record<string, unknown> = {}) => ({
  id: "c1",
  code: "ABCDEFG",
  status: "ACTIVE",
  pageId: "p1",
  page: { username: "maria" },
  _count: { taps: 0 },
  ...over,
});

const codeCollision = () =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "test", meta: { target: ["code"] } });

beforeEach(() => {
  vi.clearAllMocks();
  db.page.findUnique.mockResolvedValue({ id: "p1", _count: { cards: 1 } });
  db.card.create.mockResolvedValue({ code: "NEWCODE" });
  db.card.findUnique.mockResolvedValue(card());
  db.card.update.mockResolvedValue({});
  db.card.delete.mockResolvedValue({});
  db.tx.tap.deleteMany.mockResolvedValue({ count: 3 });
  db.tx.tap.aggregate.mockResolvedValue({ _max: { createdAt: null } });
});

describe("urls", () => {
  it("writes the plain card link to the chip and flags the QR link", () => {
    expect(chipUrl("ABC")).toMatch(/\/c\/ABC$/);
    expect(qrTargetUrl("ABC")).toMatch(/\/c\/ABC\?src=qr$/);
  });
});

describe("cardWarnings", () => {
  it("warns when there is no card or no active card", () => {
    expect(cardWarnings([])[0]).toMatch(/no cards/);
    expect(cardWarnings([{ status: "LOST" }, { status: "DISABLED" }])[0]).toMatch(/No active card/);
  });
  it("is quiet when one card works", () => {
    expect(cardWarnings([{ status: "LOST" }, { status: "ACTIVE" }])).toEqual([]);
  });
});

describe("addCard", () => {
  it("adds a labelled card with a random code and expires the page cache", async () => {
    const r = await addCard("maria", "  Spare  ");
    expect(r).toEqual({ ok: true, message: "Card NEWCODE added." });
    const data = db.card.create.mock.calls[0][0].data;
    expect(data).toMatchObject({ pageId: "p1", label: "Spare" });
    expect(data.code).toMatch(/^[A-HJKMNP-Z2-9]{7}$/);
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("leaves the label empty when none is given", async () => {
    await addCard("maria", "   ");
    expect(db.card.create.mock.calls[0][0].data.label).toBeNull();
  });

  it("rejects a long label, an unknown page and a full page", async () => {
    expect((await addCard("maria", "x".repeat(41))).ok).toBe(false);
    db.page.findUnique.mockResolvedValueOnce(null);
    expect((await addCard("nobody", "")).ok).toBe(false);
    db.page.findUnique.mockResolvedValueOnce({ id: "p1", _count: { cards: 10 } });
    const full = await addCard("maria", "");
    expect(!full.ok && full.message).toMatch(/at most 10/);
    expect(db.card.create).not.toHaveBeenCalled();
  });

  it("draws another code on a collision, and stops after five", async () => {
    db.card.create.mockRejectedValueOnce(codeCollision()).mockResolvedValueOnce({ code: "OK" });
    expect((await addCard("maria", "")).ok).toBe(true);
    expect(db.card.create).toHaveBeenCalledTimes(2);

    db.card.create.mockReset();
    db.card.create.mockRejectedValue(codeCollision());
    expect((await addCard("maria", "")).ok).toBe(false);
    expect(db.card.create).toHaveBeenCalledTimes(5);
  });
});

describe("updateCard", () => {
  it.each(["ACTIVE", "DISABLED", "LOST"])("sets the status to %s and expires the page cache", async (status) => {
    expect((await updateCard("c1", { status })).ok).toBe(true);
    expect(db.card.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { status } });
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("renames, and clears the label when it is emptied", async () => {
    await updateCard("c1", { label: " Main PVC " });
    expect(db.card.update.mock.calls[0][0].data).toEqual({ label: "Main PVC" });
    await updateCard("c1", { label: "" });
    expect(db.card.update.mock.calls[1][0].data).toEqual({ label: null });
  });

  it("rejects an unknown status, and does nothing for an empty change", async () => {
    expect((await updateCard("c1", { status: "BROKEN" })).ok).toBe(false);
    expect((await updateCard("c1", {})).ok).toBe(true);
    expect(db.card.update).not.toHaveBeenCalled();
  });

  it("fails cleanly for a card that is gone", async () => {
    db.card.findUnique.mockResolvedValue(null);
    expect((await updateCard("gone", { status: "LOST" })).ok).toBe(false);
  });
});

describe("resetCardUsage", () => {
  it("deletes the card's taps, clears its last tap and recomputes the page's from what is left", async () => {
    const latest = new Date("2026-05-01T00:00:00Z");
    db.tx.tap.aggregate.mockResolvedValue({ _max: { createdAt: latest } });
    const r = await resetCardUsage("c1");
    expect(r).toEqual({ ok: true, message: "Usage cleared: 3 taps removed." });
    expect(db.tx.tap.deleteMany).toHaveBeenCalledWith({ where: { cardId: "c1" } });
    expect(db.tx.card.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { lastTapAt: null } });
    expect(db.tx.tap.aggregate).toHaveBeenCalledWith({ where: { pageId: "p1" }, _max: { createdAt: true } });
    expect(db.tx.page.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { lastTapAt: latest } });
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("clears the page's last tap when no taps remain", async () => {
    await resetCardUsage("c1");
    expect(db.tx.page.update.mock.calls[0][0].data).toEqual({ lastTapAt: null });
  });

  it("words a reset with nothing to remove, and a single tap, correctly", async () => {
    db.tx.tap.deleteMany.mockResolvedValue({ count: 0 });
    expect(await resetCardUsage("c1")).toMatchObject({ message: "Usage cleared (there were no taps)." });
    db.tx.tap.deleteMany.mockResolvedValue({ count: 1 });
    expect(await resetCardUsage("c1")).toMatchObject({ message: "Usage cleared: 1 tap removed." });
  });

  it("fails for a card that is gone", async () => {
    db.card.findUnique.mockResolvedValue(null);
    expect((await resetCardUsage("gone")).ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("deleteUnusedCard", () => {
  it("deletes a card with no taps", async () => {
    expect(await deleteUnusedCard("c1")).toEqual({ ok: true, message: "Card ABCDEFG deleted." });
    expect(db.card.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("keeps a card that has taps", async () => {
    db.card.findUnique.mockResolvedValue(card({ _count: { taps: 4 } }));
    const r = await deleteUnusedCard("c1");
    expect(!r.ok && r.message).toMatch(/has taps/);
    expect(db.card.delete).not.toHaveBeenCalled();
  });
});
