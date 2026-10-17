"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import type { FormValues } from "@/lib/admin/page-form";

/** What every field needs from the editor: the values, a setter, and the errors to show for a field. */
export type EditorContextValue = {
  values: FormValues;
  set: <K extends keyof FormValues>(name: K, value: FormValues[K]) => void;
  /** The error to show for a field, or undefined (errors appear once a field was touched or a save was attempted). */
  errorFor: (field: string) => string | undefined;
  touch: (field: string) => void;
  /** All current errors, ignoring whether they are visible yet (used for section counts). */
  allErrors: Record<string, string>;
};

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside the page editor");
  return ctx;
}

export const CONTROL =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-500 aria-[invalid=true]:border-red-600 sm:text-sm";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

/** Label, control, hint and error laid out the same everywhere. `children` gets the ids to wire up. */
export function FieldShell({
  name,
  label,
  hint,
  optional,
  children,
  className = "",
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}) {
  const { errorFor } = useEditor();
  const id = useId();
  const error = errorFor(name);
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div data-field={name} className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-neutral-900">
        {label}
        {optional && <span className="font-normal text-neutral-500"> (optional)</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-neutral-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

type StringKey = {
  [K in keyof FormValues]: FormValues[K] extends string ? K : never;
}[keyof FormValues];

export function TextField({
  name,
  label,
  hint,
  optional,
  type = "text",
  placeholder,
  maxLength,
  multiline,
  rows = 4,
  disabled,
  inputMode,
  autoComplete,
  className,
  counter,
}: {
  name: StringKey;
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  type?: "text" | "email" | "url" | "tel" | "date";
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  inputMode?: "text" | "email" | "url" | "tel" | "numeric";
  autoComplete?: string;
  className?: string;
  counter?: boolean;
}) {
  const { values, set, touch } = useEditor();
  const value = values[name] as string;
  return (
    <FieldShell
      name={name}
      label={label}
      hint={
        counter && maxLength ? (
          <>
            {hint} <span aria-hidden="true">{hint ? " · " : ""}{value.length}/{maxLength}</span>
          </>
        ) : (
          hint
        )
      }
      optional={optional}
      className={className}
    >
      {({ id, describedBy, invalid }) => {
        const common = {
          id,
          name,
          value,
          placeholder,
          disabled,
          maxLength,
          autoComplete: autoComplete ?? "off",
          "aria-invalid": invalid,
          "aria-describedby": describedBy,
          className: `${CONTROL} ${FOCUS}`,
          onBlur: () => touch(name),
        };
        return multiline ? (
          <textarea {...common} rows={rows} onChange={(e) => set(name, e.target.value as never)} />
        ) : (
          <input {...common} type={type} inputMode={inputMode} onChange={(e) => set(name, e.target.value as never)} />
        );
      }}
    </FieldShell>
  );
}

export function SelectField<K extends StringKey>({
  name,
  label,
  hint,
  optional,
  options,
  className,
}: {
  name: K;
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  options: readonly { value: string; label: string }[];
  className?: string;
}) {
  const { values, set, touch } = useEditor();
  return (
    <FieldShell name={name} label={label} hint={hint} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          name={name}
          value={values[name] as string}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`${CONTROL} ${FOCUS}`}
          onBlur={() => touch(name)}
          onChange={(e) => set(name, e.target.value as never)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

type BoolKey = { [K in keyof FormValues]: FormValues[K] extends boolean ? K : never }[keyof FormValues];

export function CheckField({ name, label, hint, disabled }: { name: BoolKey; label: string; hint?: ReactNode; disabled?: boolean }) {
  const { values, set } = useEditor();
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={values[name] as boolean}
        disabled={disabled}
        onChange={(e) => set(name, e.target.checked as never)}
        className={`mt-0.5 size-4 rounded border-neutral-400 ${FOCUS}`}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-neutral-900">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs text-neutral-600">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/** A titled group of fields. Shows how many of its fields have problems. */
export function FormSection({
  title,
  description,
  fields,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  /** Field names that belong here, to count their errors on the heading. */
  fields: readonly string[];
  children: ReactNode;
  id?: string;
}) {
  const { allErrors, errorFor } = useEditor();
  // Only problems the admin can already see count; a blank new form should not look broken.
  const problems = Object.keys(allErrors).filter((k) => fields.some((f) => k === f || k.startsWith(`${f}.`)) && errorFor(k)).length;
  return (
    <section id={id} className="scroll-mt-20 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-neutral-600">{description}</p>}
        </div>
        {problems > 0 && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-900">
            {problems} to fix
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>;
}
