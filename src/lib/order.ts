import { z } from "zod";
import { TEMPLATE_KEYS } from "@/templates/keys";
import { ADD_ONS } from "./entitlements";
import { SOCIAL_TYPES } from "./page-schema";

/**
 * The order form: a client answers questions on /order and sends the answers to us as a message. Nothing is
 * stored on the server. The message has a readable summary and, at the end, a code (JB1.…) holding the same
 * answers; the admin pastes the message into New page and the form is filled in from the code.
 * Public-safe: no admin or database code in here.
 */

export const ORDER_PLANS = ["starter", "standard"] as const;
export type OrderPlan = (typeof ORDER_PLANS)[number];

/** The optional sections a Standard plan picks from (the ones no add-on unlocks). */
export const ORDER_PICKS = ["skills", "services", "stats", "portfolio", "experience", "interests", "orgs", "song"] as const;
export type OrderPick = (typeof ORDER_PICKS)[number];

export const PICK_LABEL: Record<OrderPick, string> = {
  skills: "Skills",
  services: "Services",
  stats: "Stats",
  portfolio: "Portfolio",
  experience: "Experience",
  interests: "Interests",
  orgs: "Orgs and clubs",
  song: "Song on repeat",
};

export const ADD_ON_LABEL: Record<(typeof ADD_ONS)[number], string> = {
  gallery: "Photo gallery",
  video: "Video",
  pdf: "PDF / résumé download",
  contact_form: "Contact form",
  booking: "Booking button",
  analytics: "Tap and visit stats",
  custom_domain: "Custom domain",
  remove_branding: 'Remove "Digital card by Jibun"',
  extra_revision: "One extra revision",
};

const s = (max: number) => z.string().trim().max(max).default("");

export const OrderSchema = z.object({
  v: z.literal(1),
  plan: z.enum(ORDER_PLANS),
  addOns: z.array(z.enum(ADD_ONS)).max(ADD_ONS.length).default([]),
  // about
  name: z.string().trim().min(1, "Please enter your name").max(60),
  nickname: s(30),
  title: s(80),
  company: s(80),
  location: s(80),
  bio: s(600),
  // contact
  phone: s(30),
  email: s(120),
  showPhone: z.boolean().default(true),
  // student (optional)
  student: z
    .object({ school: s(100), program: s(60), year: s(30), graduating: s(10), openTo: s(100) })
    .optional(),
  // links
  socials: z
    .array(z.object({ type: z.enum(SOCIAL_TYPES), handle: s(100), url: s(500) }))
    .max(12)
    .default([]),
  featured: z.object({ label: s(40), url: s(500) }).optional(),
  // design
  template: s(40),
  theme: z.enum(["light", "dark"]).default("light"),
  accent: s(20),
  // optional sections: Standard picks, and what the add-ons need
  sections: z.array(z.object({ kind: z.enum(ORDER_PICKS), text: s(1500) })).max(ORDER_PICKS.length).default([]),
  videoUrl: s(500),
  pdfUrl: s(500),
  bookingUrl: s(500),
  domain: s(80),
  note: s(1000),
});

export type Order = z.infer<typeof OrderSchema>;

/* ---------- the link you send a client ---------- */

export type OrderLink = { plan: OrderPlan; addOns: (typeof ADD_ONS)[number][]; template: string };

/** Read /order's query string. Anything unknown is ignored, so a mistyped link still opens the form. */
export function parseOrderLink(params: Record<string, string | string[] | undefined>): OrderLink {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const plan = first(params.plan).toLowerCase() === "standard" ? "standard" : "starter";
  const addOns = [...new Set(first(params.addons).split(",").map((a) => a.trim()))].filter((a): a is (typeof ADD_ONS)[number] => (ADD_ONS as readonly string[]).includes(a));
  const template = TEMPLATE_KEYS.includes(first(params.template)) ? first(params.template) : "";
  return { plan, addOns, template };
}

export function buildOrderLink(origin: string, link: Partial<OrderLink>): string {
  const qs = new URLSearchParams();
  if (link.plan === "standard") qs.set("plan", "standard");
  if (link.addOns?.length) qs.set("addons", link.addOns.join(","));
  if (link.template) qs.set("template", link.template);
  const q = qs.toString();
  return `${origin.replace(/\/+$/, "")}/order${q ? `?${q}` : ""}`;
}

/* ---------- the message the client sends ---------- */

const PREFIX = "JB1.";

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeOrder(order: Order): string {
  // the closing dot marks where the code ends, so words after it in a pasted message cannot be mistaken for code
  return PREFIX + toBase64Url(JSON.stringify(order)) + ".";
}

export type DecodeResult = { ok: true; order: Order } | { ok: false; message: string };

/** Find the code in a pasted message (anywhere in it) and read the order from it. */
export function decodeOrder(pasted: string): DecodeResult {
  const text = pasted.replace(/\s+/g, "");
  const match = /JB1\.([A-Za-z0-9_-]{10,})\./.exec(text);
  if (!match) {
    return {
      ok: false,
      message: text.includes("JB1.")
        ? "The order code is cut off (it should end with a dot). Ask the client to send it again."
        : "No order code found. Paste the whole message the client sent, including the line that starts with JB1.",
    };
  }
  let json: unknown;
  try {
    json = JSON.parse(fromBase64Url(match[1]));
  } catch {
    return { ok: false, message: "The order code is damaged (part of it may have been cut off). Ask the client to send it again." };
  }
  const parsed = OrderSchema.safeParse(json);
  if (!parsed.success) return { ok: false, message: `The order code is not valid: ${parsed.error.issues[0]?.message ?? "unknown problem"}.` };
  return { ok: true, order: parsed.data };
}

const PLAN_LABEL: Record<OrderPlan, string> = { starter: "Starter", standard: "Standard" };

/** The plain-text message: a short readable summary, then the code. */
export function orderMessage(order: Order): string {
  const lines = [
    "New Jibun order",
    `Plan: ${PLAN_LABEL[order.plan]}${order.addOns.length ? ` + ${order.addOns.map((a) => ADD_ON_LABEL[a]).join(", ")}` : ""}`,
    `Name: ${order.name}${order.nickname ? ` (${order.nickname})` : ""}`,
  ];
  if (order.title || order.company) lines.push(`Work: ${[order.title, order.company].filter(Boolean).join(" at ")}`);
  if (order.phone || order.email) lines.push(`Contact: ${[order.phone, order.email].filter(Boolean).join(" / ")}`);
  if (order.template) lines.push(`Design: ${order.template}`);
  if (order.socials.length) lines.push(`Links: ${order.socials.length}`);
  if (order.sections.length) lines.push(`Extras: ${order.sections.map((x) => PICK_LABEL[x.kind]).join(", ")}`);
  lines.push("", "Order code (please send it as it is):", encodeOrder(order));
  return lines.join("\n");
}
