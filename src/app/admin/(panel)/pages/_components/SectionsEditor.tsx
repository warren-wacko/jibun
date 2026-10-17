"use client";

import { useRef, useState } from "react";
import { getEntitlements } from "@/lib/entitlements";
import {
  SECTION_ORDER_IN_PICKER,
  SECTION_SPECS,
  emptyDraft,
  emptyRow,
  picksUsed,
  sectionAvailability,
  type SectionDraft,
} from "@/lib/admin/section-drafts";
import type { SectionKind } from "@/lib/page-schema";
import { blockLabel, layoutFor, resolveOrder } from "@/templates/section-order";
import { supportedSections, unsupportedSections } from "@/templates/supported-sections";
import { CONTROL, FOCUS, useEditor } from "./ui";

const ICON_BTN =
  "inline-flex size-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40";

function ErrorText({ text }: { text: string | undefined }) {
  return text ? (
    <p role="alert" className="text-xs font-medium text-red-700">
      {text}
    </p>
  ) : null;
}

/** The rows of one section (gallery images, services, ...). Blank rows are left out when saving. */
function RowsEditor({ draft, index, update }: { draft: SectionDraft; index: number; update: (next: SectionDraft) => void }) {
  const { errorFor, touch } = useEditor();
  const spec = SECTION_SPECS[draft.kind];
  const nextId = useRef(draft.items.length + 100);
  const rows = draft.items;
  const setRows = (items: SectionDraft["items"]) => update({ ...draft, items });
  const move = (j: number, by: -1 | 1) => {
    const next = [...rows];
    const [item] = next.splice(j, 1);
    next.splice(j + by, 0, item);
    setRows(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {rows.map((row, j) => (
          <li key={row.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3" data-field={`sections.${index}.items.${j}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-neutral-600">
                {spec.rowLabel} {j + 1}
              </span>
              <div className="flex gap-1">
                <button type="button" className={`${ICON_BTN} ${FOCUS}`} disabled={j === 0} onClick={() => move(j, -1)} aria-label={`Move ${spec.rowLabel} ${j + 1} up`}>
                  ↑
                </button>
                <button type="button" className={`${ICON_BTN} ${FOCUS}`} disabled={j === rows.length - 1} onClick={() => move(j, 1)} aria-label={`Move ${spec.rowLabel} ${j + 1} down`}>
                  ↓
                </button>
                <button type="button" className={`${ICON_BTN} ${FOCUS} text-red-700`} onClick={() => setRows(rows.filter((r) => r.id !== row.id))} aria-label={`Remove ${spec.rowLabel} ${j + 1}`}>
                  ✕
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(spec.fields ?? []).map((f) => {
                const key = `sections.${index}.items.${j}.${f.key}`;
                const error = errorFor(key);
                return (
                  <label key={f.key} className="flex min-w-0 flex-col gap-1 text-xs font-medium text-neutral-700">
                    {f.label}
                    {f.optional ? " (optional)" : ""}
                    <input
                      value={row[f.key] ?? ""}
                      placeholder={f.placeholder}
                      maxLength={f.max}
                      inputMode={f.type === "url" ? "url" : undefined}
                      aria-invalid={Boolean(error)}
                      onBlur={() => touch(key)}
                      onChange={(e) => setRows(rows.map((r) => (r.id === row.id ? { ...r, [f.key]: e.target.value } : r)))}
                      className={`${CONTROL} ${FOCUS} font-normal`}
                    />
                    <ErrorText text={error} />
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={rows.length >= (spec.maxRows ?? 20)}
          onClick={() => setRows([...rows, emptyRow(draft.kind, `${draft.id}-r${nextId.current++}`)])}
          className={`rounded-lg border border-neutral-900 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-100 disabled:opacity-40 ${FOCUS}`}
        >
          + Add {spec.rowLabel?.toLowerCase()}
        </button>
        <span className="text-xs text-neutral-600">
          {rows.length}/{spec.maxRows}
        </span>
      </div>
      <ErrorText text={errorFor(`sections.${index}.items`)} />
    </div>
  );
}

function SectionBody({ draft, index, update }: { draft: SectionDraft; index: number; update: (next: SectionDraft) => void }) {
  const { errorFor, touch } = useEditor();
  const spec = SECTION_SPECS[draft.kind];

  if (spec.mode === "rows") return <RowsEditor draft={draft} index={index} update={update} />;

  if (spec.mode === "lines") {
    const key = `sections.${index}.text`;
    const lines = draft.text.split(/\r?\n/).filter((l) => l.trim()).length;
    return (
      <label className="flex flex-col gap-1 text-xs font-medium text-neutral-700">
        {spec.label} (one per line)
        <textarea
          value={draft.text}
          rows={5}
          aria-invalid={Boolean(errorFor(key))}
          onBlur={() => touch(key)}
          onChange={(e) => update({ ...draft, text: e.target.value })}
          className={`${CONTROL} ${FOCUS} font-normal`}
        />
        <span className="font-normal text-neutral-600">
          {lines} of up to {spec.maxLines}, each up to {spec.maxLine} characters
        </span>
        <ErrorText text={errorFor(key)} />
      </label>
    );
  }

  if (spec.mode === "link") {
    const key = `sections.${index}.url`;
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-700">
          {spec.urlLabel}
          <input
            value={draft.url}
            placeholder={spec.urlPlaceholder}
            inputMode="url"
            aria-invalid={Boolean(errorFor(key))}
            onBlur={() => touch(key)}
            onChange={(e) => update({ ...draft, url: e.target.value })}
            className={`${CONTROL} ${FOCUS} font-normal`}
          />
          <ErrorText text={errorFor(key)} />
        </label>
        {(spec.extras ?? []).map((x) => (
          <label key={x.key} className="flex flex-col gap-1 text-xs font-medium text-neutral-700">
            {x.label}
            <input value={draft[x.field]} maxLength={x.max} placeholder={x.placeholder} onChange={(e) => update({ ...draft, [x.field]: e.target.value })} className={`${CONTROL} ${FOCUS} font-normal`} />
            <ErrorText text={errorFor(`sections.${index}.${x.field}`)} />
          </label>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-neutral-600">{spec.help}</p>;
}

/** The order of the page's blocks and sections (Standard and up). */
function OrderPanel() {
  const { values, set, errorFor } = useEditor();
  const kinds = values.sections.map((s) => s.kind);
  const order = resolveOrder(values.templateKey, kinds, values.sectionOrder);
  const custom = values.sectionOrder.length > 0;
  if (order.length < 2) return null;

  const label = (token: string) => blockLabel(values.templateKey, token) ?? SECTION_SPECS[token as SectionKind]?.label ?? token;
  const isSection = (token: string) => kinds.includes(token as SectionKind);
  const move = (i: number, by: -1 | 1) => {
    const next = [...order];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    set("sectionOrder", next);
  };
  const hasBlocks = layoutFor(values.templateKey).blocks.length > 0;

  return (
    <div className="rounded-lg border border-neutral-200 p-3" data-field="sectionOrder">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Order on the page</p>
        {custom && (
          <button type="button" onClick={() => set("sectionOrder", [])} className={`text-xs underline ${FOCUS}`}>
            Back to the template&rsquo;s order
          </button>
        )}
      </div>
      <p className="mb-2 text-xs text-neutral-600">
        {hasBlocks ? "Move sections between this template’s own blocks, or reorder the blocks." : "Move the sections up or down."} Top is first on the page.
      </p>
      <ol className="flex flex-col gap-1">
        {order.map((token, i) => (
          <li key={token} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm ${isSection(token) ? "border-neutral-300 bg-white" : "border-dashed border-neutral-300 bg-neutral-50 text-neutral-700"}`}>
            <span>
              {label(token)}
              {!isSection(token) && <span className="text-xs text-neutral-500"> · built in</span>}
            </span>
            <span className="flex gap-1">
              <button type="button" className={`${ICON_BTN} ${FOCUS}`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${label(token)} up`}>
                ↑
              </button>
              <button type="button" className={`${ICON_BTN} ${FOCUS}`} disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${label(token)} down`}>
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <ErrorText text={errorFor("sectionOrder")} />
    </div>
  );
}

/** Add, fill in, remove and order the page's optional sections. What can be added follows the tier and add-ons. */
export function SectionsEditor() {
  const { values, set, errorFor } = useEditor();
  const ent = getEntitlements({ tier: values.tier, addOns: values.addOns });
  const nextId = useRef(values.sections.length + 100);
  const [adding, setAdding] = useState<SectionKind | "">("");
  const kinds = values.sections.map((s) => s.kind);

  const update = (next: SectionDraft) => set("sections", values.sections.map((s) => (s.id === next.id ? next : s)));
  const remove = (id: string) => set("sections", values.sections.filter((s) => s.id !== id));
  const add = (kind: SectionKind) => {
    set("sections", [...values.sections, emptyDraft(kind, `sd${nextId.current++}`)]);
    setAdding("");
  };

  const options = SECTION_ORDER_IN_PICKER.map((kind) => ({ kind, availability: sectionAvailability(kind, kinds, ent) }));
  const anyAddable = options.some((o) => o.availability.ok);
  const free = ent.includedOptionalSections;
  const shownKinds = supportedSections(values.templateKey);
  const hidden = unsupportedSections(values.templateKey, kinds);

  return (
    <div className="flex flex-col gap-4" data-field="sections">
      <p className="text-sm text-neutral-700">
        {free === Infinity ? "Any number of sections." : free === 0 ? "This tier has no free sections." : `${picksUsed(kinds, ent)} of ${free} free sections used.`} Gallery, video,
        résumé and booking sections come with their add-ons and do not use a free pick.
      </p>
      {shownKinds.length === 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          This template does not show optional sections yet. They are saved with the page and will appear once its Standard design is built.
        </p>
      ) : (
        hidden.length > 0 && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            This template has no design yet for {hidden.map((k) => SECTION_SPECS[k].label).join(", ")}. {hidden.length === 1 ? "It is" : "They are"} saved with the page but not shown.
          </p>
        )
      )}
      <ErrorText text={errorFor("sections")} />

      {values.sections.length === 0 && <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-600">No optional sections.</p>}

      <div className="flex flex-col gap-3">
        {values.sections.map((draft, i) => {
          const spec = SECTION_SPECS[draft.kind];
          const own = errorFor(`sections.${i}`);
          return (
            <details key={draft.id} open className="rounded-lg border border-neutral-300" data-field={`sections.${i}`}>
              <summary className={`flex cursor-pointer select-none items-center justify-between gap-2 px-3 py-2 ${FOCUS}`}>
                <span className="font-medium">
                  {spec.label}
                  <span className="font-normal text-neutral-600"> · {spec.help}</span>
                </span>
                <button
                  type="button"
                  className={`rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-50 ${FOCUS}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm(`Remove the ${spec.label} section and what is in it?`)) remove(draft.id);
                  }}
                >
                  Remove
                </button>
              </summary>
              <div className="flex flex-col gap-3 border-t border-neutral-200 p-3">
                <ErrorText text={own} />
                <SectionBody draft={draft} index={i} update={update} />
              </div>
            </details>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 flex-1 basis-56 flex-col gap-1 text-sm font-medium">
          Add a section
          <select value={adding} onChange={(e) => setAdding(e.target.value as SectionKind | "")} className={`${CONTROL} ${FOCUS} font-normal`}>
            <option value="">{anyAddable ? "Choose a section…" : "No more sections can be added"}</option>
            {options.map(({ kind, availability }) => (
              <option key={kind} value={kind} disabled={!availability.ok}>
                {SECTION_SPECS[kind].label}
                {availability.ok ? ` (${availability.note.toLowerCase()})` : ` (${availability.reason})`}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={!adding} onClick={() => adding && add(adding)} className={`rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${FOCUS}`}>
          Add section
        </button>
      </div>

      {ent.sectionReordering ? (
        <OrderPanel />
      ) : (
        <p className="text-xs text-neutral-600">Changing the order of the page needs the Standard tier.</p>
      )}
    </div>
  );
}
