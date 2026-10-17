"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { PageData } from "@/lib/page-schema";
import type { Tier } from "@/lib/entitlements";
import type { FrameMessage, FrameReply } from "../../../preview-frame/PreviewHost";
import { FOCUS } from "./ui";

const WIDTHS = [320, 375, 390, 430] as const;
const MAX_FRAME_HEIGHT = 780;
const MIN_FRAME_HEIGHT = 520;
const DEBOUNCE_MS = 250;

function subscribeToResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export type PreviewNote = "sample" | "stale" | null;

/**
 * A phone-sized iframe that shows the template with the form's current values. The frame is a real page
 * (so viewport units and fixed elements behave as on a phone); the editor posts it the values and the frame
 * asks the server to render the template. Typing is debounced, and an answer for an old request is dropped.
 */
export function PreviewPane({
  templateKey,
  data,
  tier,
  addOns,
  username,
  formTheme,
  note,
  publicHref,
}: {
  templateKey: string;
  data: PageData;
  tier: Tier;
  addOns: string[];
  /** The saved page's username (its QR and vCard links work), or null for a new page. */
  username: string | null;
  formTheme: "light" | "dark";
  note: PreviewNote;
  publicHref: string | null;
}) {
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(390);
  // The toolbar switch is a temporary override that applies only to the form theme it was set against,
  // so changing the theme in the form shows that theme in the preview too.
  const [override, setOverride] = useState<{ base: "light" | "dark"; theme: "light" | "dark" } | null>(null);
  const theme = override && override.base === formTheme ? override.theme : formTheme;
  const [frameKey, setFrameKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [scale, setScale] = useState(1);
  // Short windows get a shorter phone, so the whole preview stays on screen next to the form.
  const windowHeight = useSyncExternalStore(subscribeToResize, () => window.innerHeight, () => 900);
  const frameHeight = Math.max(MIN_FRAME_HEIGHT, Math.min(MAX_FRAME_HEIGHT, windowHeight - 210));
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const request = useMemo(() => ({ templateKey, data, theme, username, tier, addOns }), [templateKey, data, theme, username, tier, addOns]);
  const latest = useRef(request);
  useEffect(() => {
    latest.current = request; // declared before the effect that sends it, so a send always sees the newest values
  }, [request]);

  const send = useCallback(() => {
    const target = frame.current?.contentWindow;
    if (!target) return;
    seq.current += 1;
    setBusy(true);
    // Sample images live on this site (a relative path); the server wants full links.
    const abs = (u: string | undefined) => (u?.startsWith("/") ? window.location.origin + u : u);
    const { data } = latest.current;
    const request = { ...latest.current, data: { ...data, profile: { ...data.profile, photoUrl: abs(data.profile.photoUrl), logoUrl: abs(data.profile.logoUrl) } } };
    target.postMessage({ type: "render", seq: seq.current, request } satisfies FrameMessage, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent<FrameReply>) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "ready") setReady(true);
      if (e.data?.type === "rendered" && e.data.seq === seq.current) {
        setBusy(false);
        setFailed(!e.data.ok);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // The frame can finish loading before this page has hydrated, so say hello until it answers.
  useEffect(() => {
    if (ready) return;
    const ping = () => frame.current?.contentWindow?.postMessage({ type: "hello" } satisfies FrameMessage, window.location.origin);
    ping();
    const t = setInterval(ping, 400);
    return () => clearInterval(t);
  }, [ready, frameKey]);

  // The first render goes out as soon as the frame is ready; after that, changes are debounced.
  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    const wait = first.current ? 0 : DEBOUNCE_MS;
    first.current = false;
    const t = setTimeout(send, wait);
    return () => clearTimeout(t);
  }, [ready, request, send]);

  // Fit the phone into the column without cropping it.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      if (el.clientWidth > 0) setScale(Math.min(1, el.clientWidth / width));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const reload = () => {
    setReady(false);
    first.current = true;
    setBusy(true);
    setFrameKey((k) => k + 1);
  };

  const btn = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-xs font-medium ${FOCUS} ${active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-200"}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Phone width">
          {WIDTHS.map((w) => (
            <button key={w} type="button" aria-pressed={width === w} className={btn(width === w)} onClick={() => setWidth(w)}>
              {w}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Preview theme">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} className={btn(theme === t)} onClick={() => setOverride({ base: formTheme, theme: t })}>
              {t === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
      </div>

      <div ref={box} className="w-full">
        <div
          className="mx-auto overflow-hidden rounded-[2rem] border-4 border-neutral-900 bg-white shadow-lg"
          style={{ width: width * scale + 8, height: frameHeight * scale + 8 }}
        >
          <iframe
            key={frameKey}
            ref={frame}
            src="/admin/preview-frame"
            title="Live preview of the page"
            width={width}
            height={frameHeight}
            style={{ width, height: frameHeight, border: 0, transform: `scale(${scale})`, transformOrigin: "top left", background: "transparent" }}
          />
        </div>
      </div>

      <div className="flex min-h-5 flex-wrap items-center justify-between gap-2 text-xs text-neutral-600" aria-live="polite">
        <span>
          {failed
            ? "The preview could not load. Reload it."
            : note === "stale"
              ? "Showing the last valid version. Fix the highlighted fields to update it."
              : note === "sample"
                ? "Showing sample content until the form is valid."
                : busy
                  ? "Updating…"
                  : "Preview is up to date."}
        </span>
        <span className="flex items-center gap-3">
          <button type="button" onClick={reload} className={`underline ${FOCUS}`}>
            Reload preview
          </button>
          {publicHref && (
            <a href={publicHref} target="_blank" rel="noopener noreferrer" className={`underline ${FOCUS}`}>
              Open live page
            </a>
          )}
        </span>
      </div>
    </div>
  );
}
