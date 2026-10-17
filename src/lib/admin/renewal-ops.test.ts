import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  page: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn(), findMany: vi.fn() },
  tap: { count: vi.fn() },
}));
const revalidatePage = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ db }));
vi.mock("../pages", () => ({ revalidatePage }));

import { getDashboard } from "./dashboard";
import { changeEdits, deactivatePage, renewPage, setReminderSent } from "./renewal-ops";

const NOW = new Date("2026-06-15T00:00:00Z");
const page = (over: Record<string, unknown> = {}) => ({
  id: "p1",
  username: "maria",
  status: "ACTIVE",
  paidUntil: new Date("2026-07-01T00:00:00Z"),
  editsUsed: 2,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.page.findUnique.mockResolvedValue(page());
  db.page.update.mockResolvedValue({});
  db.page.updateMany.mockResolvedValue({ count: 1 });
});

describe("setReminderSent", () => {
  it("records the time the reminder went out, or clears it", async () => {
    await setReminderSent("p1", true);
    expect(db.page.update.mock.calls[0][0].data.reminderSentAt).toBeInstanceOf(Date);
    await setReminderSent("p1", false);
    expect(db.page.update.mock.calls[1][0].data).toEqual({ reminderSentAt: null });
  });

  it("fails for a page that is gone", async () => {
    db.page.findUnique.mockResolvedValue(null);
    expect((await setReminderSent("gone", true)).ok).toBe(false);
    expect(db.page.update).not.toHaveBeenCalled();
  });
});

describe("renewPage", () => {
  it("adds 4 years to the current end, clears the reminder and expires the cache", async () => {
    const r = await renewPage("p1", NOW);
    expect(r).toEqual({ ok: true, message: "Renewed until July 1, 2030." });
    expect(db.page.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { paidUntil: new Date("2030-07-01T00:00:00Z"), reminderSentAt: null, status: "ACTIVE" },
    });
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("counts from today when the term has already lapsed, and turns an inactive page back on", async () => {
    db.page.findUnique.mockResolvedValue(page({ status: "INACTIVE", paidUntil: new Date("2025-01-01T00:00:00Z") }));
    await renewPage("p1", NOW);
    const data = db.page.update.mock.calls[0][0].data;
    expect(data.paidUntil).toEqual(new Date("2030-06-15T00:00:00Z"));
    expect(data.status).toBe("ACTIVE");
  });

  it("will not renew a draft", async () => {
    db.page.findUnique.mockResolvedValue(page({ status: "DRAFT", paidUntil: null }));
    expect((await renewPage("p1", NOW)).ok).toBe(false);
    expect(db.page.update).not.toHaveBeenCalled();
  });
});

describe("changeEdits", () => {
  it("adds one, removes one without going below zero, and resets", async () => {
    await changeEdits("p1", "add");
    expect(db.page.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { editsUsed: { increment: 1 } } });
    await changeEdits("p1", "remove");
    expect(db.page.updateMany).toHaveBeenCalledWith({ where: { id: "p1", editsUsed: { gt: 0 } }, data: { editsUsed: { decrement: 1 } } });
    await changeEdits("p1", "reset");
    expect(db.page.update).toHaveBeenLastCalledWith({ where: { id: "p1" }, data: { editsUsed: 0 } });
  });
});

describe("deactivatePage", () => {
  it("switches a page off and expires the cache", async () => {
    expect(await deactivatePage("p1")).toEqual({ ok: true, message: "/maria is now inactive." });
    expect(db.page.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { status: "INACTIVE" } });
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("does nothing for a page that is already inactive", async () => {
    db.page.findUnique.mockResolvedValue(page({ status: "INACTIVE" }));
    await deactivatePage("p1");
    expect(db.page.update).not.toHaveBeenCalled();
  });
});

describe("getDashboard", () => {
  it("counts live pages, taps in the last 7 days, usage groups and renewals", async () => {
    db.page.count.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
      if (where.paidUntil) return 4; // renewals (also status ACTIVE, so check this first)
      if (where.status === "ACTIVE") return 12;
      if (where.status === "DRAFT") return 3;
      return 1; // a usage group
    });
    db.tap.count.mockResolvedValue(57);
    db.page.findMany.mockResolvedValue([{ id: "p1", username: "maria", paidUntil: new Date("2026-06-20T00:00:00Z"), client: { name: "Maria" } }]);

    const d = await getDashboard(NOW);
    expect(d).toMatchObject({ activePages: 12, draftPages: 3, tapsThisWeek: 57, renewalsDue: 4 });
    expect(Object.keys(d.usage).sort()).toEqual(["active", "dormant", "never_used", "new", "quiet"]);
    expect(d.nextRenewals).toEqual([{ id: "p1", username: "maria", name: "Maria", paidUntil: new Date("2026-06-20T00:00:00Z") }]);

    expect(db.tap.count).toHaveBeenCalledWith({ where: { createdAt: { gte: new Date("2026-06-08T00:00:00Z") } } });
  });

  it("limits usage counts to live pages", async () => {
    db.page.count.mockResolvedValue(0);
    db.tap.count.mockResolvedValue(0);
    db.page.findMany.mockResolvedValue([]);
    await getDashboard(NOW);
    const usageCalls = db.page.count.mock.calls.map((c) => c[0].where).filter((w) => w.AND);
    expect(usageCalls).toHaveLength(5);
    for (const w of usageCalls) expect(w.AND).toContainEqual({ status: "ACTIVE" });
  });
});
