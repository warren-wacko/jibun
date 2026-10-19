"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { CheckIcon, CopyIcon, MoonIcon, ShareIcon, SunIcon, UserPlusIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

/* ---------- Toast ---------- */

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="pc-toast">{children}</BaseToastProvider>;
}

/* ---------- Header controls ---------- */

export function HeaderThemeToggle() {
  return (
    <ThemeToggle className="pc-icon-btn">
      {(theme) => (
        <span className="pc-icon-ring">{theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}</span>
      )}
    </ThemeToggle>
  );
}

export function HeaderShare({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="pc-share-btn" onResult={(r) => r === "copied" && toast("Link copied")}>
      <span className="pc-share-pill">
        SHARE
        <ShareIcon size={16} />
      </span>
    </ShareButton>
  );
}

/* ---------- Card flip with tilt and holographic shine ---------- */

export function CardFlip({ front, back }: { front: ReactNode; back: ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  const flipRef = useRef<HTMLDivElement>(null);

  // Tilt writes CSS variables straight to the element, so pointer moves do not re-render React.
  function setTilt(rx: number, ry: number, gx: number, gy: number, moving: boolean) {
    const el = flipRef.current;
    if (!el) return;
    el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    el.style.setProperty("--gx", String(gx));
    el.style.setProperty("--gy", String(gy));
    el.dataset.moving = moving ? "true" : "false";
  }

  function onMove(e: PointerEvent<HTMLButtonElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setTilt((0.5 - y) * 16, (x - 0.5) * 22, Math.round(x * 100), Math.round(y * 100), true);
  }

  const reset = () => setTilt(0, 0, 50, 30, false);

  return (
    <div className="pc-hero pc-anim-card">
      <button
        type="button"
        className="pc-card-btn"
        aria-label={flipped ? "Flip card to show the front" : "Flip card to show the QR code"}
        onClick={() => setFlipped((v) => !v)}
        onPointerMove={onMove}
        onPointerLeave={reset}
        onPointerUp={reset}
      >
        <div ref={flipRef} className={`pc-flip${flipped ? " is-flipped" : ""}`}>
          <div className="pc-face pc-front" inert={flipped}>
            {front}
          </div>
          <div className="pc-face pc-back" inert={!flipped}>
            {back}
          </div>
        </div>
      </button>

      <div className="pc-pill" role="group" aria-label="Card side">
        <button type="button" aria-pressed={!flipped} onClick={() => setFlipped(false)}>
          Card
        </button>
        <button type="button" aria-pressed={flipped} onClick={() => setFlipped(true)}>
          QR code
        </button>
      </div>
    </div>
  );
}

/* ---------- Save Contact ---------- */

/** A plain link to the vCard (no `download` attribute): iPhone Safari opens the contact preview straight away; Android downloads it. The state change is only feedback. */
export function SaveButton({ href }: { href: string }) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  return (
    <a
      href={href}
      className={`pc-save${saved ? " is-saved" : ""}`}
      onClick={() => {
        if (!saved) {
          setSaved(true);
          toast("Opening your contact…");
        }
      }}
    >
      <span>{saved ? "Saved to contacts" : "Save Contact"}</span>
      <span className="pc-save-chip">{saved ? <CheckIcon strokeWidth={2.2} /> : <UserPlusIcon />}</span>
    </a>
  );
}

/* ---------- Copy email ---------- */

export function CopyEmail({ email }: { email: string }) {
  const toast = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      toast("Email copied");
    } catch {
      toast("Could not copy");
    }
  }
  return (
    <button type="button" className="pc-copy" onClick={copy} aria-label="Copy email address">
      <CopyIcon size={15} />
      COPY
    </button>
  );
}
