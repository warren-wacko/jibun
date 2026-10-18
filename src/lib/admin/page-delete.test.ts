import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const tx = {
    tap: { deleteMany: vi.fn() },
    tierChange: { deleteMany: vi.fn() },
    customDomain: { deleteMany: vi.fn() },
    card: { deleteMany: vi.fn() },
    page: { delete: vi.fn() },
    client: { delete: vi.fn() },
  };
  return { tx, page: { findUnique: vi.fn() }, $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)) };
});
const revalidatePage = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ db }));
vi.mock("../pages", () => ({ revalidatePage }));

import { deletePage } from "./page-delete";

const page = (client: Record<string, unknown> = {}) => ({
  id: "p1",
  clientId: "c1",
  client: { name: "Eva", user: null, _count: { pages: 1 }, ...client },
});

beforeEach(() => {
  vi.clearAllMocks();
  db.page.findUnique.mockResolvedValue(page());
});

describe("deletePage", () => {
  it("needs the username typed exactly, and touches nothing otherwise", async () => {
    const r = await deletePage("maria", "mari");
    expect(r.ok).toBe(false);
    expect(db.page.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("accepts the username in any case and ignores spaces around it", async () => {
    expect((await deletePage("maria", "  MARIA ")).ok).toBe(true);
  });

  it("removes the taps, tier changes, domains, cards, page and (when it was their only page) the client, in that order", async () => {
    const order: string[] = [];
    for (const [k, v] of Object.entries(db.tx)) for (const m of Object.values(v)) m.mockImplementation(async () => void order.push(k));
    const r = await deletePage("maria", "maria");
    expect(r).toMatchObject({ ok: true });
    expect(order).toEqual(["tap", "tierChange", "customDomain", "card", "page", "client"]);
    expect(db.tx.tap.deleteMany).toHaveBeenCalledWith({ where: { pageId: "p1" } });
    expect(db.tx.client.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("keeps the client when they have other pages", async () => {
    db.page.findUnique.mockResolvedValue(page({ _count: { pages: 2 } }));
    const r = await deletePage("maria", "maria");
    expect(r).toMatchObject({ ok: true });
    expect(db.tx.client.delete).not.toHaveBeenCalled();
    expect(db.tx.page.delete).toHaveBeenCalled();
  });

  it("keeps a client who has a login", async () => {
    db.page.findUnique.mockResolvedValue(page({ user: { id: "u1" } }));
    await deletePage("maria", "maria");
    expect(db.tx.client.delete).not.toHaveBeenCalled();
  });

  it("says so when the page is already gone", async () => {
    db.page.findUnique.mockResolvedValue(null);
    expect(await deletePage("maria", "maria")).toEqual({ ok: false, message: "That page no longer exists." });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
