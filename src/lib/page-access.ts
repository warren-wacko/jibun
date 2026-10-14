import { isPlanPaid } from "./plan-term";

type AccessInput = { status: "DRAFT" | "ACTIVE" | "INACTIVE"; paidUntil: Date | null };

/**
 * Whether a visitor may see the public page.
 * - ACTIVE: only while paidUntil + grace has not passed.
 * - DRAFT: visible, so the client can review the preview link (the page is noindex).
 * - INACTIVE: never.
 * Taps and downloads (vCard, QR) are stricter: they require a paid ACTIVE page.
 */
export function canViewPage(page: AccessInput, now: Date = new Date()): boolean {
  if (page.status === "INACTIVE") return false;
  if (page.status === "DRAFT") return true;
  return isPlanPaid(page, now);
}

/** vCard and QR are only served for a live, paid page. */
export function canDownload(page: AccessInput, now: Date = new Date()): boolean {
  return isPlanPaid(page, now);
}
