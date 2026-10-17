"use client";

import { useState, type ReactNode } from "react";
import { CheckIcon, MoonIcon, ShareIcon, SunIcon, UserPlusIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="pn-toast">{children}</BaseToastProvider>;
}

/* ---------- Header controls ---------- */

export function HeaderThemeToggle() {
  return (
    <ThemeToggle className="pn-icon-btn">
      {(theme) => <span className="pn-sq">{theme === "dark" ? <SunIcon size={16} strokeWidth={1.9} /> : <MoonIcon size={16} strokeWidth={1.9} />}</span>}
    </ThemeToggle>
  );
}

export function HeaderShare({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="pn-icon-btn" onResult={(r) => r === "copied" && toast("Link copied")}>
      <span className="pn-sq pn-sq-pill">
        SHARE
        <ShareIcon size={15} strokeWidth={1.9} />
      </span>
    </ShareButton>
  );
}

/* ---------- Polaroid that flips to a QR code ---------- */

export function PolaroidFlip({ front, back, tape }: { front: ReactNode; back: ReactNode; tape: ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="pn-polaroid-wrap">
      <button
        type="button"
        className="pn-polaroid-btn"
        aria-label={flipped ? "Flip photo back" : "Flip photo to show the QR code"}
        onClick={() => setFlipped((v) => !v)}
      >
        <div className={`pn-flip${flipped ? " is-flipped" : ""}`}>
          <div className="pn-face pn-front" inert={flipped}>
            {front}
          </div>
          <div className="pn-face pn-back" inert={!flipped}>
            {back}
          </div>
        </div>
      </button>
      {tape}
    </div>
  );
}

/* ---------- Save Contact ---------- */

/** A plain download link (works on iOS and Android); the state change is only feedback. */
export function SaveButton({ href, compact }: { href: string; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  return (
    <a
      href={href}
      download
      className={`pn-save${saved ? " is-saved" : ""}${compact ? " pn-save-compact" : ""}`}
      onClick={() => {
        if (!saved) {
          setSaved(true);
          toast("Contact card downloaded");
        }
      }}
    >
      {compact ? (
        <>
          {saved ? <CheckIcon size={19} strokeWidth={2.4} /> : <UserPlusIcon size={19} strokeWidth={2} />}
          <span>{saved ? "Saved" : "Save contact"}</span>
        </>
      ) : (
        <>
          <span>{saved ? "Saved to contacts" : "Save contact"}</span>
          <span className="pn-save-chip">{saved ? <CheckIcon size={19} strokeWidth={2.4} /> : <UserPlusIcon size={19} strokeWidth={2} />}</span>
        </>
      )}
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
    <button type="button" className="pn-copy" onClick={copy} aria-label="Copy email address">
      COPY
    </button>
  );
}
