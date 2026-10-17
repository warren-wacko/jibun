"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { OpResult } from "@/lib/admin/renewal-ops";
import { deactivatePageAction, renewPageAction, setReminderSentAction } from "./actions";

const BASE =
  "rounded-lg border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";
const BTN = `${BASE} border-neutral-300 bg-white hover:bg-neutral-50`;
const PRIMARY = `${BASE} border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800`;

/** Reminder mark, renew and switch-off for one page in the renewals list. Each saves at once. */
export function RenewalActions({
  pageId,
  username,
  reminderSent,
  mailto,
  active,
  renewsTo,
}: {
  pageId: string;
  username: string;
  reminderSent: boolean;
  mailto: string | null;
  active: boolean;
  /** The date a renewal would extend the term to, shown in the confirmation. */
  renewsTo: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (job: () => Promise<OpResult>, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setNote(null);
    start(async () => {
      try {
        const r = await job();
        setNote(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.message });
        if (r.ok) router.refresh();
      } catch {
        setNote({ ok: false, text: "Could not reach the server." });
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {mailto && (
          <a href={mailto} className={BTN}>
            Email client
          </a>
        )}
        <button type="button" disabled={pending} className={BTN} onClick={() => run(() => setReminderSentAction(pageId, !reminderSent))}>
          {reminderSent ? "Undo reminder mark" : "Mark reminder sent"}
        </button>
        <button
          type="button"
          disabled={pending}
          className={PRIMARY}
          onClick={() => run(() => renewPageAction(pageId), `Renew /${username} for another 4 years (until ${renewsTo})? ${active ? "" : "The page will be switched back on. "}This clears the reminder mark.`)}
        >
          Renew +4 years
        </button>
        {active && (
          <button
            type="button"
            disabled={pending}
            className={`${BTN} text-red-800`}
            onClick={() => run(() => deactivatePageAction(pageId), `Switch /${username} off? Visitors will see the inactive page until it is renewed or turned back on.`)}
          >
            Mark inactive
          </button>
        )}
      </div>
      <p role={note && !note.ok ? "alert" : "status"} className={`min-h-4 text-xs ${note?.ok === false ? "font-medium text-red-700" : "text-green-800"}`}>
        {pending ? "Working…" : (note?.text ?? "")}
      </p>
    </div>
  );
}
