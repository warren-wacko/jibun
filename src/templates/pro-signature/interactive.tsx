"use client";

import { useSaveContact } from "@/lib/save-contact";
import { useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon, MoonIcon, PlusIcon, ShareIcon, SunIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="ps-toast">{children}</BaseToastProvider>;
}

/* ---------- Header controls ---------- */

export function HeaderThemeToggle() {
  return (
    <ThemeToggle className="ps-icon-btn">
      {(theme) => (
        <span className="ps-icon-ring">{theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}</span>
      )}
    </ThemeToggle>
  );
}

export function HeaderShare({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="ps-icon-btn" onResult={(r) => r === "copied" && toast("Link copied")}>
      <span className="ps-icon-ring">
        <ShareIcon size={16} />
      </span>
    </ShareButton>
  );
}

/* ---------- Flip card ---------- */

export function CardFlip({ front, back }: { front: ReactNode; back: ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="ps-hero">
      <button
        type="button"
        className="ps-card-btn"
        aria-label={flipped ? "Flip card to show the front" : "Flip card to show the QR code"}
        onClick={() => setFlipped((v) => !v)}
      >
        <div className={`ps-flip${flipped ? " is-flipped" : ""}`}>
          <div className="ps-face" inert={flipped}>
            {front}
          </div>
          <div className="ps-face ps-back" inert={!flipped}>
            {back}
          </div>
        </div>
      </button>
      <div className="ps-dots" aria-hidden="true">
        <span className={`ps-dot${flipped ? "" : " is-active"}`} />
        <span className={`ps-dot${flipped ? " is-active" : ""}`} />
      </div>
    </div>
  );
}

/* ---------- Save Contact ---------- */

/** A plain link to the vCard (no `download` attribute): iPhone Safari opens the contact preview straight away; Android downloads it. The state change is only feedback. */
export function SaveButton({ href, vcard }: { href: string; vcard: string }) {
  const [saved, setSaved] = useState(false);
  const save = useSaveContact(href, vcard);
  return (
    <a
      href={href}
      onPointerDown={save.prime}
      onTouchStart={save.prime}
      onMouseEnter={save.prime}
      className={`ps-save${saved ? " is-saved" : ""}`}
      onClick={(e) => {
        save.onClick(e);
        setSaved(true);
      }}
    >
      <span className="ps-save-chip">{saved ? <CheckIcon size={17} strokeWidth={2.4} /> : <PlusIcon size={17} strokeWidth={2} />}</span>
      {saved ? "Saved to contacts" : "Save Contact"}
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
    <button type="button" className="ps-copy" onClick={copy} aria-label="Copy email address">
      <CopyIcon size={15} />
      COPY
    </button>
  );
}
