import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  page: { findUnique: vi.fn(), update: vi.fn() },
  client: { create: vi.fn() },
  tierChange: { create: vi.fn() },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}));
const revalidatePage = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("../db", () => ({ db }));
vi.mock("../pages", () => ({ revalidatePage }));

import { Prisma } from "@/generated/prisma/client";
import { emptyFormValues, type FormValues } from "./page-form";
import { savePage } from "./page-save";

const values = (over: Partial<FormValues> = {}): FormValues => ({
  ...emptyFormValues(),
  clientName: "Maria Santos",
  username: "maria-s",
  fullName: "Maria Santos",
  ...over,
});

const uniqueViolation = (target: string) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "test", meta: { target: [target] } });

beforeEach(() => {
  vi.clearAllMocks();
  db.page.findUnique.mockResolvedValue(null);
  db.client.create.mockResolvedValue({});
  db.page.update.mockResolvedValue({});
  db.tierChange.create.mockResolvedValue({});
});

describe("savePage: validation", () => {
  it("rejects input that is not form-shaped, without touching the database", async () => {
    const r = await savePage({ clientName: 5 });
    expect(r.ok).toBe(false);
    expect(db.client.create).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid values and saves nothing", async () => {
    const r = await savePage(values({ fullName: "", accent: "#123456" }));
    expect(r).toMatchObject({ ok: false });
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["accent", "fullName"]);
    expect(db.client.create).not.toHaveBeenCalled();
    expect(revalidatePage).not.toHaveBeenCalled();
  });

  it("enforces the tier on the server even if the client skipped its checks", async () => {
    const r = await savePage(values({ tier: "STARTER", fontPair: "serif-sans" }));
    expect(!r.ok && r.errors.fontPair).toBeTruthy();
  });
});

describe("savePage: create", () => {
  it("creates the client, the page and the first card together, then expires the cache", async () => {
    const r = await savePage(
      values({ tier: "STANDARD", accent: "#123456", status: "ACTIVE", paidUntil: "2030-01-31", phone: "0917 123 4567", socials: [{ id: "a", type: "instagram", handle: "@maria", url: "", note: "" }] }),
    );
    expect(r).toEqual({ ok: true, username: "maria-s", created: true });

    const arg = db.client.create.mock.calls[0][0].data;
    expect(arg).toMatchObject({ name: "Maria Santos", contactEmail: null, notes: null });
    const page = arg.pages.create;
    expect(page).toMatchObject({ username: "maria-s", tier: "STANDARD", templateKey: "pro-classic", status: "ACTIVE" });
    expect(page.paidUntil.toISOString()).toBe("2030-01-31T00:00:00.000Z");
    expect(page.cards.create.code).toMatch(/^[A-HJKMNP-Z2-9]{7}$/);
    expect(page.cards.create.label).toBe("Main");
    // Stored content is validated PageData: phone in E.164, link built from the handle, no undefined keys.
    expect(page.data.contact.phone).toBe("+639171234567");
    expect(page.data.socials).toEqual([{ type: "instagram", handle: "@maria", url: "https://www.instagram.com/maria" }]);
    expect("bio" in page.data.profile).toBe(false);
    expect(revalidatePage).toHaveBeenCalledWith("maria-s");
  });

  it("refuses a username that is already taken", async () => {
    db.page.findUnique.mockResolvedValue({ id: "x" });
    const r = await savePage(values());
    expect(!r.ok && r.errors.username).toMatch(/taken/);
    expect(db.client.create).not.toHaveBeenCalled();
  });

  it("handles losing a username race at insert time", async () => {
    db.client.create.mockRejectedValue(uniqueViolation("username"));
    const r = await savePage(values());
    expect(!r.ok && r.errors.username).toMatch(/taken/);
  });

  it("draws a new card code when one collides", async () => {
    db.client.create.mockRejectedValueOnce(uniqueViolation("code")).mockResolvedValueOnce({});
    const r = await savePage(values());
    expect(r.ok).toBe(true);
    expect(db.client.create).toHaveBeenCalledTimes(2);
    const codes = db.client.create.mock.calls.map((c) => c[0].data.pages.create.cards.create.code);
    expect(codes[0]).not.toBe(codes[1]);
  });

  it("gives up after repeated code collisions instead of looping", async () => {
    db.client.create.mockRejectedValue(uniqueViolation("code"));
    const r = await savePage(values());
    expect(r.ok).toBe(false);
    expect(db.client.create).toHaveBeenCalledTimes(5);
  });

  it("rethrows unexpected database errors", async () => {
    db.client.create.mockRejectedValue(new Error("connection lost"));
    await expect(savePage(values())).rejects.toThrow("connection lost");
  });
});

