"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { ACCENT_PRESETS } from "@/lib/accents";
import { PROFILE_TYPES, MESSAGING_TYPES, SOCIAL_LABELS } from "@/lib/socials";
import {
  ADD_ON_LABEL,
  ORDER_PICKS,
  OrderSchema,
  PICK_LABEL,
  orderMessage,
  type Order,
  type OrderLink,
  type OrderPick,
} from "@/lib/order";
import type { SocialType } from "@/lib/page-schema";
import { TEMPLATE_OPTIONS } from "@/templates/keys";
import "./order.css";

/** Templates that have a screenshot on the homepage. The others are still available: we suggest one. */
const SHOTS: Record<string, string> = {
  "pro-classic": "pro-classic",
  "pro-magazine": "pro-magazine",
  "student-notebook": "student-notebook",
  "social-bento": "social-bento",
  "social-scrapbook": "social-scrapbook",
  "social-minimalist": "social-minimalist",
};

const PICK_HINT: Record<OrderPick, string> = {
  skills: "One skill per line, or separate them with commas.",
  services: "What you offer, with prices if you like (one per line).",
  stats: "Short numbers, for example: 8+ years, 120 clients.",
  portfolio: "Your best work: a title and a link for each.",
  experience: "Your roles: job, company and years.",
  interests: "One interest per line.",
  orgs: "Clubs and organisations, with your role.",
  song: "Paste a Spotify link, and the song title if you like.",
};

const LINK_TYPES: SocialType[] = [...PROFILE_TYPES, ...MESSAGING_TYPES];
const URL_LIKE = /^https?:\/\//i;

