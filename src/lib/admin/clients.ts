import { z } from "zod";
import { isRenewalDue } from "../plan-term";
import { USAGE_ACTIVE_DAYS, USAGE_NEW_DAYS, USAGE_QUIET_DAYS, getUsageStatus, type UsageStatus } from "../usage";

export const TIER_FILTERS = ["STARTER", "STANDARD", "CUSTOM"] as const;
export const STATUS_FILTERS = ["DRAFT", "ACTIVE", "INACTIVE"] as const;
export const USAGE_FILTERS = ["active", "quiet", "dormant", "never_used", "new"] as const satisfies readonly UsageStatus[];
export const SORTS = ["recent", "last_tap", "paid_until", "name"] as const;
export const PAGE_SIZE = 25;

/** Anything unrecognised in the URL falls back to "no filter" instead of failing. */
const oneOf = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values).optional().catch(undefined);

export const clientFilterSchema = z.object({
  q: z.string().trim().max(60).optional().catch(undefined),
  tier: oneOf(TIER_FILTERS),
  status: oneOf(STATUS_FILTERS),
  usage: oneOf(USAGE_FILTERS),
  sort: z.enum(SORTS).catch("recent"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export type ClientFilter = z.infer<typeof clientFilterSchema>;

/** Parses Next's `searchParams` (a value may be an array when a key repeats; the first wins). */
export function parseClientFilter(params: Record<string, string | string[] | undefined>): ClientFilter {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return clientFilterSchema.parse({
    q: first(params.q) || undefined,
    tier: first(params.tier),
    status: first(params.status),
    usage: first(params.usage),
    sort: first(params.sort),
    page: first(params.page),
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * DAY_MS);

/**
 * Prisma `where` for the filters. The usage filter mirrors `getUsageStatus` in lib/usage.ts:
 * a page counts as live from its creation date.
 */
export function buildClientWhere(f: ClientFilter, now: Date) {
  const and: Record<string, unknown>[] = [];
  if (f.q) {
    and.push({
      OR: [
        { username: { contains: f.q, mode: "insensitive" } },
        { client: { name: { contains: f.q, mode: "insensitive" } } },
        { client: { contactEmail: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }
  if (f.tier) and.push({ tier: f.tier });
  if (f.status) and.push({ status: f.status });

  const active = daysAgo(now, USAGE_ACTIVE_DAYS);
  const quiet = daysAgo(now, USAGE_QUIET_DAYS);
  const isNew = daysAgo(now, USAGE_NEW_DAYS);
  switch (f.usage) {
    case "active":
      and.push({ lastTapAt: { gte: active } });
      break;
    case "quiet":
      and.push({ lastTapAt: { lt: active, gte: quiet } });
      break;
    case "dormant":
      and.push({ lastTapAt: { lt: quiet } });
      break;
    case "never_used":
      and.push({ lastTapAt: null, createdAt: { lt: isNew } });
      break;
    case "new":
      and.push({ lastTapAt: null, createdAt: { gte: isNew } });
      break;
  }
  return and.length ? { AND: and } : {};
}

export function buildClientOrderBy(sort: ClientFilter["sort"]) {
  switch (sort) {
    case "last_tap":
      return [{ lastTapAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] as const;
    case "paid_until":
      return [{ paidUntil: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }] as const;
    case "name":
      return [{ client: { name: "asc" } }, { username: "asc" }] as const;
    default:
      return [{ createdAt: "desc" }] as const;
  }
}

export type TermState = "none" | "ok" | "due" | "ended";

/** Where the paid term stands: ended (past `paidUntil`), due (ends within 30 days), ok, or none set. */
export function termState(paidUntil: Date | null, now: Date): TermState {
  if (!paidUntil) return "none";
  if (paidUntil.getTime() < now.getTime()) return "ended";
  return isRenewalDue(paidUntil, now) ? "due" : "ok";
}

export type ClientRow = {
  id: string;
  username: string;
  name: string;
  tier: string;
  status: string;
  paidUntil: Date | null;
  lastTapAt: Date | null;
  usage: UsageStatus;
  term: TermState;
};

export function toClientRow(
  p: {
    id: string;
    username: string;
    tier: string;
    status: string;
    paidUntil: Date | null;
    lastTapAt: Date | null;
    createdAt: Date;
    client: { name: string };
  },
  now: Date,
): ClientRow {
  return {
    id: p.id,
    username: p.username,
    name: p.client.name,
    tier: p.tier,
    status: p.status,
    paidUntil: p.paidUntil,
    lastTapAt: p.lastTapAt,
    usage: getUsageStatus(p.lastTapAt, p.createdAt, now),
    term: termState(p.paidUntil, now),
  };
}

/** Query string for a link that keeps the current filters but changes some of them. */
export function clientsHref(f: ClientFilter, change: Partial<Record<keyof ClientFilter, string | number | undefined>> = {}): string {
  const merged: Record<string, string | number | undefined> = { ...f, ...change };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === "" || (k === "sort" && v === "recent") || (k === "page" && v === 1)) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `/admin/clients?${s}` : "/admin/clients";
}
