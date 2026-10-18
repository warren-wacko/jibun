import { TEMPLATE_KEYS } from "@/templates/keys";
import { ACCENT_PRESET_IDS } from "../accents";
import { PICK_LABEL, type Order } from "../order";
import { normalizePhone } from "../phone";
import { emptyFormValues, suggestUsername, type FormValues } from "./page-form";
import { draftLines, emptyDraft, type SectionDraft } from "./section-drafts";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FIRST_URL = /https?:\/\/\S+/i;

/** One item per line, or per comma when the client wrote everything on one line. */
function items(text: string): string {
  const lines = draftLines(text);
  return (lines.length === 1 ? lines[0].split(",").map((x) => x.trim()).filter(Boolean) : lines).join("\n");
}

export type ImportedOrder = { values: FormValues; notes: string[] };

/**
 * Turn a client's order into the admin form's values. Nothing is saved: the admin reviews the filled form first.
 * What the form cannot hold as data (row-style sections, photos, a domain wish) goes into the private notes,
 * and the list of things to follow up is returned for the admin to read.
 */
export function orderToFormValues(order: Order, makeId: () => string): ImportedOrder {
  const v = emptyFormValues();
  const follow: string[] = [];
  const leftovers: string[] = [];

  v.clientName = order.name;
  v.contactEmail = order.email;
  v.contactPhone = order.phone;
  v.tier = order.plan === "standard" ? "STANDARD" : "STARTER";
  v.addOns = [...order.addOns];
  v.templateKey = TEMPLATE_KEYS.includes(order.template) ? order.template : v.templateKey;
  v.username = suggestUsername(order.name);

  v.fullName = order.name;
  v.displayName = order.nickname;
  v.title = order.title;
  v.company = order.company;
  v.location = order.location;
  v.bio = order.bio;
  v.phone = order.phone ? (normalizePhone(order.phone) ?? order.phone) : "";
  v.email = order.email;
  v.showPhoneNumbers = order.showPhone;
  if (order.student) {
    v.school = order.student.school;
    v.program = order.student.program;
    v.year = order.student.year;
    v.graduating = order.student.graduating;
    v.openTo = order.student.openTo;
  }

  v.socials = order.socials.map((x) => ({ id: makeId(), type: x.type, handle: x.handle, url: x.url, note: "" }));
  v.featuredLabel = order.featured?.label ?? "";
  v.featuredUrl = order.featured?.url ?? "";

  v.theme = order.theme;
  if (ACCENT_PRESET_IDS.includes(order.accent)) v.accent = order.accent;
  else if (HEX.test(order.accent)) {
    v.accent = order.accent;
    if (order.plan === "starter") follow.push(`They asked for the colour ${order.accent}, which needs Standard. Pick a preset or change the plan.`);
  }

  const sections: SectionDraft[] = [];
  for (const pick of order.sections) {
    const draft = emptyDraft(pick.kind, makeId());
    if (pick.kind === "skills" || pick.kind === "interests") draft.text = items(pick.text);
    else if (pick.kind === "song") draft.url = FIRST_URL.exec(pick.text)?.[0] ?? "";
    if (pick.text && pick.kind !== "skills" && pick.kind !== "interests" && !(pick.kind === "song" && draft.url)) leftovers.push(`${PICK_LABEL[pick.kind]}: ${pick.text}`);
    sections.push(draft);
  }
  const linkSection = (kind: "video" | "resume" | "booking", url: string, label: string) => {
    if (!url) return;
    const draft = emptyDraft(kind, makeId());
    draft.url = url;
    sections.push(draft);
    follow.push(`${label} link added from the order.`);
  };
  if (order.addOns.includes("video")) linkSection("video", order.videoUrl, "Video");
  if (order.addOns.includes("pdf")) linkSection("resume", order.pdfUrl, "PDF");
  if (order.addOns.includes("booking")) linkSection("booking", order.bookingUrl, "Booking");
  if (order.addOns.includes("gallery")) {
    sections.push(emptyDraft("gallery", makeId()));
    follow.push("Gallery: ask the client to send the photos in the chat.");
  }
  v.sections = sections;

  if (order.addOns.includes("custom_domain") && order.domain) follow.push(`Wants the domain: ${order.domain}`);
  follow.push("Photo and logo: ask the client to send them in the chat.");

  const noteLines = [
    order.note && `Client note: ${order.note}`,
    ...leftovers,
    order.domain && order.addOns.includes("custom_domain") ? `Domain wanted: ${order.domain}` : "",
  ].filter(Boolean);
  v.notes = noteLines.join("\n");

  return { values: v, notes: follow };
}
