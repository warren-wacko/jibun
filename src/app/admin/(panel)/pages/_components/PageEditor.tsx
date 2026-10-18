"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import {
  parsePreviewData,
  suggestUsername,
  validateForm,
  type FieldErrors,
  type FormValues,
} from "@/lib/admin/page-form";
import { getEntitlements } from "@/lib/entitlements";
import { termEnd } from "@/lib/plan-term";
import { FULL_PREVIEW_DATA } from "@/lib/preview";
import { WORK_MODES } from "@/lib/admin/page-form";
import { SOCIAL_LABELS } from "@/lib/socials";
import { SOCIAL_TYPES, type PageData } from "@/lib/page-schema";
import { checkUsernameAction, savePageAction } from "../actions";
import { EditsCounter } from "../../../_components/EditsCounter";
import { emptyTierChangeForm, validateTierChange, type TierChangeForm } from "@/lib/admin/tier-change";
import { findFontPair } from "@/templates/font-pairs";
import { AccentPicker } from "./AccentPicker";
import { FontPairPicker } from "./FontPairPicker";
import { AddOnPicker, StatusPicker, TemplatePicker, TierPicker } from "./Pickers";
import { ImageField } from "./ImageField";
import { PreviewPane, type PreviewNote } from "./PreviewPane";
import { SectionsEditor } from "./SectionsEditor";
import { SocialsEditor } from "./SocialsEditor";
import { TierChangePanel } from "./TierChangePanel";
import {
  CheckField,
  EditorContext,
  FOCUS,
  FieldShell,
  FormSection,
  Grid,
  SelectField,
  TextField,
  type EditorContextValue,
} from "./ui";

export type EditorPage = {
  id: string;
  username: string;
  editsUsed: number;
  publicUrl: string;
  /** Earlier tier changes, newest first, already worded. */
  tierChanges: { id: string; text: string; date: string; note: string | null }[];
};

/** Small helper for the student group, which starts open only when it is likely to be used. */
function Disclosure({ title, hint, open, onToggle, children }: { title: string; hint?: string; open: boolean; onToggle: (open: boolean) => void; children: ReactNode }) {
  return (
    <details open={open} onToggle={(e) => onToggle(e.currentTarget.open)} className="rounded-lg border border-neutral-200">
      <summary className={`cursor-pointer select-none px-3 py-2 text-sm font-medium ${FOCUS}`}>
        {title}
        {hint && <span className="font-normal text-neutral-600"> · {hint}</span>}
      </summary>
      <div className="flex flex-col gap-4 border-t border-neutral-200 p-3">{children}</div>
    </details>
  );
}

const WORK_MODE_OPTIONS = [{ value: "", label: "Not shown" }, ...WORK_MODES.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))];
const ICON_OPTIONS = [{ value: "", label: "Automatic" }, ...SOCIAL_TYPES.map((t) => ({ value: t, label: SOCIAL_LABELS[t] }))];

