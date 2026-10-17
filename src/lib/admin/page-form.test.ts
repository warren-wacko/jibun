import { describe, expect, it } from "vitest";
import { TEMPLATE_KEYS } from "@/templates/keys";
import { registeredTemplateKeys } from "@/templates/registry";
import { SAMPLE_PAGE_DATA } from "../sample-data";
import { normalizePhone } from "../phone";
import {
  emptyFormValues,
  isBlankSocial,
  parseDateInput,
  resolveSocialUrl,
  validateForm,
  valuesFromPage,
  valuesToCandidate,
  type FormValues,
} from "./page-form";

const valid = (over: Partial<FormValues> = {}): FormValues => ({
  ...emptyFormValues(),
  clientName: "Maria Santos",
  username: "maria-s",
  fullName: "Maria Santos",
  ...over,
});

describe("normalizePhone", () => {
  it.each([
    ["0917 123 4567", "+639171234567"],
    ["+63 917-123-4567", "+639171234567"],
    ["9171234567", "+639171234567"],
    ["639171234567", "+639171234567"],
    ["0063 917 123 4567", "+639171234567"],
    ["+1 415 555 0100", "+14155550100"],
    ["", ""],
  ])("%s -> %s", (input, out) => expect(normalizePhone(input)).toBe(out));

  it("leaves nonsense as bare digits so validation rejects it", () => {
    expect(normalizePhone("12-34")).toBe("1234");
  });
});

describe("template keys", () => {
  it("lists exactly the templates that are registered (besides the placeholder)", () => {
    expect([...TEMPLATE_KEYS].sort()).toEqual(registeredTemplateKeys().filter((k) => k !== "placeholder").sort());
  });
});

describe("validateForm: a minimal Starter page", () => {
  it("is valid with a name, a username and a client", () => {
    const r = validateForm(valid());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.profile.fullName).toBe("Maria Santos");
      expect(r.data.socials).toEqual([]);
      expect(r.data.style).toMatchObject({ theme: "light", accent: "blue" });
    }
  });

  it("drops empty optional fields instead of storing empty strings", () => {
    const r = validateForm(valid({ title: "  ", bio: "" }));
    expect(r.ok && r.data.profile).toEqual({ fullName: "Maria Santos" });
  });

  it("requires a client name, a full name and a valid username", () => {
    const r = validateForm(valid({ clientName: "", fullName: " ", username: "Ab" }));
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(["clientName", "fullName", "username"]);
    expect(r.errors.fullName).toBe("Full name is required");
  });

  it("rejects reserved usernames", () => {
    expect(validateForm(valid({ username: "admin" })).errors.username).toMatch(/reserved/);
  });

  it("can skip the username check (editing never changes it)", () => {
    expect(validateForm(valid({ username: "" }), { requireUsername: false }).ok).toBe(true);
  });
});

describe("validateForm: fields", () => {
  it("normalises a Philippine phone number and keeps sms only with a phone", () => {
    const r = validateForm(valid({ phone: "0917 123 4567", sms: true }));
    expect(r.ok && r.data.contact).toMatchObject({ phone: "+639171234567", sms: true });
    const none = validateForm(valid({ phone: "", sms: true }));
    expect(none.ok && none.data.contact.sms).toBeUndefined();
  });

  it("reports a bad phone, email and photo link next to their fields", () => {
    const r = validateForm(valid({ phone: "123", email: "nope", photoUrl: "ftp://x" }));
    expect(r.errors.phone).toBeTruthy();
    expect(r.errors.email).toBe("Enter a valid email address");
    expect(r.errors.photoUrl).toBeTruthy();
  });

  it("reports an over-long field with its limit", () => {
    expect(validateForm(valid({ displayName: "x".repeat(31) })).errors.displayName).toBe("Too long (at most 30 characters)");
  });

  it("builds the student block only when something is filled", () => {
    const none = validateForm(valid());
    expect(none.ok && none.data.profile.student).toBeUndefined();
    const r = validateForm(valid({ school: "CvSU", program: "BSIT" }));
    expect(r.ok && r.data.profile.student).toEqual({ school: "CvSU", program: "BSIT" });
  });

  it("needs both halves of the featured link", () => {
    expect(validateForm(valid({ featuredLabel: "View my work" })).errors.featuredUrl).toBeTruthy();
    expect(validateForm(valid({ featuredUrl: "https://example.com" })).errors.featuredLabel).toBe("Button text is required");
    const r = validateForm(valid({ featuredLabel: "View my work", featuredUrl: "https://example.com", featuredIcon: "website" }));
    expect(r.ok && r.data.featuredLink).toEqual({ label: "View my work", url: "https://example.com", icon: "website" });
  });
});

