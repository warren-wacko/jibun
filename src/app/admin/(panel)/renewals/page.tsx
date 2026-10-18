import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buildRenewalWhere, describeDays, reminderMailto, renewalInfo, RENEWAL_STAGE_LABEL, type RenewalStage } from "@/lib/admin/renewals";
import { getEntitlements } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { renewedUntil } from "@/lib/plan-term";
import { EditsCounter } from "../../_components/EditsCounter";
import { StatusBadge, formatDate, tierLabel } from "../../_components/badges";
import { RenewalActions } from "./RenewalActions";

export const metadata: Metadata = { title: "Renewals" };

const STAGE_STYLE: Record<RenewalStage, string> = {
  none: "bg-neutral-200 text-neutral-800",
  ok: "bg-green-100 text-green-900",
  due: "bg-yellow-100 text-yellow-900",
  grace: "bg-orange-100 text-orange-900",
  lapsed: "bg-red-100 text-red-900",
};

export default function RenewalsPage({ searchParams }: PageProps<"/admin/renewals">) {
  return (
    <>
      <div className="pb-1">
        <h1>Renewals</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Pages whose 4-year term ends within 30 days, or has already ended. Send the reminder, then renew when the client pays.
        </p>
      </div>
      <Suspense fallback={<p className="pt-4 text-sm text-neutral-500">Loading renewals…</p>}>
        <RenewalList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function RenewalList({ searchParams }: Pick<PageProps<"/admin/renewals">, "searchParams">) {
  const query = await searchParams;
  const includeInactive = (Array.isArray(query.show) ? query.show[0] : query.show) === "all";
  const now = new Date();

  const pages = await db.page.findMany({
    where: buildRenewalWhere(now, { includeInactive }),
    orderBy: { paidUntil: "asc" },
    select: {
      id: true,
      username: true,
      tier: true,
      addOns: true,
      status: true,
      paidUntil: true,
      reminderSentAt: true,
      editsUsed: true,
      client: { select: { name: true, contactEmail: true, contactPhone: true } },
    },
  });

  const rows = pages.map((p) => ({ ...p, info: renewalInfo(p.paidUntil, now) }));
  const counts = { due: 0, grace: 0, lapsed: 0 } as Record<"due" | "grace" | "lapsed", number>;
  for (const r of rows) if (r.info.stage === "due" || r.info.stage === "grace" || r.info.stage === "lapsed") counts[r.info.stage] += 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
        <p className="text-neutral-700">
          <strong>{rows.length}</strong> {rows.length === 1 ? "page" : "pages"}
          {rows.length > 0 && (
            <span className="text-neutral-600">
              {" "}
              · {counts.due} due · {counts.grace} in grace · {counts.lapsed} lapsed
            </span>
          )}
        </p>
        <Link href={includeInactive ? "/admin/renewals" : "/admin/renewals?show=all"} className="inline-flex min-h-10 items-center underline">
          {includeInactive ? "Hide inactive pages" : "Include inactive pages"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-600">No renewals due in the next 30 days.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const { stage, daysLeft, graceEnds } = r.info;
            const allowed = getEntitlements({ tier: r.tier, addOns: r.addOns }).smallEdits;
            const paidUntil = r.paidUntil as Date; // the query only returns pages with a term
            return (
              <li key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4" data-renewal={r.username}>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <Link href={`/admin/pages/${r.username}`} className="font-semibold underline-offset-2 hover:underline">
                      {r.client.name}
                    </Link>
                    <p className="text-sm text-neutral-600">
                      <a href={`/${r.username}`} target="_blank" rel="noopener noreferrer" className="underline">
                        /{r.username}
                      </a>{" "}
                      · {tierLabel(r.tier)} · <StatusBadge status={r.status} />
                    </p>
                    <p className="mt-1 break-words text-sm text-neutral-600">
                      {r.client.contactEmail ?? "No email"}
                      {r.client.contactPhone ? ` · ${r.client.contactPhone}` : ""}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">Term ends {formatDate(paidUntil)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLE[stage]}`}>{RENEWAL_STAGE_LABEL[stage]}</span>
                    </p>
                    <p className="text-neutral-600">{daysLeft !== null && describeDays(daysLeft)}</p>
                    {(stage === "due" || stage === "grace") && graceEnds && r.status === "ACTIVE" && (
                      <p className="text-neutral-600">Page hides after {formatDate(graceEnds)}</p>
                    )}
                    <p className="mt-2">
                      Reminder:{" "}
                      {r.reminderSentAt ? <span className="font-medium text-green-800">sent {formatDate(r.reminderSentAt)}</span> : <span className="font-medium text-amber-800">not sent</span>}
                    </p>
                    <div className="mt-2">
                      <p className="mb-1 text-xs text-neutral-600">Small edits used</p>
                      <EditsCounter pageId={r.id} used={r.editsUsed} allowed={allowed} />
                    </div>
                  </div>

                  <RenewalActions
                    pageId={r.id}
                    username={r.username}
                    reminderSent={Boolean(r.reminderSentAt)}
                    mailto={reminderMailto({ email: r.client.contactEmail, name: r.client.name, paidUntil, now })}
                    active={r.status === "ACTIVE"}
                    renewsTo={formatDate(renewedUntil(paidUntil, now))}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