export function PageEditor({ mode, initial, page }: { mode: "create" | "edit"; initial: FormValues; page?: EditorPage }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initial);
  const [saved, setSaved] = useState<FormValues>(initial); // what the server has, for Discard
  const [tierForm, setTierForm] = useState<TierChangeForm>(emptyTierChangeForm());
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [touched, setTouched] = useState<Record<string, true>>({});
  const [attempted, setAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startSave] = useTransition();
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [studentOpen, setStudentOpen] = useState(
    () => Boolean(initial.school || initial.program || initial.year || initial.graduating || initial.openTo) || /^(student|social)-/.test(initial.templateKey),
  );

  // While creating, the username and client name follow the full name until the admin types their own.
  const usernameEdited = useRef(false);
  const clientEdited = useRef(false);

  const set = useCallback(<K extends keyof FormValues>(name: K, value: FormValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      // A font pair belongs to one template: choosing another template drops a pair it does not have.
      if (name === "templateKey" && prev.fontPair && prev.tier !== "CUSTOM" && !findFontPair(String(value), prev.fontPair)) next.fontPair = "";
      if (mode === "create" && name === "fullName") {
        if (!usernameEdited.current) next.username = suggestUsername(String(value));
        if (!clientEdited.current) next.clientName = String(value);
      }
      return next;
    });
    if (name === "username") usernameEdited.current = true;
    if (name === "clientName") clientEdited.current = true;
    // A server-side complaint about a field goes away as soon as that field is changed.
    setServerErrors((prev) => {
      const key = String(name);
      const stale = Object.keys(prev).filter((k) => k === key || k.startsWith(`${key}.`));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      for (const k of stale) delete next[k];
      return next;
    });
  }, [mode]);

  const touch = useCallback((field: string) => setTouched((t) => (t[field] ? t : { ...t, [field]: true })), []);

  // ---- validation ----
  const validation = useMemo(() => validateForm(values, { requireUsername: mode === "create" }), [values, mode]);

  // Is the username free? Checked shortly after typing stops (new pages only).
  const [usernameCheck, setUsernameCheck] = useState<{ name: string; ok: boolean; reason?: string } | null>(null);
  const formatOk = !validation.errors.username;
  useEffect(() => {
    if (mode !== "create" || !values.username || !formatOk) return;
    const name = values.username;
    const t = setTimeout(async () => {
      try {
        const r = await checkUsernameAction(name);
        setUsernameCheck({ name, ok: r.ok, reason: r.ok ? undefined : r.reason });
      } catch {
        /* the save will check again */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [mode, values.username, formatOk]);

  // Changing an existing page's tier needs the payment recorded with it.
  const tierChanged = mode === "edit" && values.tier !== saved.tier;
  const tierCheck = useMemo(() => (tierChanged ? validateTierChange(tierForm) : null), [tierChanged, tierForm]);

  const allErrors: FieldErrors = useMemo(() => {
    const e: FieldErrors = { ...validation.errors };
    if (tierCheck && !tierCheck.ok) {
      if (tierCheck.errors.amount) e.tierAmount = tierCheck.errors.amount;
      if (tierCheck.errors.note) e.tierNote = tierCheck.errors.note;
    }
    if (mode === "create" && usernameCheck && usernameCheck.name === values.username && !usernameCheck.ok && !e.username) {
      e.username = usernameCheck.reason ?? "That username is not available";
    }
    return { ...e, ...serverErrors };
  }, [validation.errors, tierCheck, serverErrors, usernameCheck, values.username, mode]);

  const errorFor = useCallback(
    (field: string) => {
      if (serverErrors[field]) return serverErrors[field];
      // The username check is useful feedback straight away; the tier-change fields show a problem once something is typed;
      // other errors wait until the field is left or a save is attempted.
      const early =
        (field === "username" && usernameCheck?.name === values.username) ||
        ((field === "tierAmount" || field === "tierNote") && tierForm.amount !== "");
      return attempted || touched[field] || early ? allErrors[field] : undefined;
    },
    [allErrors, attempted, touched, serverErrors, usernameCheck, values.username, tierForm.amount],
  );

  const ctx: EditorContextValue = useMemo(() => ({ values, set, errorFor, touch, allErrors }), [values, set, errorFor, touch, allErrors]);

  // ---- preview ----
  const parsed = useMemo(() => parsePreviewData(values), [values]);
  const [lastValid, setLastValid] = useState<PageData | null>(parsed);
  if (parsed && parsed !== lastValid) setLastValid(parsed);
  const previewData = parsed ?? lastValid ?? FULL_PREVIEW_DATA;
  const previewNote: PreviewNote = parsed ? null : lastValid ? "stale" : "sample";

  // ---- dirty state ----
  const dirty = JSON.stringify(values) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const ent = getEntitlements({ tier: values.tier, addOns: values.addOns });
  const errorKeys = Object.keys(allErrors);

  const focusFirstError = (errors: FieldErrors) => {
    setView("edit");
    requestAnimationFrame(() => {
      const keys = Object.keys(errors);
      const target = [...document.querySelectorAll<HTMLElement>("[data-field]")].find((el) => {
        const f = el.dataset.field ?? "";
        return keys.some((k) => k === f || k.startsWith(`${f}.`));
      });
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      target?.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true });
    });
  };

  const save = () => {
    setAttempted(true);
    setBanner(null);
    if (!validation.ok || errorKeys.length > 0) {
      focusFirstError(allErrors);
      setBanner({ kind: "error", text: `${errorKeys.length} ${errorKeys.length === 1 ? "field needs" : "fields need"} attention before this can be saved.` });
      return;
    }
    startSave(async () => {
      try {
        const result = await savePageAction(values, page?.username, tierCheck?.ok ? tierCheck.value : undefined);
        if (!result.ok) {
          setServerErrors(result.errors);
          setBanner({ kind: "error", text: result.message });
          if (Object.keys(result.errors).length) focusFirstError(result.errors);
          return;
        }
        setBaseline(JSON.stringify(values));
        setSaved(values);
        setTierForm(emptyTierChangeForm());
        if (result.created) {
          router.push(`/admin/pages/${result.username}?created=1`);
        } else {
          setBanner({ kind: "ok", text: "Saved. The public page is up to date." });
          router.refresh();
        }
      } catch {
        setBanner({ kind: "error", text: "Could not reach the server. Your changes are still here; try again." });
      }
    });
  };

  const discard = () => {
    if (!window.confirm("Discard all changes since the last save?")) return;
    setValues(saved);
    setTierForm(emptyTierChangeForm());
    setBaseline(JSON.stringify(saved));
    setTouched({});
    setServerErrors({});
    setAttempted(false);
    setBanner(null);
  };

  const isCreate = mode === "create";

  return (
    <EditorContext.Provider value={ctx}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-4"
      >
        {/* Phones: switch between the form and the preview. */}
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 lg:hidden" role="tablist" aria-label="Editor view">
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={view === t}
              onClick={() => setView(t)}
              className={`min-h-10 flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${FOCUS} ${view === t ? "bg-white shadow-sm" : "text-neutral-600"}`}
            >
              {t === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,420px)]">
          <div className={`flex min-w-0 flex-col gap-4 ${view === "edit" ? "" : "hidden"} lg:flex`}>
            <FormSection title="Client" description="Who the page belongs to. Not shown publicly." fields={["clientName", "contactEmail", "contactPhone", "notes"]}>
              <Grid>
                <TextField name="clientName" label="Client name" autoComplete="off" maxLength={100} />
                <TextField name="contactEmail" label="Client email" type="email" optional hint="For renewal reminders." inputMode="email" />
              </Grid>
              <Grid>
                <TextField name="contactPhone" label="Client phone" type="tel" optional inputMode="tel" />
                <TextField name="notes" label="Private notes" optional multiline rows={2} maxLength={2000} hint="Only you see this." />
              </Grid>
            </FormSection>

            <FormSection title="Page" description="Plan, template and when it is live." fields={["username", "tier", "tierAmount", "tierNote", "templateKey", "status", "paidUntil", "addOns"]}>
              {isCreate ? (
                <TextField
                  name="username"
                  label="Username"
                  maxLength={30}
                  placeholder="maria-santos"
                  hint={
                    <>
                      The page address: <span className="font-mono">/{values.username || "username"}</span>. Lowercase letters, numbers and hyphens. It cannot be changed later.
                    </>
                  }
                />
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Username</span>
                  <p className="text-sm">
                    <a href={page?.publicUrl} className="font-mono underline" target="_blank" rel="noopener noreferrer">
                      /{values.username}
                    </a>
                  </p>
                  <p className="text-xs text-neutral-600">Printed cards and shared links use this address, so it stays fixed.</p>
                </div>
              )}
              <TierPicker />
              {tierChanged && <TierChangePanel from={saved.tier} to={values.tier} form={tierForm} onChange={setTierForm} />}
              <TemplatePicker />
              <Grid>
                <StatusPicker />
                <div className="flex flex-col gap-1">
                  <TextField name="paidUntil" label="Paid until" type="date" hint="End of the paid term (4 years from purchase). The page stays visible for a 30-day grace period after it." />
                  <button
                    type="button"
                    onClick={() => {
                      set("paidUntil", termEnd(new Date()).toISOString().slice(0, 10));
                      touch("paidUntil");
                    }}
                    className={`self-start text-xs underline ${FOCUS}`}
                  >
                    Set to 4 years from today
                  </button>
                </div>
              </Grid>
              <AddOnPicker />
            </FormSection>

            <FormSection
              title="Profile"
              description="What the page says about the person. Each template shows the parts it was designed for."
              fields={["fullName", "displayName", "title", "company", "logoUrl", "location", "workMode", "photoUrl", "bio", "availability", "statusLine", "signature", "school", "program", "year", "graduating", "openTo"]}
            >
              <Grid>
                <TextField name="fullName" label="Full name" maxLength={60} autoComplete="off" hint="Up to 60 characters. Used for the vCard too." />
                <TextField name="displayName" label="Nickname / first name" optional maxLength={30} hint="Social templates greet with this (“hi, I’m Maria”)." />
              </Grid>
              <Grid>
                <TextField name="title" label="Job title" optional maxLength={80} />
                <TextField name="company" label="Company" optional maxLength={80} />
              </Grid>
              <Grid>
                <TextField name="location" label="Location" optional maxLength={80} placeholder="Cavite, PH" />
                <SelectField name="workMode" label="Work mode" optional options={WORK_MODE_OPTIONS} />
              </Grid>
              <TextField name="bio" label="Bio" optional multiline rows={4} maxLength={600} counter />
              <Grid>
                <TextField name="availability" label="Availability" optional maxLength={60} placeholder="Replies within a day" />
                <TextField name="statusLine" label="“Currently” status" optional maxLength={80} placeholder="Designing a new brand system" />
              </Grid>
              <Grid>
                <TextField name="signature" label="Signature text" optional maxLength={40} hint="Shown in handwriting on the Signature template." />
                <ImageField name="photoUrl" label="Photo" hint="Shown on the card and saved into the contact file." />
              </Grid>
              <ImageField name="logoUrl" label="Company logo" shape="square" hint="Used by the Company template." />

              <Disclosure title="Student details" hint="school, program, year" open={studentOpen} onToggle={setStudentOpen}>
                <Grid>
                  <TextField name="school" label="School" optional maxLength={100} />
                  <TextField name="program" label="Program" optional maxLength={60} placeholder="BSCS" />
                </Grid>
                <Grid cols={3}>
                  <TextField name="year" label="Year level" optional maxLength={30} placeholder="3rd year" />
                  <TextField name="graduating" label="Graduating" optional maxLength={10} placeholder="2027" />
                  <TextField name="openTo" label="Open to" optional maxLength={100} placeholder="Internships" />
                </Grid>
              </Disclosure>
            </FormSection>

            <FormSection title="Contact" description="What Save Contact adds to a visitor’s phone." fields={["phone", "email", "officeAddress"]}>
              <Grid>
                <TextField name="phone" label="Phone" optional type="tel" inputMode="tel" placeholder="0917 123 4567" hint="Philippine numbers are converted to +63 automatically." />
                <TextField name="email" label="Email" optional type="email" inputMode="email" />
              </Grid>
              <TextField name="officeAddress" label="Office address" optional maxLength={200} />
              <div className="flex flex-col gap-3">
                <CheckField name="showPhoneNumbers" label="Show phone numbers on the page" hint="Off hides Call, Text and number-based links (WhatsApp, Viber show “Chat”). The vCard still has the number." />
                <CheckField name="sms" label="Add a Text button" hint="Needs a phone number." disabled={!values.phone.trim()} />
              </div>
            </FormSection>

            <FormSection title="Links" description="The main button and the social and messaging links, in the order they appear." fields={["featuredLabel", "featuredUrl", "featuredIcon", "socials"]}>
              <div className="rounded-lg border border-neutral-200 p-3">
                <p className="mb-3 text-sm font-medium">Featured button</p>
                <div className="flex flex-col gap-3">
                  <Grid>
                    <TextField name="featuredLabel" label="Button text" optional maxLength={40} placeholder="View my portfolio" />
                    <TextField name="featuredUrl" label="Link" optional type="url" inputMode="url" placeholder="https://…" />
                  </Grid>
                  <SelectField name="featuredIcon" label="Icon" optional options={ICON_OPTIONS} hint="Automatic uses the matching social link, if there is one." className="sm:max-w-xs" />
                </div>
                <p className="mt-2 text-xs text-neutral-600">Leave both empty to use the Instagram or LinkedIn link as the main button.</p>
              </div>
              <SocialsEditor />
            </FormSection>

            <FormSection title="Look" description="Light or dark, and the accent colour." fields={["theme", "accent", "fontPair", "bannerUrl"]}>
              <FieldShell name="theme" label="Default theme" hint="Visitors can switch themes on the page; this is what they see first.">
                {() => (
                  <div className="flex gap-1 self-start rounded-lg bg-neutral-100 p-1" role="radiogroup" aria-label="Default theme">
                    {(["light", "dark"] as const).map((t) => (
                      <label key={t} className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-neutral-900 ${values.theme === t ? "bg-white shadow-sm" : "text-neutral-600"}`}>
                        <input type="radio" name="theme" value={t} checked={values.theme === t} onChange={() => set("theme", t)} className="sr-only" />
                        {t === "light" ? "Light" : "Dark"}
                      </label>
                    ))}
                  </div>
                )}
              </FieldShell>
              <AccentPicker />
              <FontPairPicker />
              {ent.customComponent && (
                <TextField name="bannerUrl" label="Banner image link" optional type="url" inputMode="url" placeholder="https://…" hint="Custom pages only." />
              )}
            </FormSection>

            <FormSection title="Optional sections" description="Extra blocks such as services, experience or skills, and the order of the page." fields={["sections", "sectionOrder"]}>
              <SectionsEditor />
            </FormSection>

            {page && (
              <FormSection title="Plan" description="Read only." fields={[]}>
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-neutral-600">Small edits used</dt>
                    <dd className="mt-1">
                      <EditsCounter pageId={page.id} used={page.editsUsed} allowed={ent.smallEdits} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-neutral-600">Public page</dt>
                    <dd>
                      <a href={page.publicUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        {page.publicUrl}
                      </a>
                    </dd>
                  </div>
                </dl>
                {page.tierChanges.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-neutral-600">Tier changes</p>
                    <ul className="flex flex-col gap-1 text-sm">
                      {page.tierChanges.map((c) => (
                        <li key={c.id}>
                          <span className="text-neutral-600">{c.date}:</span> {c.text}
                          {c.note && <span className="text-neutral-600"> ({c.note})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-neutral-600">
                  Cards, QR codes and usage are managed in <a href="#cards" className="underline">Cards and QR</a> below. Terms and reminders are on the <Link href="/admin/renewals" className="underline">Renewals</Link> screen.
                </p>
              </FormSection>
            )}
          </div>

          <aside className={`min-w-0 ${view === "preview" ? "" : "hidden"} lg:sticky lg:top-4 lg:block`} aria-label="Live preview">
            <PreviewPane
              templateKey={values.templateKey}
              data={previewData}
              tier={values.tier}
              addOns={values.addOns}
              username={page?.username ?? null}
              formTheme={values.theme}
              note={previewNote}
              publicHref={page?.publicUrl ?? null}
            />
          </aside>
        </div>

        {/* Save bar */}
        <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
          <p
            role={banner?.kind === "error" ? "alert" : "status"}
            className={`min-w-0 flex-1 text-sm ${banner?.kind === "error" ? "font-medium text-red-700" : banner?.kind === "ok" ? "font-medium text-green-800" : "text-neutral-600"}`}
          >
            {banner?.text ?? (dirty ? (errorKeys.length ? `Unsaved changes · ${errorKeys.length} to fix` : "Unsaved changes") : isCreate ? "Fill in the details to create the page." : "All changes saved.")}
          </p>
          <div className="flex gap-2">
            {dirty && !isCreate && (
              <button type="button" onClick={discard} disabled={pending} className={`rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium ${FOCUS}`}>
                Discard
              </button>
            )}
            <button type="submit" disabled={pending || (!isCreate && !dirty)} className={`rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${FOCUS}`}>
              {pending ? "Saving…" : isCreate ? "Create page" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </EditorContext.Provider>
  );
}

