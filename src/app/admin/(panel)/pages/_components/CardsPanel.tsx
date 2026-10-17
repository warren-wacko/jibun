"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CARD_LABEL_MAX,
  CARD_STATUS_HELP,
  CARD_STATUS_LABEL,
  MAX_CARDS_PER_PAGE,
  cardWarnings,
  type CardStatusValue,
} from "@/lib/admin/card-urls";
import type { CardResult } from "@/lib/admin/cards";
import type { UsageStatus } from "@/lib/usage";
import { UsageBadge, formatDate } from "../../../_components/badges";
import { addCardAction, deleteCardAction, resetCardUsageAction, updateCardAction } from "../card-actions";
import { CONTROL, FOCUS } from "./ui";

export type CardInfo = {
  id: string;
  code: string;
  label: string | null;
  status: CardStatusValue;
  lastTapAt: string | null;
  taps: number;
  chipUrl: string;
  qrTarget: string;
};

export type PageUsage = { totalTaps: number; lastTapAt: string | null; usage: UsageStatus };

const BTN = `rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const STATUS_STYLE: Record<CardStatusValue, string> = {
  ACTIVE: "bg-green-100 text-green-900",
  DISABLED: "bg-neutral-200 text-neutral-800",
  LOST: "bg-red-100 text-red-900",
};

const date = (iso: string | null) => formatDate(iso ? new Date(iso) : null);

/** A link with a Copy button next to it. */
function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", value);
    }
  };
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-neutral-600">{label}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded bg-neutral-100 px-2 py-1 text-xs" title={value}>
          {value}
        </code>
        <button type="button" onClick={copy} className={`${BTN} shrink-0 px-2.5 py-1 text-xs`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function CardItem({ card, canDelete, run, busy }: { card: CardInfo; canDelete: boolean; run: (job: () => Promise<CardResult>, confirm?: string) => void; busy: boolean }) {
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(card.label ?? "");
  const used = card.taps > 0 || card.lastTapAt !== null;

  const saveLabel = () => {
    setRenaming(false);
    if (label.trim() !== (card.label ?? "")) run(() => updateCardAction(card.id, { label }));
  };

  return (
    <li className="rounded-lg border border-neutral-200 p-3 sm:p-4" data-card={card.code}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-lg font-semibold tracking-wider">{card.code}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[card.status]}`}>{CARD_STATUS_LABEL[card.status]}</span>
        {renaming ? (
          <input
            autoFocus
            value={label}
            maxLength={CARD_LABEL_MAX}
            aria-label={`Label for card ${card.code}`}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveLabel();
              }
              if (e.key === "Escape") {
                setLabel(card.label ?? "");
                setRenaming(false);
              }
            }}
            className={`${CONTROL} ${FOCUS} max-w-48 py-1`}
          />
        ) : (
          <button type="button" onClick={() => setRenaming(true)} className={`text-sm text-neutral-700 underline-offset-2 hover:underline ${FOCUS}`} title="Rename">
            {card.label ?? "No label"}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-600">{CARD_STATUS_HELP[card.status]}</p>

      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-3">
          <CopyRow label="Chip link (write this to the NFC chip)" value={card.chipUrl} />
          <CopyRow label="QR link (what the QR code opens)" value={card.qrTarget} />
          <p className="text-sm text-neutral-700">
            {card.taps} {card.taps === 1 ? "tap" : "taps"} · last tapped {date(card.lastTapAt)}
          </p>
        </div>
        <div className="flex items-start gap-3 sm:flex-col sm:items-center">
          <div className="rounded-lg border border-neutral-200 bg-white p-1.5">
            <Image src={`/admin/cards/${card.code}/qr`} alt={`QR code for card ${card.code}`} width={96} height={96} unoptimized />
          </div>
          <a href={`/admin/cards/${card.code}/qr?format=png`} download className={`text-xs underline ${FOCUS}`}>
            Download PNG
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
        {card.status === "ACTIVE" ? (
          <>
            <button type="button" disabled={busy} className={BTN} onClick={() => run(() => updateCardAction(card.id, { status: "DISABLED" }), `Disable card ${card.code}? Taps will show the inactive page until you turn it back on.`)}>
              Disable
            </button>
            <button type="button" disabled={busy} className={`${BTN} text-red-800`} onClick={() => run(() => updateCardAction(card.id, { status: "LOST" }), `Mark card ${card.code} as lost? It stops working right away.`)}>
              Mark lost
            </button>
          </>
        ) : (
          <button type="button" disabled={busy} className={BTN} onClick={() => run(() => updateCardAction(card.id, { status: "ACTIVE" }))}>
            Turn on
          </button>
        )}
        <button
          type="button"
          disabled={busy || !used}
          className={BTN}
          title="Removes this card's taps, so test taps do not count as the client's first use"
          onClick={() => run(() => resetCardUsageAction(card.id), `Reset usage for card ${card.code}? Its ${card.taps} ${card.taps === 1 ? "tap is" : "taps are"} deleted for good.`)}
        >
          Reset usage
        </button>
        {canDelete && (
          <button type="button" disabled={busy} className={`${BTN} ml-auto text-red-800`} onClick={() => run(() => deleteCardAction(card.id), `Delete card ${card.code}? This cannot be undone.`)}>
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Manage a page's cards: add a spare, copy the chip link, see and download the QR, mark a card lost or
 * disabled, and reset test taps. Each action saves at once (it is not part of the page form).
 */
export function CardsPanel({ username, cards, usage }: { username: string; cards: CardInfo[]; usage: PageUsage }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newLabel, setNewLabel] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const warnings = cardWarnings(cards);

  const run = (job: () => Promise<CardResult>, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setNote(null);
    start(async () => {
      try {
        const r = await job();
        setNote(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.message });
        if (r.ok) router.refresh();
      } catch {
        setNote({ ok: false, text: "Could not reach the server. Try again." });
      }
    });
  };

  return (
    <section id="cards" className="scroll-mt-20 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5" aria-labelledby="cards-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="cards-title" className="text-base font-semibold">
            Cards and QR
          </h2>
          <p className="mt-0.5 text-sm text-neutral-600">Changes here save immediately.</p>
        </div>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Usage</dt>
            <dd>
              <UsageBadge usage={usage.usage} />
            </dd>
          </div>
          <div>
            <dt className="inline text-neutral-600">Total taps </dt>
            <dd className="inline font-medium">{usage.totalTaps}</dd>
          </div>
          <div>
            <dt className="inline text-neutral-600">Last tapped </dt>
            <dd className="inline font-medium">{date(usage.lastTapAt)}</dd>
          </div>
        </dl>
      </div>

      {warnings.map((w) => (
        <p key={w} role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {w}
        </p>
      ))}

      {cards.length > 0 && (
        <ul className="flex flex-col gap-3">
          {cards.map((c) => (
            <CardItem key={c.id} card={c} canDelete={c.taps === 0 && cards.length > 1} run={run} busy={pending} />
          ))}
        </ul>
      )}

      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await addCardAction(username, newLabel);
            if (r.ok) setNewLabel("");
            return r;
          });
        }}
      >
        <label className="flex min-w-0 flex-1 basis-48 flex-col gap-1 text-sm font-medium">
          Add a card (for example a spare)
          <input value={newLabel} maxLength={CARD_LABEL_MAX} placeholder="Label, e.g. Spare" onChange={(e) => setNewLabel(e.target.value)} className={`${CONTROL} ${FOCUS} font-normal`} />
        </label>
        <button type="submit" disabled={pending || cards.length >= MAX_CARDS_PER_PAGE} className={`rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${FOCUS}`}>
          Add card
        </button>
      </form>

      <p role={note && !note.ok ? "alert" : "status"} className={`mt-3 min-h-5 text-sm ${note?.ok === false ? "font-medium text-red-700" : "text-green-800"}`}>
        {pending ? "Working…" : (note?.text ?? "")}
      </p>
      <p className="text-xs text-neutral-600">
        The QR code on the public page uses the first active card. A tap on a lost, disabled or unknown card, or on a page that is not live, shows the inactive page.
      </p>
    </section>
  );
}
