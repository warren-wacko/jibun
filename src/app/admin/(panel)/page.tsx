import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getDashboard } from "@/lib/admin/dashboard";
import { describeDays, renewalInfo } from "@/lib/admin/renewals";
import type { UsageStatus } from "@/lib/usage";
import { UsageBadge, formatDate } from "../_components/badges";
import { OrderLinkBuilder } from "./pages/_components/OrderLinkBuilder";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminHome() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <h1>Dashboard</h1>
        <Link href="/admin/pages/new" className="inline-flex min-h-11 items-center rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white">
          + New page
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
        <Dashboard />
      </Suspense>
      <div className="pt-8">
        <OrderLinkBuilder />
      </div>
    </>
  );
}

function Stat({ label, value, href, hint }: { label: string; value: number; href?: string; hint?: ReactNode }) {
  const body = (
    <>
      <span className="adm-num tabular-nums">{value}</span>
      <span className="text-sm font-medium text-neutral-800">{label}</span>
      {hint && <span className="text-xs text-neutral-600">{hint}</span>}
    </>
  );
  const cls = "adm-stat flex flex-col gap-1 bg-white p-4";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const USAGE_ORDER: { usage: UsageStatus; hint: string }[] = [
  { usage: "active", hint: "tapped in the last 30 days" },
  { usage: "quiet", hint: "31–90 days since a tap" },
  { usage: "dormant", hint: "over 90 days since a tap" },
  { usage: "never_used", hint: "live over 14 days, never tapped" },
  { usage: "new", hint: "live 14 days or less" },
];

async function Dashboard() {
  await connection(); // the numbers depend on the current time, so this is rendered per request
  const now = new Date();
  const d = await getDashboard(now);

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Overview" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active pages" value={d.activePages} href="/admin/clients?status=ACTIVE" />
        <Stat label="Taps this week" value={d.tapsThisWeek} hint="last 7 days" />
        <Stat label="Renewals due" value={d.renewalsDue} href="/admin/renewals" hint="within 30 days or ended" />
        <Stat label="Drafts" value={d.draftPages} href="/admin/clients?status=DRAFT" />
      </section>

      <section aria-labelledby="usage-title">
        <h2 id="usage-title" className="mb-1">
          Live pages by usage
        </h2>
        <p className="mb-3 text-sm text-neutral-600">Dormant and never-used pages are your follow-up list: ask whether the chip works, or offer a new card.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {USAGE_ORDER.map(({ usage, hint }) => (
            <Stat key={usage} label={usage === "never_used" ? "Never used" : usage.charAt(0).toUpperCase() + usage.slice(1)} value={d.usage[usage]} href={`/admin/clients?status=ACTIVE&usage=${usage}`} hint={hint} />
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-600">
          Legend: <UsageBadge usage="active" /> <UsageBadge usage="quiet" /> <UsageBadge usage="dormant" /> <UsageBadge usage="never_used" /> <UsageBadge usage="new" />
        </p>
      </section>

      <section aria-labelledby="renewals-title">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="renewals-title">
            Next renewals
          </h2>
          <Link href="/admin/renewals" className="inline-flex min-h-10 items-center text-sm underline">
            All renewals
          </Link>
        </div>
        {d.nextRenewals.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-600">No renewals due in the next 30 days.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {d.nextRenewals.map((r) => {
              const info = renewalInfo(r.paidUntil, now);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <Link href={`/admin/pages/${r.username}`} className="font-medium underline-offset-2 hover:underline">
                    {r.name} <span className="font-normal text-neutral-600">/{r.username}</span>
                  </Link>
                  <span className="text-neutral-700">
                    {formatDate(r.paidUntil)}
                    {info.daysLeft !== null && <span className="text-neutral-600"> · {describeDays(info.daysLeft)}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
