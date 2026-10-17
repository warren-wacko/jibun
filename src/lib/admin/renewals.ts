import { GRACE_DAYS, RENEWAL_REMINDER_DAYS } from "../plan-term";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Where a page is in its paid term:
 * - ok: more than 30 days left
 * - due: ends within 30 days (time to send the reminder)
 * - grace: ended up to 30 days ago; the page still shows
 * - lapsed: the grace period is over; visitors see the inactive page
 */
export type RenewalStage = "none" | "ok" | "due" | "grace" | "lapsed";

export type RenewalInfo = {
  stage: RenewalStage;
  /** Whole days until the term ends (negative once it has ended). */
  daysLeft: number | null;
  /** When the page stops showing: the end of the term plus the grace period. */
  graceEnds: Date | null;
};

export function renewalInfo(paidUntil: Date | null, now: Date): RenewalInfo {
  if (!paidUntil) return { stage: "none", daysLeft: null, graceEnds: null };
  const diff = paidUntil.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / DAY_MS);
  const graceEnds = new Date(paidUntil.getTime() + GRACE_DAYS * DAY_MS);
  let stage: RenewalStage;
  if (diff > RENEWAL_REMINDER_DAYS * DAY_MS) stage = "ok";
  else if (diff >= 0) stage = "due";
  else if (now.getTime() <= graceEnds.getTime()) stage = "grace";
  else stage = "lapsed";
  return { stage, daysLeft, graceEnds };
}

export const RENEWAL_STAGE_LABEL: Record<RenewalStage, string> = {
  none: "No term set",
  ok: "In term",
  due: "Renewal due",
  grace: "In grace period",
  lapsed: "Lapsed",
};

/** "in 12 days", "today", "3 days ago". */
export function describeDays(daysLeft: number): string {
  if (daysLeft === 0) return "today";
  const n = Math.abs(daysLeft);
  const text = `${n} ${n === 1 ? "day" : "days"}`;
  return daysLeft > 0 ? `in ${text}` : `${text} ago`;
}

/** Prisma `where` for the renewals list: a term set and ending within the reminder window, or already ended. */
export function buildRenewalWhere(now: Date, opts: { includeInactive?: boolean } = {}) {
  return {
    paidUntil: { not: null, lte: new Date(now.getTime() + RENEWAL_REMINDER_DAYS * DAY_MS) },
    ...(opts.includeInactive ? { status: { in: ["ACTIVE", "INACTIVE"] as ("ACTIVE" | "INACTIVE")[] } } : { status: "ACTIVE" as const }),
  };
}

const dateText = new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" });

/** A ready-to-edit reminder email, using the wording agreed for clients. Returns null when there is no address. */
export function reminderMailto(opts: { email: string | null; name: string; paidUntil: Date; now: Date }): string | null {
  if (!opts.email) return null;
  const ended = opts.paidUntil.getTime() < opts.now.getTime();
  const date = dateText.format(opts.paidUntil);
  const subject = ended ? `Your Jibun digital card term ended on ${date}` : `Your Jibun digital card term ends on ${date}`;
  const body = [
    `Hi ${opts.name},`,
    "",
    `Your digital card and page ${ended ? "were covered until" : "are covered until"} ${date}.`,
    "You can keep it active with a small renewal, or upgrade to a new card and design at a discount.",
    "",
    "Reply to this email and I will help you with either.",
    "",
    "Jibun",
  ].join("\n");
  return `mailto:${encodeURIComponent(opts.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
