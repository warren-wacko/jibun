import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { chipUrl, qrTargetUrl } from "@/lib/admin/card-urls";
import { describeTierChange } from "@/lib/admin/tier-change";
import { formatDate } from "../../../_components/badges";
import { valuesFromPage } from "@/lib/admin/page-form";
import { db } from "@/lib/db";
import { safeParsePageData } from "@/lib/page-schema";
import { pageUrl } from "@/lib/site";
import { validateUsername } from "@/lib/usernames";
import { getUsageStatus } from "@/lib/usage";
import { CardsPanel, type CardInfo } from "../_components/CardsPanel";
import { PageEditor } from "../_components/PageEditor";

export const metadata: Metadata = { title: "Edit page" };

export default function EditPage({ params, searchParams }: PageProps<"/admin/pages/[username]">) {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading page…</p>}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Editor({ params, searchParams }: Pick<PageProps<"/admin/pages/[username]">, "params" | "searchParams">) {
  const { username } = await params;
  const { created } = await searchParams;
  if (!validateUsername(username).ok) notFound();

  const row = await db.page.findUnique({
    where: { username },
    include: { client: true, cards: { orderBy: { createdAt: "asc" }, include: { _count: { select: { taps: true } } } }, _count: { select: { taps: true } }, tierChanges: { orderBy: { createdAt: "desc" } } },
  });
  if (!row) notFound();

  const parsed = safeParsePageData(row.data);
  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-4">
      <h1 className="text-xl font-semibold">
        {row.client.name} <span className="font-mono text-base font-normal text-neutral-600">/{row.username}</span>
      </h1>
      <nav className="flex gap-4 text-sm">
        <a href="#cards" className="underline">
          Cards and QR
        </a>
        <Link href="/admin/clients" className="underline">
          Back to clients
        </Link>
      </nav>
    </div>
  );

  if (!parsed.success) {
    return (
      <>
        {header}
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">This page&rsquo;s stored content is not valid, so it cannot be edited here.</p>
          <ul className="mt-2 list-disc pl-5">
            {parsed.error.issues.slice(0, 8).map((i, n) => (
              <li key={n}>
                <span className="font-mono">{i.path.join(".") || "(root)"}</span>: {i.message}
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  const values = valuesFromPage({
    username: row.username,
    tier: row.tier,
    templateKey: row.templateKey,
    status: row.status,
    paidUntil: row.paidUntil,
    addOns: row.addOns,
    data: parsed.data,
    client: row.client,
  });

  const firstCard = row.cards[0];
  const cards: CardInfo[] = row.cards.map((c) => ({
    id: c.id,
    code: c.code,
    label: c.label,
    status: c.status,
    lastTapAt: c.lastTapAt?.toISOString() ?? null,
    taps: c._count.taps,
    chipUrl: chipUrl(c.code),
    qrTarget: qrTargetUrl(c.code),
  }));
  return (
    <>
      {header}
      {created && (
        <div role="status" className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-medium">Page created.</p>
          {firstCard && (
            <p className="mt-1">
              Its first card code is <span className="font-mono font-semibold">{firstCard.code}</span>. Write this link to the chip:{" "}
              <span className="font-mono">{chipUrl(firstCard.code)}</span>
            </p>
          )}
        </div>
      )}
      <PageEditor
        mode="edit"
        initial={values}
        page={{
          id: row.id,
          username: row.username,
          editsUsed: row.editsUsed,
          publicUrl: pageUrl(row.username),
          tierChanges: row.tierChanges.map((c) => ({ id: c.id, text: describeTierChange(c), date: formatDate(c.createdAt), note: c.note })),
        }}
      />
      <div className="pt-6">
        <CardsPanel
          username={row.username}
          cards={cards}
          usage={{
            totalTaps: row._count.taps,
            lastTapAt: row.lastTapAt?.toISOString() ?? null,
            usage: getUsageStatus(row.lastTapAt, row.createdAt, new Date()),
          }}
        />
      </div>
    </>
  );
}
