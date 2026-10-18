"use client";

import { useState } from "react";
import { ADD_ONS } from "@/lib/entitlements";
import { ADD_ON_LABEL, buildOrderLink, type OrderPlan } from "@/lib/order";
import { TEMPLATE_OPTIONS } from "@/templates/keys";

/** Makes the link you send a client: their plan and add-ons are filled in on the form they open. */
export function OrderLinkBuilder() {
  const [plan, setPlan] = useState<OrderPlan>("starter");
  const [addOns, setAddOns] = useState<(typeof ADD_ONS)[number][]>([]);
  const [template, setTemplate] = useState("");
  const [copied, setCopied] = useState(false);

  const link = buildOrderLink(typeof window === "undefined" ? "" : window.location.origin, { plan, addOns, template });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", link);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5" aria-labelledby="olb-title">
      <h2 id="olb-title">Order link for a client</h2>
      <p className="mt-1 text-sm text-neutral-600">Pick their plan and add-ons, copy the link and send it. They answer the form and send the answers back to you in the chat.</p>

      <div className="mt-4 flex flex-col gap-4">
        <div role="radiogroup" aria-label="Plan" className="flex flex-wrap gap-2">
          {(["starter", "standard"] as const).map((p) => (
            <label key={p} className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold ${plan === p ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"}`}>
              <input type="radio" name="olb-plan" className="sr-only" checked={plan === p} onChange={() => setPlan(p)} />
              {p === "starter" ? "Starter" : "Standard"}
            </label>
          ))}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Add-ons</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {ADD_ONS.map((a) => (
              <label key={a} className="flex min-h-10 items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-neutral-900" checked={addOns.includes(a)} onChange={(e) => setAddOns((p) => (e.target.checked ? [...p, a] : p.filter((x) => x !== a)))} />
                {ADD_ON_LABEL[a]}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex max-w-xs flex-col gap-1 text-sm font-medium">
          Suggested design (optional)
          <select value={template} onChange={(e) => setTemplate(e.target.value)} className="min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-base font-normal sm:text-sm">
            <option value="">They choose</option>
            {TEMPLATE_OPTIONS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 basis-60 truncate rounded-lg bg-neutral-100 px-3 py-2 text-xs" title={link}>
            {link}
          </code>
          <button type="button" onClick={copy} className="min-h-10 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white">
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="text-xs text-neutral-600">The plan in the link only pre-fills the form. You decide the real plan and add-ons when you save the page.</p>
      </div>
    </section>
  );
}
