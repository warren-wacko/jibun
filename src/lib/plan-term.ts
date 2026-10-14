export const TERM_YEARS = 4;
export const GRACE_DAYS = 30;
export const RENEWAL_REMINDER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  // Clamp 29 Feb to 28 Feb on non-leap years instead of rolling into March.
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/** Purchase date + 4 years. */
export function termEnd(purchasedAt: Date): Date {
  return addYears(purchasedAt, TERM_YEARS);
}

/** Renewal extends the current end by another term, or restarts from `now` when already lapsed. */
export function renewedUntil(paidUntil: Date | null, now: Date = new Date()): Date {
  const base = paidUntil && paidUntil.getTime() > now.getTime() ? paidUntil : now;
  return termEnd(base);
}

/** "Plan paid": page is ACTIVE and paidUntil + grace has not passed. */
export function isPlanPaid(
  page: { status: "DRAFT" | "ACTIVE" | "INACTIVE"; paidUntil: Date | null },
  now: Date = new Date(),
): boolean {
  if (page.status !== "ACTIVE" || !page.paidUntil) return false;
  return now.getTime() <= page.paidUntil.getTime() + GRACE_DAYS * DAY_MS;
}

/** True when the term ends within the reminder window, including terms that already ended (still to chase). */
export function isRenewalDue(paidUntil: Date | null, now: Date = new Date()): boolean {
  if (!paidUntil) return false;
  const ms = paidUntil.getTime() - now.getTime();
  return ms <= RENEWAL_REMINDER_DAYS * DAY_MS;
}
