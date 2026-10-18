import { describe, expect, it } from "vitest";
import { OrderSchema, buildOrderLink, decodeOrder, encodeOrder, orderMessage, parseOrderLink, type Order } from "./order";

const order = (over: Partial<Order> = {}): Order =>
  OrderSchema.parse({
    v: 1,
    plan: "standard",
    addOns: ["gallery", "booking"],
    name: "Eva Reyes",
    nickname: "Eva",
    title: "Designer",
    phone: "0917 123 4567",
    email: "eva@example.com",
    socials: [{ type: "instagram", handle: "eva.designs", url: "" }],
    template: "social-bento",
    accent: "cobalt",
    sections: [{ kind: "skills", text: "Figma\nPrototyping" }],
    note: "Mag-ingat po sa spelling ng pangalan: Reyes",
    ...over,
  });

describe("order code", () => {
  it("round-trips, including accents and emoji", () => {
    const o = order({ bio: "Kape ☕ at café, pwede po ba? Ñandú 日本" });
    const r = decodeOrder(encodeOrder(o));
    expect(r.ok && r.order).toEqual(o);
  });

  it("is found inside a longer message, even when the chat app wraps it onto several lines", () => {
    const code = encodeOrder(order());
    const wrapped = code.replace(/(.{40})/g, "$1\n");
    const r = decodeOrder(`Hello po!\n${orderMessage(order()).split("\n")[0]}\n\n${wrapped}\n\nThank you`);
    expect(r.ok).toBe(true);
  });

  it("reads the code out of the message the form produces", () => {
    const msg = orderMessage(order());
    expect(msg).toContain("Plan: Standard + Photo gallery, Booking button");
    expect(msg).toContain("Name: Eva Reyes (Eva)");
    const r = decodeOrder(msg);
    expect(r.ok && r.order.name).toBe("Eva Reyes");
  });

  it("explains a missing, cut-off or tampered code", () => {
    expect(decodeOrder("just some text")).toMatchObject({ ok: false, message: expect.stringMatching(/No order code/) });
    const code = encodeOrder(order());
    expect(decodeOrder(code.slice(0, 30))).toMatchObject({ ok: false, message: expect.stringMatching(/cut off/) });
    expect(decodeOrder(code.slice(0, 40) + "AAAA" + code.slice(44))).toMatchObject({ ok: false });
    const bad = "JB1." + Buffer.from(JSON.stringify({ v: 1, plan: "premium", name: "x" })).toString("base64url") + ".";
    expect(decodeOrder(bad)).toMatchObject({ ok: false, message: expect.stringMatching(/not valid/) });
  });
});

describe("OrderSchema", () => {
  it("needs a name and a known plan, and caps what a client can send", () => {
    expect(OrderSchema.safeParse({ v: 1, plan: "starter", name: "" }).success).toBe(false);
    expect(OrderSchema.safeParse({ v: 1, plan: "starter", name: "A", bio: "x".repeat(601) }).success).toBe(false);
    expect(OrderSchema.safeParse({ v: 1, plan: "starter", name: "A", socials: Array.from({ length: 13 }, () => ({ type: "x", handle: "a" })) }).success).toBe(false);
    expect(OrderSchema.safeParse({ v: 1, plan: "starter", name: "A", addOns: ["free_money"] }).success).toBe(false);
  });

  it("fills in sensible defaults", () => {
    const o = OrderSchema.parse({ v: 1, plan: "starter", name: "A" });
    expect(o).toMatchObject({ addOns: [], showPhone: true, theme: "light", socials: [], sections: [], note: "" });
  });
});

describe("the link you send", () => {
  it("builds and reads a link for a plan with add-ons", () => {
    const link = buildOrderLink("https://jibun.example/", { plan: "standard", addOns: ["gallery", "video"], template: "pro-classic" });
    expect(link).toBe("https://jibun.example/order?plan=standard&addons=gallery%2Cvideo&template=pro-classic");
    const q = Object.fromEntries(new URL(link).searchParams);
    expect(parseOrderLink(q)).toEqual({ plan: "standard", addOns: ["gallery", "video"], template: "pro-classic" });
  });

  it("starter with nothing extra is just /order", () => {
    expect(buildOrderLink("https://jibun.example", { plan: "starter" })).toBe("https://jibun.example/order");
  });

  it("ignores anything unknown or mistyped instead of failing", () => {
    expect(parseOrderLink({ plan: "PREMIUM", addons: "gallery,nope,gallery", template: "x" })).toEqual({ plan: "starter", addOns: ["gallery"], template: "" });
    expect(parseOrderLink({ plan: "Standard" }).plan).toBe("standard");
    expect(parseOrderLink({})).toEqual({ plan: "starter", addOns: [], template: "" });
  });
});