describe("savePage: edit", () => {
  it("updates the page and its client, ignores the username in the form, and expires the cache", async () => {
    db.page.findUnique.mockResolvedValue({ id: "page1", tier: "STARTER" });
    const r = await savePage(values({ username: "somebody-else", title: "Designer" }), "maria");
    expect(r).toEqual({ ok: true, username: "maria", created: false });
    const call = db.page.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "page1" });
    expect(call.data.client.update.name).toBe("Maria Santos");
    expect(call.data.data.profile.title).toBe("Designer");
    expect(call.data).not.toHaveProperty("username");
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("does not need a valid username when editing", async () => {
    db.page.findUnique.mockResolvedValue({ id: "page1", tier: "STARTER" });
    expect((await savePage(values({ username: "" }), "maria")).ok).toBe(true);
  });

  it("fails cleanly when the page was deleted meanwhile", async () => {
    db.page.findUnique.mockResolvedValue(null);
    const r = await savePage(values(), "gone");
    expect(r.ok).toBe(false);
    expect(db.page.update).not.toHaveBeenCalled();
  });
});

describe("savePage: tier changes", () => {
  const upgrade = () => values({ tier: "STANDARD" });

  it("refuses a tier change without the amount paid, and saves nothing", async () => {
    db.page.findUnique.mockResolvedValue({ id: "page1", tier: "STARTER" });
    const r = await savePage(upgrade(), "maria");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors.tierAmount).toBeTruthy();
    expect(db.page.update).not.toHaveBeenCalled();
    expect(db.tierChange.create).not.toHaveBeenCalled();
  });

  it("refuses an invalid amount", async () => {
    db.page.findUnique.mockResolvedValue({ id: "page1", tier: "STARTER" });
    const r = await savePage(upgrade(), "maria", { amountPaid: -5, reprint: false });
    expect(r.ok).toBe(false);
    expect(db.page.update).not.toHaveBeenCalled();
  });

  it("saves the page and records the change in one transaction", async () => {
    db.page.findUnique.mockResolvedValue({ id: "page1", tier: "STARTER" });
    const r = await savePage(upgrade(), "maria", { amountPaid: 800, reprint: true, note: "GCash" });
    expect(r).toEqual({ ok: true, username: "maria", created: false });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.page.update.mock.calls[0][0].data.tier).toBe("STANDARD");
    expect(db.tierChange.create).toHaveBeenCalledWith({
      data: { pageId: "page1", fromTier: "STARTER", toTier: "STANDARD", amountPaid: 800, reprint: true, note: "GCash" },
    });
    expect(revalidatePage).toHaveBeenCalledWith("maria");
  });

  it("records nothing when the tier is unchanged, even if a change was sent", async () => {
    db.page.findUnique.mockResolvedValue({ id: "page1", tier: "STARTER" });
    await savePage(values(), "maria", { amountPaid: 800, reprint: true });
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(db.tierChange.create).not.toHaveBeenCalled();
  });

  it("still checks the content against the new tier (a custom colour needs Standard)", async () => {
    db.page.findUnique.mockResolvedValue({ id: "page1", tier: "STANDARD" });
    const r = await savePage(values({ tier: "STARTER", accent: "#123456" }), "maria", { amountPaid: 0, reprint: false });
    expect(!r.ok && r.errors.accent).toBeTruthy();
    expect(db.tierChange.create).not.toHaveBeenCalled();
  });
});
