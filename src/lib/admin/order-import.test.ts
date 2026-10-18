import { describe, expect, it } from "vitest";
import { OrderSchema, type Order } from "../order";
import { validateForm } from "./page-form";
import { orderToFormValues } from "./order-import";

let n = 0;
const id = () => `id${++n}`;

const order = (over: Record<string, unknown> = {}): Order =>
  OrderSchema.parse({
    v: 1,
    plan: "standard",
    addOns: ["gallery", "video", "booking"],
    name: "Eva Reyes",
    title: "Designer",
    company: "Northwind",
    phone: "0917 123 4567",
    email: "eva@example.com",
    showPhone: false,
    socials: [
      { type: "instagram", handle: "eva.designs", url: "" },
      { type: "linkedin", handle: "evareyes", url: "https://www.linkedin.com/in/evareyes" },
    ],
    featured: { label: "My portfolio", url: "https://example.com/eva" },
    template: "social-bento",
    theme: "dark",
    accent: "#ff5a2e",
    sections: [
      { kind: "skills", text: "Figma, Prototyping, Research" },
      { kind: "services", text: "Logo design from 3000\nBrand kit" },
    ],
    videoUrl: "https://youtu.be/abc",
    bookingUrl: "https://cal.com/eva",
    note: "Please use my nickname Eva",
    ...over,
  });

describe("orderToFormValues", () => {
  it("fills in the account, page and profile", () => {
    const { values: v } = orderToFormValues(order(), id);
    expect(v).toMatchObject({
      clientName: "Eva Reyes",
      contactEmail: "eva@example.com",
      tier: "STANDARD",
      templateKey: "social-bento",
      username: "eva-reyes",
      fullName: "Eva Reyes",
      title: "Designer",
      company: "Northwind",
      phone: "+639171234567",
      showPhoneNumbers: false,
      theme: "dark",
      accent: "#ff5a2e",
      status: "DRAFT",
    });
    expect(v.addOns).toEqual(["gallery", "video", "booking"]);
    expect(v.socials.map((s) => [s.type, s.handle])).toEqual([["instagram", "eva.designs"], ["linkedin", "evareyes"]]);
    expect(v.featuredUrl).toBe("https://example.com/eva");
  });

  it("turns the chosen sections into drafts: lists fill in, row-style ones go to the notes", () => {
    const { values: v, notes } = orderToFormValues(order(), id);
    const kinds = v.sections.map((s) => s.kind);
    expect(kinds).toEqual(["skills", "services", "video", "booking", "gallery"]);
    expect(v.sections[0].text).toBe("Figma\nPrototyping\nResearch");
    expect(v.sections.find((s) => s.kind === "video")?.url).toBe("https://youtu.be/abc");
    expect(v.sections.find((s) => s.kind === "booking")?.url).toBe("https://cal.com/eva");
    expect(v.notes).toContain("Client note: Please use my nickname Eva");
    expect(v.notes).toContain("Services: Logo design from 3000");
    expect(notes.join(" ")).toMatch(/Gallery: ask the client to send the photos/);
    expect(notes.join(" ")).toMatch(/Photo and logo/);
  });

  it("produces a form that passes the same checks as typing it in", () => {
    const { values } = orderToFormValues(order(), id);
    const r = validateForm(values, { requireUsername: true });
    // the only things left to do are the blank rows of the services section and the gallery images
    const fields = Object.keys(r.errors);
    expect(fields.every((f) => f.startsWith("sections."))).toBe(true);
  });

  it("flags a custom colour on a Starter plan", () => {
    const { values, notes } = orderToFormValues(order({ plan: "starter", addOns: [], sections: [] }), id);
    expect(values.tier).toBe("STARTER");
    expect(notes.join(" ")).toMatch(/needs Standard/);
  });

  it("keeps a preset colour and falls back to the default design for an unknown template", () => {
    const { values } = orderToFormValues(order({ accent: "cobalt", template: "made-up" }), id);
    expect(values.accent).toBe("cobalt");
    expect(values.templateKey).toBe("pro-classic");
  });

  it("carries the student details", () => {
    const { values } = orderToFormValues(order({ student: { school: "CvSU", program: "BSIT", year: "4th year", graduating: "May 2027", openTo: "Internships" } }), id);
    expect(values).toMatchObject({ school: "CvSU", program: "BSIT", year: "4th year", graduating: "May 2027", openTo: "Internships" });
  });

  it("takes a song link out of free text", () => {
    const { values } = orderToFormValues(order({ sections: [{ kind: "song", text: "my fave https://open.spotify.com/track/xyz thanks" }] }), id);
    expect(values.sections[0]).toMatchObject({ kind: "song", url: "https://open.spotify.com/track/xyz" });
  });
});
