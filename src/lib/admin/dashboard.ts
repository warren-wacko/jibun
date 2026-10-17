import "server-only";
import { db } from "../db";
import { USAGE_FILTERS, buildClientWhere, parseClientFilter } from "./clients";
import { buildRenewalWhere } from "./renewals";
import type { UsageStatus } from "../usage";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardData = {
  activePages: number;
  draftPages: number;
  tapsThisWeek: number;
  /** Live pages by how recently their cards were used. */
  usage: Record<UsageStatus, number>;
  renewalsDue: number;
  /** The next few renewals, soonest first (the ones already ended come first). */
  nextRenewals: { id: string; username: string; name: string; paidUntil: Date | null }[];
};

/** Numbers for the admin dashboard. The usage counts use the same rules as the clients list filters, so the links match. */
export async function getDashboard(now: Date): Promise<DashboardData> {
  const usageCounts = await Promise.all(
    USAGE_FILTERS.map((usage) =>
      db.page.count({ where: buildClientWhere(parseClientFilter({ usage, status: "ACTIVE" }), now) }),
    ),
  );
  const renewalWhere = buildRenewalWhere(now);

  const [activePages, draftPages, tapsThisWeek, renewalsDue, nextRenewals] = await Promise.all([
    db.page.count({ where: { status: "ACTIVE" } }),
    db.page.count({ where: { status: "DRAFT" } }),
    db.tap.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * DAY_MS) } } }),
    db.page.count({ where: renewalWhere }),
    db.page.findMany({
      where: renewalWhere,
      orderBy: { paidUntil: "asc" },
      take: 5,
      select: { id: true, username: true, paidUntil: true, client: { select: { name: true } } },
    }),
  ]);

  return {
    activePages,
    draftPages,
    tapsThisWeek,
    usage: Object.fromEntries(USAGE_FILTERS.map((u, i) => [u, usageCounts[i]])) as Record<UsageStatus, number>,
    renewalsDue,
    nextRenewals: nextRenewals.map((p) => ({ id: p.id, username: p.username, name: p.client.name, paidUntil: p.paidUntil })),
  };
}