type LinkRow = { id: number; type: SocialType; value: string };

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="ord-field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint && !error && <p className="ord-hint">{hint}</p>}
      {error && (
        <p className="ord-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The order form. It keeps the answers in this page only and builds one message at the end for the client to
 * send us in the chat. Nothing is sent to or stored on the server.
 */
export function OrderForm({ link, messenger }: { link: OrderLink; messenger: string }) {
  const standard = link.plan === "standard";
  const [f, setF] = useState({
    name: "",
    nickname: "",
    title: "",
    company: "",
    location: "",
    bio: "",
    phone: "",
    email: "",
    showPhone: true,
    student: false,
    school: "",
    program: "",
    year: "",
    graduating: "",
    openTo: "",
    featuredLabel: "",
    featuredUrl: "",
    template: link.template,
    theme: "light" as "light" | "dark",
    accent: "",
    customAccent: "#2563eb",
    videoUrl: "",
    pdfUrl: "",
    bookingUrl: "",
    domain: "",
    note: "",
  });
  const [links, setLinks] = useState<LinkRow[]>([{ id: 1, type: "instagram", value: "" }]);
  const [picks, setPicks] = useState<Partial<Record<OrderPick, string>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ message: string; copied: boolean } | null>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const pickCount = Object.keys(picks).length;
  const has = (a: (typeof link.addOns)[number]) => link.addOns.includes(a);
  const needsExtras = standard || link.addOns.length > 0;

  const planText = useMemo(
    () => `${standard ? "Standard" : "Starter"}${link.addOns.length ? ` + ${link.addOns.map((a) => ADD_ON_LABEL[a]).join(", ")}` : ""}`,
    [standard, link.addOns],
  );

  const build = (): Order | null => {
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Please enter your name.";
    if (f.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) errs.email = "That does not look like an email address.";
    if (!f.phone.trim() && !f.email.trim()) errs.phone = "Add a phone number or an email so people can reach you.";
    for (const [kind, text] of Object.entries(picks)) if (!text?.trim()) errs[`pick-${kind}`] = "Tell us what to put here, or untick it.";
    for (const u of ["videoUrl", "pdfUrl", "bookingUrl"] as const) if (f[u].trim() && !URL_LIKE.test(f[u].trim())) errs[u] = "Paste the full link, starting with https://";
    if (f.featuredUrl.trim() && !URL_LIKE.test(f.featuredUrl.trim())) errs.featuredUrl = "Paste the full link, starting with https://";
    setErrors(errs);
    if (Object.keys(errs).length) return null;

    const socials = links
      .filter((l) => l.value.trim())
      .map((l) => {
        const v = l.value.trim();
        return URL_LIKE.test(v) ? { type: l.type, handle: v.replace(URL_LIKE, "").replace(/^www\./i, "").replace(/\/+$/, "").slice(0, 100), url: v } : { type: l.type, handle: v.replace(/^@/, ""), url: "" };
      });
    const parsed = OrderSchema.safeParse({
      v: 1,
      plan: link.plan,
      addOns: link.addOns,
      name: f.name,
      nickname: f.nickname,
      title: f.title,
      company: f.company,
      location: f.location,
      bio: f.bio,
      phone: f.phone,
      email: f.email,
      showPhone: f.showPhone,
      student: f.student ? { school: f.school, program: f.program, year: f.year, graduating: f.graduating, openTo: f.openTo } : undefined,
      socials,
      featured: f.featuredUrl.trim() ? { label: f.featuredLabel || "My link", url: f.featuredUrl } : undefined,
      template: f.template,
      theme: f.theme,
      accent: f.accent === "custom" ? f.customAccent : f.accent,
      sections: ORDER_PICKS.filter((k) => picks[k] !== undefined).map((k) => ({ kind: k, text: picks[k] ?? "" })),
      videoUrl: has("video") ? f.videoUrl : "",
      pdfUrl: has("pdf") ? f.pdfUrl : "",
      bookingUrl: has("booking") ? f.bookingUrl : "",
      domain: has("custom_domain") ? f.domain : "",
      note: f.note,
    });
    if (!parsed.success) {
      setErrors({ form: `Something is too long or not valid: ${parsed.error.issues[0]?.path.join(" > ") || "form"}. Please shorten it and try again.` });
      return null;
    }
    return parsed.data;
  };

  const send = async () => {
    const order = build();
    if (!order) {
      document.querySelector(".ord-error")?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const message = orderMessage(order);
    let copied = false;
    try {
      await navigator.clipboard.writeText(message);
      copied = true;
    } catch {
      copied = false;
    }
    setSent({ message, copied });
    if (copied) window.open(messenger, "_blank", "noopener,noreferrer");
  };

  const accentChoices = ACCENT_PRESETS;

  return (
    <>
      <span className="kicker">Order form</span>
      <h1 className="h1 ord-h">Let&apos;s build your card.</h1>
      <p className="lead">
        Answer what you can. It takes about five minutes, and you can leave anything blank and tell us later. Your plan: <strong>{planText}</strong>.
      </p>
      <p className="ord-privacy">Nothing you type here is saved on our website. Your answers stay on your phone until you send them to us in a message at the end.</p>

      <form
        className="ord-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        noValidate
      >
        <section className="ord-card" aria-labelledby="o-about">
          <h2 id="o-about">About you</h2>
          <Field label="Full name" error={errors.name}>
            {(id) => <input id={id} value={f.name} maxLength={60} autoComplete="name" onChange={(e) => set("name", e.target.value)} />}
          </Field>
          <Field label="Nickname (optional)" hint="What people should call you, for example in 'hi, I'm Eva'.">
            {(id) => <input id={id} value={f.nickname} maxLength={30} onChange={(e) => set("nickname", e.target.value)} />}
          </Field>
          <div className="ord-two">
            <Field label="Title (optional)" hint="For example: Product Designer">
              {(id) => <input id={id} value={f.title} maxLength={80} autoComplete="organization-title" onChange={(e) => set("title", e.target.value)} />}
            </Field>
            <Field label="Company (optional)">
              {(id) => <input id={id} value={f.company} maxLength={80} autoComplete="organization" onChange={(e) => set("company", e.target.value)} />}
            </Field>
          </div>
          <Field label="Location (optional)" hint="For example: Cavite, PH">
            {(id) => <input id={id} value={f.location} maxLength={80} onChange={(e) => set("location", e.target.value)} />}
          </Field>
          <Field label="Short bio (optional)" hint={`A few sentences about you. ${600 - f.bio.length} characters left.`}>
            {(id) => <textarea id={id} rows={4} value={f.bio} maxLength={600} onChange={(e) => set("bio", e.target.value)} />}
          </Field>
          <label className="ord-check">
            <input type="checkbox" checked={f.student} onChange={(e) => set("student", e.target.checked)} />
            <span>I&apos;m a student</span>
          </label>
          {f.student && (
            <div className="ord-sub">
              <Field label="School">{(id) => <input id={id} value={f.school} maxLength={100} onChange={(e) => set("school", e.target.value)} />}</Field>
              <div className="ord-two">
                <Field label="Program">{(id) => <input id={id} value={f.program} maxLength={60} onChange={(e) => set("program", e.target.value)} />}</Field>
                <Field label="Year">{(id) => <input id={id} value={f.year} maxLength={30} placeholder="4th year" onChange={(e) => set("year", e.target.value)} />}</Field>
              </div>
              <div className="ord-two">
                <Field label="Graduating" hint="For example: May 2027">{(id) => <input id={id} value={f.graduating} maxLength={10} onChange={(e) => set("graduating", e.target.value)} />}</Field>
                <Field label="Open to" hint="For example: Internships">{(id) => <input id={id} value={f.openTo} maxLength={100} onChange={(e) => set("openTo", e.target.value)} />}</Field>
              </div>
            </div>
          )}
        </section>

        <section className="ord-card" aria-labelledby="o-contact">
          <h2 id="o-contact">How people reach you</h2>
          <div className="ord-two">
            <Field label="Mobile number" error={errors.phone}>
              {(id) => <input id={id} type="tel" inputMode="tel" value={f.phone} maxLength={30} autoComplete="tel" placeholder="0917 123 4567" onChange={(e) => set("phone", e.target.value)} />}
            </Field>
            <Field label="Email" error={errors.email}>
              {(id) => <input id={id} type="email" inputMode="email" value={f.email} maxLength={120} autoComplete="email" onChange={(e) => set("email", e.target.value)} />}
            </Field>
          </div>
          <label className="ord-check">
            <input type="checkbox" checked={f.showPhone} onChange={(e) => set("showPhone", e.target.checked)} />
            <span>Show my phone number on my page. Untick it to keep it private (people can still reach you through your links).</span>
          </label>
        </section>

        <section className="ord-card" aria-labelledby="o-links">
          <h2 id="o-links">Your links</h2>
          <p className="ord-hint">Add the accounts you want on your card. Paste a link or just your username.</p>
          {links.map((l) => (
            <div className="ord-link" key={l.id}>
              <select aria-label="Network" value={l.type} onChange={(e) => setLinks((p) => p.map((x) => (x.id === l.id ? { ...x, type: e.target.value as SocialType } : x)))}>
                {LINK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SOCIAL_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                aria-label={`${SOCIAL_LABELS[l.type]} link or username`}
                value={l.value}
                maxLength={500}
                placeholder="@username or https://…"
                onChange={(e) => setLinks((p) => p.map((x) => (x.id === l.id ? { ...x, value: e.target.value } : x)))}
              />
              <button type="button" className="ord-x" aria-label={`Remove ${SOCIAL_LABELS[l.type]}`} onClick={() => setLinks((p) => p.filter((x) => x.id !== l.id))}>
                ×
              </button>
            </div>
          ))}
          {links.length < 12 && (
            <button type="button" className="ord-add" onClick={() => setLinks((p) => [...p, { id: Math.max(0, ...p.map((x) => x.id)) + 1, type: "facebook", value: "" }])}>
              + Add another link
            </button>
          )}
          <div className="ord-sub">
            <p className="ord-hint">One main button (optional), for example &ldquo;View my portfolio&rdquo;.</p>
            <div className="ord-two">
              <Field label="Button text">{(id) => <input id={id} value={f.featuredLabel} maxLength={40} onChange={(e) => set("featuredLabel", e.target.value)} />}</Field>
              <Field label="Button link" error={errors.featuredUrl}>
                {(id) => <input id={id} type="url" inputMode="url" value={f.featuredUrl} maxLength={500} placeholder="https://…" onChange={(e) => set("featuredUrl", e.target.value)} />}
              </Field>
            </div>
          </div>
        </section>

        <section className="ord-card" aria-labelledby="o-design">
          <h2 id="o-design">Pick a look</h2>
          <div className="ord-shots" role="radiogroup" aria-label="Design">
            {TEMPLATE_OPTIONS.filter((t) => SHOTS[t.key]).map((t) => (
              <label key={t.key} className={`ord-shot${f.template === t.key ? " is-on" : ""}`}>
                <input type="radio" name="template" value={t.key} checked={f.template === t.key} onChange={() => set("template", t.key)} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/marketing/${SHOTS[t.key]}.webp`} alt="" width={390} height={844} loading="lazy" />
                <span>{t.label}</span>
              </label>
            ))}
            <label className={`ord-shot ord-shot-text${f.template === "" ? " is-on" : ""}`}>
              <input type="radio" name="template" value="" checked={f.template === ""} onChange={() => set("template", "")} />
              <span>Not sure. Suggest one for me.</span>
            </label>
          </div>

          <div className="ord-row">
            <span className="ord-label" id="o-theme">Light or dark?</span>
            <div role="radiogroup" aria-labelledby="o-theme" className="ord-seg">
              {(["light", "dark"] as const).map((t) => (
                <label key={t} className={f.theme === t ? "is-on" : ""}>
                  <input type="radio" name="theme" checked={f.theme === t} onChange={() => set("theme", t)} />
                  {t === "light" ? "Light" : "Dark"}
                </label>
              ))}
            </div>
          </div>

          <div className="ord-row">
            <span className="ord-label" id="o-accent">Your colour</span>
            <div role="radiogroup" aria-labelledby="o-accent" className="ord-swatches">
              <label className={`ord-sw ord-sw-none${f.accent === "" ? " is-on" : ""}`}>
                <input type="radio" name="accent" checked={f.accent === ""} onChange={() => set("accent", "")} />
                <span>You pick</span>
              </label>
              {accentChoices.map((p) => (
                <label key={p.id} className={`ord-sw${f.accent === p.id ? " is-on" : ""}`} title={p.label}>
                  <input type="radio" name="accent" checked={f.accent === p.id} onChange={() => set("accent", p.id)} />
                  <i style={{ background: p.accent }} />
                  <span className="sr-only">{p.label}</span>
                </label>
              ))}
              {standard && (
                <label className={`ord-sw ord-sw-custom${f.accent === "custom" ? " is-on" : ""}`}>
                  <input type="radio" name="accent" checked={f.accent === "custom"} onChange={() => set("accent", "custom")} />
                  <input type="color" aria-label="Custom colour" value={f.customAccent} onChange={(e) => { set("customAccent", e.target.value); set("accent", "custom"); }} />
                  <span>Any colour</span>
                </label>
              )}
            </div>
          </div>
        </section>

        {needsExtras && (
          <section className="ord-card" aria-labelledby="o-extras">
            <h2 id="o-extras">Extras</h2>
            {standard && (
              <>
                <p className="ord-hint">
                  Standard includes <strong>2</strong> extra sections. Pick up to two ({pickCount} of 2 chosen), and tell us what to put in them.
                </p>
                <div className="ord-picks">
                  {ORDER_PICKS.map((k) => {
                    const on = picks[k] !== undefined;
                    const full = !on && pickCount >= 2;
                    return (
                      <div key={k} className={`ord-pick${on ? " is-on" : ""}`}>
                        <label className="ord-check">
                          <input
                            type="checkbox"
                            checked={on}
                            disabled={full}
                            onChange={(e) =>
                              setPicks((p) => {
                                const next = { ...p };
                                if (e.target.checked) next[k] = "";
                                else delete next[k];
                                return next;
                              })
                            }
                          />
                          <span>{PICK_LABEL[k]}</span>
                        </label>
                        {on && (
                          <Field label={`What should ${PICK_LABEL[k]} say?`} hint={PICK_HINT[k]} error={errors[`pick-${k}`]}>
                            {(id) => <textarea id={id} rows={3} maxLength={1500} value={picks[k] ?? ""} onChange={(e) => setPicks((p) => ({ ...p, [k]: e.target.value }))} />}
                          </Field>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {link.addOns.length > 0 && (
              <div className="ord-sub">
                <p className="ord-hint">Your add-ons: {link.addOns.map((a) => ADD_ON_LABEL[a]).join(", ")}.</p>
                {has("video") && (
                  <Field label="Video link" error={errors.videoUrl}>
                    {(id) => <input id={id} type="url" inputMode="url" value={f.videoUrl} maxLength={500} placeholder="https://youtube.com/…" onChange={(e) => set("videoUrl", e.target.value)} />}
                  </Field>
                )}
                {has("pdf") && (
                  <Field label="Link to your PDF or résumé" error={errors.pdfUrl} hint="Upload it to Google Drive or similar, and paste the share link.">
                    {(id) => <input id={id} type="url" inputMode="url" value={f.pdfUrl} maxLength={500} placeholder="https://…" onChange={(e) => set("pdfUrl", e.target.value)} />}
                  </Field>
                )}
                {has("booking") && (
                  <Field label="Booking link" error={errors.bookingUrl} hint="For example your Calendly or booking page.">
                    {(id) => <input id={id} type="url" inputMode="url" value={f.bookingUrl} maxLength={500} placeholder="https://…" onChange={(e) => set("bookingUrl", e.target.value)} />}
                  </Field>
                )}
                {has("custom_domain") && (
                  <Field label="The web address you would like" hint="For example: evareyes.ph">
                    {(id) => <input id={id} value={f.domain} maxLength={80} onChange={(e) => set("domain", e.target.value)} />}
                  </Field>
                )}
                {has("gallery") && <p className="ord-hint">For the photo gallery, send us the photos in the chat after this form.</p>}
              </div>
            )}
          </section>
        )}

        <section className="ord-card" aria-labelledby="o-more">
          <h2 id="o-more">Anything else?</h2>
          <Field label="Message for us (optional)" hint="Spelling of your name, a deadline, an idea. You will send your profile photo and logo in the chat after this form.">
            {(id) => <textarea id={id} rows={3} maxLength={1000} value={f.note} onChange={(e) => set("note", e.target.value)} />}
          </Field>
        </section>

        {errors.form && (
          <p className="ord-error" role="alert">
            {errors.form}
          </p>
        )}
        {Object.keys(errors).length > 0 && !errors.form && (
          <p className="ord-error" role="alert">
            Please check the highlighted answers above.
          </p>
        )}

        <div className="ord-send">
          <button type="submit" className="btn btn-ink btn-lg">
            Copy my answers and open Messenger
          </button>
          <p className="ord-hint">We copy your answers as one message. Paste it into our chat and press send. That is all.</p>
        </div>
      </form>

      {sent && (
        <section className="ord-card ord-done" aria-live="polite" aria-labelledby="o-done">
          <h2 id="o-done">{sent.copied ? "Copied! Now paste it into the chat." : "Copy this message and send it to us."}</h2>
          <p className="ord-hint">
            {sent.copied ? "Messenger should have opened in a new tab. If it did not, open it yourself and paste." : "Your phone would not let us copy it automatically. Select the text below, copy it, then open Messenger and paste it."}
          </p>
          <textarea readOnly rows={8} value={sent.message} onFocus={(e) => e.currentTarget.select()} aria-label="Your order message" />
          <div className="ord-actions">
            <button type="button" className="btn btn-line" onClick={() => void navigator.clipboard?.writeText(sent.message)}>
              Copy again
            </button>
            <a className="btn btn-ink" href={messenger} target="_blank" rel="noopener noreferrer">
              Open Messenger
            </a>
          </div>
        </section>
      )}
    </>
  );
}
