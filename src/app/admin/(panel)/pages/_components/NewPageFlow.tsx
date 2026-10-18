"use client";

import { useState } from "react";
import { orderToFormValues } from "@/lib/admin/order-import";
import { emptyFormValues, type FormValues } from "@/lib/admin/page-form";
import { decodeOrder } from "@/lib/order";
import { OrderLinkBuilder } from "./OrderLinkBuilder";
import { PageEditor } from "./PageEditor";

/**
 * The New page screen: start from a client's order (paste the message they sent) or from a blank form.
 * Importing only fills the form in: nothing is saved until you press Create.
 */
export function NewPageFlow() {
  const [initial, setInitial] = useState<FormValues>(() => emptyFormValues());
  const [round, setRound] = useState(0); // a new value remounts the editor with the imported values
  const [pasted, setPasted] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string; notes: string[] } | null>(null);

  const importOrder = () => {
    const r = decodeOrder(pasted);
    if (!r.ok) {
      setResult({ ok: false, text: r.message, notes: [] });
      return;
    }
    const { values, notes } = orderToFormValues(r.order, () => crypto.randomUUID());
    setInitial(values);
    setRound((n) => n + 1);
    setResult({ ok: true, text: `Filled in the form for ${r.order.name}. Check it, add the photo, and press Create.`, notes });
  };

  return (
    <>
      <details className="mb-5 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5" open={Boolean(result)}>
        <summary className="cursor-pointer text-base font-semibold">Start from a client&apos;s order</summary>
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Paste the message the client sent
            <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={5} placeholder="New Jibun order … JB1.…" className="rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-xs font-normal" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!pasted.trim()} onClick={importOrder} className="min-h-10 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white disabled:opacity-50">
              Fill in the form
            </button>
            <span className="text-xs text-neutral-600">This replaces what is in the form below.</span>
          </div>
          {result && (
            <div role={result.ok ? "status" : "alert"} className={`rounded-xl p-3 text-sm ${result.ok ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
              <p className="font-medium">{result.text}</p>
              {result.notes.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {result.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </details>

      <PageEditor key={round} mode="create" initial={initial} />

      <div className="pt-8">
        <OrderLinkBuilder />
      </div>
    </>
  );
}
