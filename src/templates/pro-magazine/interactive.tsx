"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { CopyIcon, MoonIcon, QrIcon, ShareIcon, SunIcon, UserPlusIcon, CheckIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="pm-toast">{children}</BaseToastProvider>;
}

/* ---------- Cover controls ---------- */

export function CoverThemeToggle() {
  return (
    <ThemeToggle className="pm-icon-btn">
      {(theme) => (
        <span className="pm-glass pm-glass-round">
          {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </span>
      )}
    </ThemeToggle>
  );
}

export function CoverShare({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="pm-share-btn" onResult={(r) => r === "copied" && toast("Link copied")}>
      <span className="pm-glass pm-glass-pill">
        SHARE
        <ShareIcon size={16} />
      </span>
    </ShareButton>
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
    <button type="button" className="pm-copy" onClick={copy} aria-label="Copy email address">
      <CopyIcon size={15} />
      COPY
    </button>
  );
}

/* ---------- Sticky bottom bar: Save Contact + QR dialog ---------- */

export function BottomBar({
  vcardHref,
  qrHref,
  name,
  displayUrl,
}: {
  vcardHref: string;
  qrHref: string;
  name: string;
  displayUrl: string;
}) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <div className="pm-bar">
      {/* A plain link to the vCard (no `download` attribute): iPhone Safari opens the contact preview straight away; Android downloads it. The state change is only feedback. */}
      <a
        href={vcardHref}
        className={`pm-save${saved ? " is-saved" : ""}`}
        onClick={() => {
          if (!saved) {
            setSaved(true);
            toast("Opening your contact…");
          }
        }}
      >
        <span className="pm-save-text">
          <span className="pm-save-label">{saved ? "Saved to contacts" : "Save Contact"}</span>
          <span className="pm-save-sub">{saved ? "THANKS FOR CONNECTING" : "ADDS ME TO YOUR PHONE"}</span>
        </span>
        <span className="pm-save-chip">{saved ? <CheckIcon strokeWidth={2.2} /> : <UserPlusIcon />}</span>
      </a>

      <button type="button" className="pm-qr-btn" aria-label="Show QR code" onClick={() => dialog.current?.showModal()}>
        <QrIcon size={24} strokeWidth={1.7} />
      </button>

      {/* Native dialog: focus is trapped, Esc closes it, and a click on the backdrop closes it. */}
      <dialog
        ref={dialog}
        className="pm-qr-dialog"
        aria-label="QR code"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="pm-qr-card">
          <span className="pm-label">Scan to save</span>
          <div className="pm-qr-box">
            <Image src={qrHref} alt={`QR code for ${name}'s card`} width={196} height={196} unoptimized />
          </div>
          <div className="pm-qr-who">
            <span className="pm-qr-name">{name}</span>
            <span className="pm-qr-url">{displayUrl}</span>
          </div>
          <button type="button" className="pm-qr-close" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
