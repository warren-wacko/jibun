"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { CheckIcon, CopyIcon, MoonIcon, QrIcon, ShareIcon, SunIcon, UserPlusIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="pco-toast">{children}</BaseToastProvider>;
}

/* ---------- Top bar controls ---------- */

export function TopThemeToggle() {
  return (
    <ThemeToggle className="pco-icon-btn">
      {(theme) => (theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />)}
    </ThemeToggle>
  );
}

export function TopShare({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="pco-icon-btn" onResult={(r) => r === "copied" && toast("Link copied")}>
      <ShareIcon size={18} />
    </ShareButton>
  );
}

/* ---------- Copy a value (number, email) ---------- */

export function CopyButton({
  text,
  label,
  ariaLabel,
  className,
  size,
}: {
  text: string;
  label: string;
  ariaLabel: string;
  className: string;
  size: number;
}) {
  const toast = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`);
    } catch {
      toast("Could not copy");
    }
  }
  return (
    <button type="button" className={className} onClick={copy} aria-label={ariaLabel}>
      <CopyIcon size={size} strokeWidth={1.9} />
    </button>
  );
}

/* ---------- Save Contact + QR sheet ---------- */

/** A plain link to the vCard (no `download` attribute): iPhone Safari opens the contact preview straight away; Android downloads it. The state change is only feedback. */
export function SaveButton({ href }: { href: string }) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  return (
    <a
      href={href}
      className={`pco-save${saved ? " is-saved" : ""}`}
      onClick={() => {
        if (!saved) {
          setSaved(true);
          toast("Opening your contact…");
        }
      }}
    >
      {saved ? <CheckIcon size={19} strokeWidth={2.4} /> : <UserPlusIcon size={19} strokeWidth={1.9} />}
      {saved ? "Saved" : "Save contact"}
    </a>
  );
}

/** QR button that opens a bottom sheet (native dialog: focus is trapped, Esc and a backdrop click close it). */
export function QrSheet({ qrHref, name, url }: { qrHref: string; name: string; url: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="pco-qr-btn" aria-label="Show QR code" onClick={() => dialog.current?.showModal()}>
        <QrIcon size={22} />
      </button>
      <dialog
        ref={dialog}
        className="pco-sheet"
        aria-label="QR code"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="pco-sheet-card">
          <div className="pco-sheet-handle" aria-hidden="true" />
          <span className="pco-sheet-title">Scan to save my card</span>
          <div className="pco-sheet-qr">
            <Image src={qrHref} alt={`QR code for ${name}'s card`} width={196} height={196} unoptimized />
          </div>
          <span className="pco-sheet-url">{url}</span>
          <button type="button" className="pco-sheet-done" onClick={() => dialog.current?.close()}>
            Done
          </button>
        </div>
      </dialog>
    </>
  );
}
