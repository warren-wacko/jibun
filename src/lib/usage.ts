/** Usage-status thresholds. Change them here only. */
export const USAGE_ACTIVE_DAYS = 30;
export const USAGE_QUIET_DAYS = 90;
export const USAGE_NEW_DAYS = 14;
/** Repeat taps from the same device inside this window are not logged. */
export const TAP_DEDUP_MINUTES = 10;

export type UsageStatus = "active" | "quiet" | "dormant" | "never_used" | "new";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Usage is derived from the last tap and is separate from PageStatus and CardStatus.
 * `liveSince` is when the page went live; with no tap it decides New vs Never used.
 */
export function getUsageStatus(
  lastTapAt: Date | null,
  liveSince: Date | null,
  now: Date = new Date(),
): UsageStatus {
  if (lastTapAt) {
    const days = (now.getTime() - lastTapAt.getTime()) / DAY_MS;
    if (days <= USAGE_ACTIVE_DAYS) return "active";
    if (days <= USAGE_QUIET_DAYS) return "quiet";
    return "dormant";
  }
  if (!liveSince) return "new";
  const liveDays = (now.getTime() - liveSince.getTime()) / DAY_MS;
  return liveDays > USAGE_NEW_DAYS ? "never_used" : "new";
}
