"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { CheckIcon, MoonIcon, QrIcon, ShareIcon, SunIcon, UserPlusIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="pk-toast">{children}</BaseToastProvider>;
}

/* ---------- Header buttons ---------- */

export function HeaderThemeToggle() {
  return (
    <ThemeToggle className="pk-icon-btn">
      {(theme) => (
        <span className="pk-round">{theme === "dark" ? <SunIcon size={16} strokeWidth={1.9} /> : <MoonIcon size={16} strokeWidth={1.9} />}</span>
      )}
    </ThemeToggle>
  );
}

export function HeaderShare({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="pk-icon-btn" onResult={(r) => r === "copied" && toast("Link copied")}>
      <span className="pk-round">
        <ShareIcon size={16} strokeWidth={1.9} />
      </span>
    </ShareButton>
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
      className={`pk-save${saved ? " is-saved" : ""}`}
      onClick={() => {
        if (!saved) {
          setSaved(true);
          toast("Opening your contact…");
        }
      }}
    >
      {saved ? <CheckIcon size={16} strokeWidth={2.6} /> : <UserPlusIcon size={16} strokeWidth={2.1} />}
      {saved ? "Saved!" : "Save contact"}
    </a>
  );
}

/** QR button that opens a bottom sheet (native dialog: focus is trapped, Esc and a backdrop click close it). */
export function QrSheet({ qrHref, name, url }: { qrHref: string; name: string; url: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="pk-qr-btn" aria-label="Show QR code" onClick={() => dialog.current?.showModal()}>
        <QrIcon size={20} strokeWidth={1.9} />
      </button>
      <dialog
        ref={dialog}
        className="pk-sheet"
        aria-label="QR code"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="pk-sheet-card">
          <span className="pk-sheet-title">scan to add {name}</span>
          <div className="pk-sheet-qr">
            <div className="pk-sheet-tape" aria-hidden="true" />
            <Image src={qrHref} alt={`QR code for ${name}'s card`} width={196} height={196} unoptimized />
          </div>
          <span className="pk-sheet-url">{url}</span>
          <button type="button" className="pk-sheet-done" onClick={() => dialog.current?.close()}>
            DONE
          </button>
        </div>
      </dialog>
    </>
  );
}
