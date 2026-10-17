import type { TermState } from "@/lib/admin/clients";
import type { UsageStatus } from "@/lib/usage";

const BASE = "inline-block rounded-full px-2 py-0.5 text-xs font-medium";

const USAGE: Record<UsageStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-900" },
  quiet: { label: "Quiet", cls: "bg-yellow-100 text-yellow-900" },
  dormant: { label: "Dormant", cls: "bg-red-100 text-red-900" },
  never_used: { label: "Never used", cls: "bg-orange-100 text-orange-900" },
  new: { label: "New", cls: "bg-blue-100 text-blue-900" },
};

export function UsageBadge({ usage }: { usage: UsageStatus }) {
  return <span className={`${BASE} ${USAGE[usage].cls}`}>{USAGE[usage].label}</span>;
}

const STATUS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-900",
  DRAFT: "bg-neutral-200 text-neutral-800",
  INACTIVE: "bg-red-100 text-red-900",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`${BASE} ${STATUS[status] ?? STATUS.DRAFT}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

const TIER_LABEL: Record<string, string> = { STARTER: "Starter", STANDARD: "Standard", CUSTOM: "Custom" };

export function tierLabel(tier: string): string {
  return TIER_LABEL[tier] ?? tier;
}

const TERM: Record<TermState, { label: string; cls: string } | null> = {
  none: null,
  ok: null,
  due: { label: "Renewal due", cls: "bg-yellow-100 text-yellow-900" },
  ended: { label: "Term ended", cls: "bg-red-100 text-red-900" },
};

export function TermBadge({ term }: { term: TermState }) {
  const t = TERM[term];
  return t ? <span className={`${BASE} ${t.cls}`}>{t.label}</span> : null;
}

const fmt = new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" });

export function formatDate(date: Date | null): string {
  return date ? fmt.format(date) : "—";
}
