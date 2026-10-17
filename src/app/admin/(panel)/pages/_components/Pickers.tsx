"use client";

import type { ReactNode } from "react";
import { PAGE_STATUSES, type PageStatusValue } from "@/lib/admin/page-form";
import { ADD_ONS, PUBLIC_TIERS, getEntitlements, type AddOn, type Tier } from "@/lib/entitlements";
import { CUSTOM_TEMPLATE_RE, TEMPLATE_KEYS, TEMPLATE_OPTIONS } from "@/templates/keys";
import { CONTROL, FOCUS, FieldShell, useEditor } from "./ui";

const TIER_INFO: Record<Tier, { label: string; blurb: string }> = {
  STARTER: { label: "Starter", blurb: "Preset colours, no optional sections" },
  STANDARD: { label: "Standard", blurb: "Any colour, font pairs, 2 optional sections" },
  CUSTOM: { label: "Custom (quoted)", blurb: "Everything, priced per job" },
};

/** One choice in a radio group: a card that shows which option is selected. */
function RadioCard({
  name,
  value,
  checked,
  onSelect,
  title,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  children?: ReactNode;
}) {
  return (
    <label
      className={`relative flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-neutral-900 ${
        checked ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900" : "border-neutral-300 bg-white hover:bg-neutral-50"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      <span className="font-semibold text-neutral-900">{title}</span>
      {children && <span className="text-xs text-neutral-600">{children}</span>}
    </label>
  );
}

export function TierPicker() {
  const { values, set } = useEditor();
  const ent = getEntitlements({ tier: values.tier, addOns: values.addOns });
  const facts = [
    ent.accent === "hex" ? "any accent colour" : "preset accent colours",
    ent.includedOptionalSections === Infinity ? "unlimited optional sections" : `${ent.includedOptionalSections} optional sections`,
    ent.revisions === null ? "revisions as quoted" : `${ent.revisions + (ent.addOns.has("extra_revision") ? 1 : 0)} revisions`,
    ent.smallEdits === null ? "edits as quoted" : `${ent.smallEdits} small edits in year one`,
  ];
  return (
    <FieldShell name="tier" label="Tier">
      {() => (
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tier">
            {PUBLIC_TIERS.map((t) => (
              <RadioCard key={t} name="tier" value={t} checked={values.tier === t} onSelect={() => set("tier", t)} title={TIER_INFO[t].label}>
                {TIER_INFO[t].blurb}
              </RadioCard>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
            Admin only
            <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
          </div>
          <div role="radiogroup" aria-label="Custom tier">
            <RadioCard name="tier" value="CUSTOM" checked={values.tier === "CUSTOM"} onSelect={() => set("tier", "CUSTOM")} title={TIER_INFO.CUSTOM.label}>
              {TIER_INFO.CUSTOM.blurb}
            </RadioCard>
          </div>
          <p className="text-xs text-neutral-600">This tier includes: {facts.join(" · ")}.</p>
        </div>
      )}
    </FieldShell>
  );
}

export function TemplatePicker() {
  const { values, set, touch } = useEditor();
  const ent = getEntitlements({ tier: values.tier, addOns: values.addOns });
  const isCustomKey = !TEMPLATE_KEYS.includes(values.templateKey);
  const groups = ["Professional", "Student", "Social"] as const;
  return (
    <FieldShell name="templateKey" label="Template" hint="Every template is available on every tier. The preview updates as you choose.">
      {({ id, describedBy, invalid }) => (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g}>
              <p className="mb-1.5 text-xs font-medium text-neutral-600">{g}</p>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={`${g} templates`}>
                {TEMPLATE_OPTIONS.filter((t) => t.group === g).map((t) => (
                  <RadioCard key={t.key} name="templateKey" value={t.key} checked={values.templateKey === t.key} onSelect={() => set("templateKey", t.key)} title={t.label}>
                    {t.blurb}
                  </RadioCard>
                ))}
              </div>
            </div>
          ))}
          {ent.customComponent && (
            <div className="flex flex-col gap-1">
              <label htmlFor={id} className="text-xs font-medium text-neutral-600">
                Or a one-off component made for this client
              </label>
              <input
                id={id}
                value={isCustomKey ? values.templateKey : ""}
                placeholder="custom-maria"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                spellCheck={false}
                onBlur={() => touch("templateKey")}
                onChange={(e) => set("templateKey", e.target.value.trim().toLowerCase() || "pro-classic")}
                className={`${CONTROL} ${FOCUS} max-w-xs font-mono`}
              />
              {isCustomKey && !CUSTOM_TEMPLATE_RE.test(values.templateKey) && (
                <p className="text-xs text-amber-800">Use a name like custom-maria. Until its file exists, the placeholder is shown.</p>
              )}
            </div>
          )}
        </div>
      )}
    </FieldShell>
  );
}

const ADD_ON_LABEL: Record<AddOn, string> = {
  gallery: "Gallery",
  video: "Video",
  pdf: "PDF résumé",
  contact_form: "Contact form",
  booking: "Booking link",
  analytics: "Analytics",
  custom_domain: "Custom domain",
  remove_branding: "Remove branding",
  extra_revision: "Extra revision",
};

export function AddOnPicker() {
  const { values, set } = useEditor();
  const custom = values.tier === "CUSTOM";
  const toggle = (a: AddOn, on: boolean) => set("addOns", on ? [...values.addOns, a] : values.addOns.filter((x) => x !== a));
  return (
    <FieldShell
      name="addOns"
      label="Paid add-ons"
      hint={custom ? "Custom pages have every add-on." : "Add-ons the client bought. Any tier can buy any add-on."}
    >
      {() => (
        <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Add-ons">
          {ADD_ONS.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={custom || values.addOns.includes(a)}
                disabled={custom}
                onChange={(e) => toggle(a, e.target.checked)}
                className={`size-4 rounded border-neutral-400 ${FOCUS}`}
              />
              {ADD_ON_LABEL[a]}
            </label>
          ))}
        </div>
      )}
    </FieldShell>
  );
}

const STATUS_INFO: Record<PageStatusValue, { label: string; hint: string }> = {
  DRAFT: { label: "Draft", hint: "Visible to anyone with the link while you work on it; taps and downloads are off." },
  ACTIVE: { label: "Active", hint: "Live. Needs a paid-until date. Taps, Save Contact and QR work." },
  INACTIVE: { label: "Inactive", hint: "Hidden. Visitors see the “card inactive” page." },
};

export function StatusPicker() {
  const { values, set } = useEditor();
  return (
    <FieldShell name="status" label="Page status" hint={STATUS_INFO[values.status].hint}>
      {({ id }) => (
        <select id={id} value={values.status} onChange={(e) => set("status", e.target.value as PageStatusValue)} className={`${CONTROL} ${FOCUS}`}>
          {PAGE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_INFO[s].label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