describe("social links", () => {
  const row = (over: Partial<FormValues["socials"][number]>) => ({ id: "x", type: "instagram" as const, handle: "", url: "", note: "", ...over });

  it("builds the link from the handle", () => {
    expect(resolveSocialUrl(row({ handle: "@maria" }))).toBe("https://www.instagram.com/maria");
    const r = validateForm(valid({ socials: [row({ handle: "@maria" })] }));
    expect(r.ok && r.data.socials).toEqual([{ type: "instagram", handle: "@maria", url: "https://www.instagram.com/maria" }]);
  });

  it("prefers a typed link and uses it for the handle when none is given", () => {
    const r = validateForm(valid({ socials: [row({ type: "website", url: "https://www.maria.dev/" })] }));
    expect(r.ok && r.data.socials[0]).toEqual({ type: "website", handle: "maria.dev", url: "https://www.maria.dev/" });
  });

  it("ignores blank rows", () => {
    expect(isBlankSocial(row({}))).toBe(true);
    const r = validateForm(valid({ socials: [row({}), row({ handle: "maria" })] }));
    expect(r.ok && r.data.socials).toHaveLength(1);
  });

  it("asks for a link when it cannot be built, and points at the right row", () => {
    const r = validateForm(valid({ socials: [row({}), row({ handle: "maria" }), row({ type: "website", handle: "my site" })] }));
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors)).toEqual(["socials.2.url"]);
  });

  it("keeps the order and the tile note", () => {
    const r = validateForm(valid({ socials: [row({ type: "tiktok", handle: "m", note: "edits" }), row({ handle: "m" })] }));
    expect(r.ok && r.data.socials.map((s) => s.type)).toEqual(["tiktok", "instagram"]);
    expect(r.ok && r.data.socials[0].note).toBe("edits");
  });

  it("rejects more than 30", () => {
    const rows = Array.from({ length: 31 }, (_, i) => row({ handle: `m${i}` }));
    expect(validateForm(valid({ socials: rows })).errors.socials).toMatch(/Too long/);
  });
});

describe("validateForm: what the tier allows", () => {
  it("lets Starter use preset colours only", () => {
    expect(validateForm(valid({ accent: "tomato" })).ok).toBe(true);
    expect(validateForm(valid({ accent: "#123456" })).errors.accent).toMatch(/preset/);
  });

  it("lets Standard and Custom use any hex, but not a malformed one", () => {
    expect(validateForm(valid({ tier: "STANDARD", accent: "#123456" })).ok).toBe(true);
    expect(validateForm(valid({ tier: "CUSTOM", accent: "#abc" })).ok).toBe(true);
    expect(validateForm(valid({ tier: "STANDARD", accent: "#12345" })).errors.accent).toBeTruthy();
  });

  it("allows font pairs from Standard up, and a banner on Custom only", () => {
    expect(validateForm(valid({ fontPair: "serif-sans" })).errors.fontPair).toBeTruthy();
    expect(validateForm(valid({ tier: "STANDARD", fontPair: "editorial" })).ok).toBe(true);
    // a pair has to belong to the chosen template
    expect(validateForm(valid({ tier: "STANDARD", fontPair: "executive" })).errors.fontPair).toMatch(/not available/);
    expect(validateForm(valid({ tier: "STANDARD", templateKey: "social-bento", fontPair: "editorial" })).errors.fontPair).toMatch(/not available/);
    expect(validateForm(valid({ tier: "CUSTOM", templateKey: "custom-maria", fontPair: "anything-goes" })).ok).toBe(true);
    expect(validateForm(valid({ tier: "STANDARD", bannerUrl: "https://x.test/b.jpg" })).errors.bannerUrl).toBeTruthy();
    expect(validateForm(valid({ tier: "CUSTOM", bannerUrl: "https://x.test/b.jpg" })).ok).toBe(true);
  });

  it("allows a custom-[slug] template on Custom only", () => {
    expect(validateForm(valid({ templateKey: "custom-maria" })).errors.templateKey).toBeTruthy();
    expect(validateForm(valid({ tier: "CUSTOM", templateKey: "custom-maria" })).ok).toBe(true);
    expect(validateForm(valid({ tier: "CUSTOM", templateKey: "nope" })).errors.templateKey).toBeTruthy();
  });

  it("checks sections against the tier", () => {
    const section = { id: "s1", kind: "skills" as const, items: [], text: "Figma", url: "", label: "" };
    expect(validateForm(valid({ sections: [section] })).errors.sections).toBeTruthy(); // Starter has no free picks
    expect(validateForm(valid({ tier: "STANDARD", sections: [section] })).ok).toBe(true);
  });

  it("rejects unknown add-ons", () => {
    expect(validateForm(valid({ addOns: ["gallery", "jetpack"] })).errors.addOns).toMatch(/jetpack/);
  });
});

describe("status and paid-until", () => {
  it("needs a paid-until date to go live", () => {
    expect(validateForm(valid({ status: "ACTIVE" })).errors.paidUntil).toMatch(/live/);
    const r = validateForm(valid({ status: "ACTIVE", paidUntil: "2030-01-31" }));
    expect(r.ok && r.paidUntil?.toISOString()).toBe("2030-01-31T00:00:00.000Z");
  });

  it("accepts a draft with no date, and rejects a date that is not real", () => {
    expect(validateForm(valid({ status: "DRAFT" })).ok).toBe(true);
    expect(validateForm(valid({ paidUntil: "2030-02-31" })).errors.paidUntil).toBe("Enter a valid date");
    expect(parseDateInput("2030-02-28")).toBeInstanceOf(Date);
    expect(parseDateInput("30/01/2030")).toBeNull();
  });
});

describe("round trip", () => {
  it("turns a stored page into form values and back into the same PageData", () => {
    const values = valuesFromPage({
      username: "maria",
      tier: "STANDARD",
      templateKey: "pro-classic",
      status: "ACTIVE",
      paidUntil: new Date("2030-10-15T00:00:00Z"),
      addOns: [],
      data: SAMPLE_PAGE_DATA,
      client: { name: "Maria", contactEmail: null, contactPhone: null, notes: null },
    });
    expect(values.paidUntil).toBe("2030-10-15");
    const r = validateForm(values);
    expect(r.ok).toBe(true);
    expect(r.ok && r.data).toEqual(SAMPLE_PAGE_DATA);
  });

  it("maps candidates back to the form row that caused an error", () => {
    const v = valid({ socials: [{ id: "a", type: "whatsapp", handle: "", url: "", note: "" }, { id: "b", type: "discord", handle: "x", url: "", note: "" }] });
    expect(valuesToCandidate(v).socialIndex).toEqual([1]);
  });
});
