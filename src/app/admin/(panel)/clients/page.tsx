import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  PAGE_SIZE,
  SORTS,
  STATUS_FILTERS,
  TIER_FILTERS,
  USAGE_FILTERS,
  buildClientOrderBy,
  buildClientWhere,
  clientsHref,
  parseClientFilter,
  toClientRow,
  type ClientFilter,
} from "@/lib/admin/clients";
import { db } from "@/lib/db";
import { StatusBadge, TermBadge, UsageBadge, formatDate, tierLabel } from "../../_components/badges";

export const metadata: Metadata = { title: "Clients" };

const SORT_LABEL: Record<(typeof SORTS)[number], string> = {
  recent: "Newest",
  last_tap: "Last tapped",
  paid_until: "Term ends soonest",
  name: "Name A–Z",
};
const USAGE_LABEL: Record<(typeof USAGE_FILTERS)[number], string> = {
  active: "Active",
  quiet: "Quiet",
  dormant: "Dormant",
  never_used: "Never used",
  new: "New",
};

export default function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  return (
    <>
      <Suspense>
        <DeletedNote searchParams={searchParams} />
      </Suspense>
      <div className="flex items-center justify-between gap-4 pb-4">
        <h1>Clients</h1>
        <Link href="/admin/pages/new" className="inline-flex min-h-11 items-center rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white">
          + New page
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-neutral-500">Loading clients…</p>}>
        <ClientList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ClientList({ searchParams }: Pick<PageProps<"/admin/clients">, "searchParams">) {
  const filter = parseClientFilter(await searchParams);
  const now = new Date();
  const where = buildClientWhere(filter, now);

  const [total, pages] = await Promise.all([
    db.page.count({ where }),
    db.page.findMany({
      where,
      orderBy: [...buildClientOrderBy(filter.sort)],
      skip: (filter.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        username: true,
        tier: true,
        status: true,
        paidUntil: true,
        lastTapAt: true,
        createdAt: true,
        client: { select: { name: true } },
      },
    }),
  ]);
  const rows = pages.map((p) => toClientRow(p, now));
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(filter.q || filter.tier || filter.status || filter.usage);

  return (
    <>
      <Filters filter={filter} />
      <p className="py-3 text-sm text-neutral-600">
        {total} {total === 1 ? "page" : "pages"}
        {filtered && (
          <>
            {" · "}
            <Link href="/admin/clients" className="underline">
              Clear filters
            </Link>
          </>
        )}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
          {filtered ? "No pages match these filters." : "No client pages yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Usage</th>
                <th className="px-3 py-2">Last tapped</th>
                <th className="px-3 py-2">Paid until</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2">
                    <Link href={`/admin/pages/${r.username}`} className="inline-block py-1 font-medium underline-offset-2 hover:underline">
                      {r.name}
                    </Link>
                    <div>
                      <a href={`/${r.username}`} className="text-neutral-600 underline" target="_blank" rel="noopener noreferrer">
                        /{r.username}
                      </a>
                    </div>
                  </td>
                  <td className="px-3 py-2">{tierLabel(r.tier)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    <UsageBadge usage={r.usage} />
                  </td>
                  <td className="px-3 py-2">{formatDate(r.lastTapAt)}</td>
                  <td className="px-3 py-2">
                    <div>{formatDate(r.paidUntil)}</div>
                    <TermBadge term={r.term} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastPage > 1 && (
        <nav className="flex items-center justify-between pt-4 text-sm" aria-label="Pages">
          {filter.page > 1 ? (
            <Link href={clientsHref(filter, { page: filter.page - 1 })} className="underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-600">
            Page {filter.page} of {lastPage}
          </span>
          {filter.page < lastPage ? (
            <Link href={clientsHref(filter, { page: filter.page + 1 })} className="underline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

const CONTROL = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";

/** A plain GET form, so search and filters work without JavaScript and every view has a shareable URL. */
function Filters({ filter }: { filter: ClientFilter }) {
  return (
    <form method="get" action="/admin/clients" className="flex flex-wrap gap-2">
      <input
        name="q"
        defaultValue={filter.q ?? ""}
        placeholder="Search name, username or email"
        aria-label="Search"
        maxLength={60}
        className={`${CONTROL} min-w-0 flex-1 basis-56`}
      />
      <select name="tier" defaultValue={filter.tier ?? ""} aria-label="Tier" className={CONTROL}>
        <option value="">All tiers</option>
        {TIER_FILTERS.map((t) => (
          <option key={t} value={t}>
            {tierLabel(t)}
          </option>
        ))}
      </select>
      <select name="status" defaultValue={filter.status ?? ""} aria-label="Page status" className={CONTROL}>
        <option value="">Any status</option>
        {STATUS_FILTERS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      <select name="usage" defaultValue={filter.usage ?? ""} aria-label="Usage" className={CONTROL}>
        <option value="">Any usage</option>
        {USAGE_FILTERS.map((u) => (
          <option key={u} value={u}>
            {USAGE_LABEL[u]}
          </option>
        ))}
      </select>
      <select name="sort" defaultValue={filter.sort} aria-label="Sort by" className={CONTROL}>
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {SORT_LABEL[s]}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
        Apply
      </button>
    </form>
  );
}

/** Confirms a page that was just deleted (the delete button sends you here with ?deleted=username). */
async function DeletedNote({ searchParams }: Pick<PageProps<"/admin/clients">, "searchParams">) {
  const { deleted } = await searchParams;
  const name = Array.isArray(deleted) ? deleted[0] : deleted;
  if (!name) return null;
  return (
    <p role="status" className="adm-note">
      Deleted <span className="font-mono font-semibold">/{name.slice(0, 40)}</span> and everything that belonged to it.
    </p>
  );
}
