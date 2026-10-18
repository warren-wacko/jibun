"use client";

import type { Tier } from "@/lib/entitlements";
import { TIER_LABEL, isUpgrade, type TierChangeForm } from "@/lib/admin/tier-change";
import { CONTROL, FOCUS, FieldShell } from "./ui";

/**
 * Shown when an existing page's tier is changed in the form. The change is only saved together with what was paid
 * for it and whether a customized printed card is included; username, cards and content stay as they are.
 */
export function TierChangePanel({
  from,
  to,
  form,
  onChange,
}: {
  from: Tier;
  to: Tier;
  form: TierChangeForm;
  onChange: (next: TierChangeForm) => void;
}) {
  const upgrade = isUpgrade(from, to);
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4" data-field="tierChange" role="group" aria-label="Record the tier change">
      <div>
        <p className="font-semibold text-amber-950">
          {upgrade ? "Upgrade" : "Downgrade"}: {TIER_LABEL[from]} → {TIER_LABEL[to]}
        </p>
        <p className="mt-0.5 text-sm text-amber-950">
          Record what was paid to save this change. The username, cards and content stay the same.
          {!upgrade && " Colours and sections must fit the lower tier before it can be saved."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell name="tierAmount" label="Amount paid (₱)" hint="The price difference the client paid. Use 0 if there was no charge.">
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              name="tierAmount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="800"
              value={form.amount}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              onChange={(e) => onChange({ ...form, amount: e.target.value })}
              className={`${CONTROL} ${FOCUS}`}
            />
          )}
        </FieldShell>
        <FieldShell name="tierNote" label="Note" optional hint="For example how it was paid.">
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              name="tierNote"
              maxLength={200}
              autoComplete="off"
              value={form.note}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              onChange={(e) => onChange({ ...form, note: e.target.value })}
              className={`${CONTROL} ${FOCUS}`}
            />
          )}
        </FieldShell>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.reprint}
          onChange={(e) => onChange({ ...form, reprint: e.target.checked })}
          className={`mt-0.5 size-4 rounded border-neutral-400 ${FOCUS}`}
        />
        <span>
          <span className="font-medium">A customized printed card was requested</span>
          <span className="block text-xs text-neutral-700">Cards are plain by default in both tiers. Tick this only if the client asked for a customized printed card; otherwise they keep the card they have.</span>
        </span>
      </label>
    </div>
  );
}
