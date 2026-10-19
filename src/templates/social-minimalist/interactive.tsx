"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { CheckIcon, MoonIcon, QrIcon, ShareIcon, SunIcon, UserPlusIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="mn-toast">{children}</BaseToastProvider>;
}

/* ---------- Header buttons ---------- */

export function HeaderThemeToggle() {
  return (
    <ThemeToggle className="mn-icon-btn">
      {(theme) => (theme === "dark" ? <SunIcon size={18} strokeWidth={1.7} /> : <MoonIcon size={18} strokeWidth={1.7} />)}
    </ThemeToggle>
  );
}

export function HeaderShare({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="mn-icon-btn" onResult={(r) => r === "copied" && toast("Link copied")}>
      <ShareIcon size={18} strokeWidth={1.7} />
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
      className={`mn-save${saved ? " is-saved" : ""}`}
      onClick={() => {
        if (!saved) {
          setSaved(true);
          toast("Opening your contact…");
        }
      }}
    >
      {saved ? <CheckIcon size={16} strokeWidth={2.4} /> : <UserPlusIcon size={16} strokeWidth={1.9} />}
      {saved ? "Saved" : "Save contact"}
    </a>
  );
}

/** QR button that opens a bottom sheet (native dialog: focus is trapped, Esc and a backdrop click close it). */
export function QrSheet({ qrHref, name, url }: { qrHref: string; name: string; url: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="mn-qr-btn" aria-label="Show QR code" onClick={() => dialog.current?.showModal()}>
        <QrIcon size={19} strokeWidth={1.7} />
      </button>
      <dialog
        ref={dialog}
        className="mn-sheet"
        aria-label="QR code"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="mn-sheet-card">
          <div className="mn-sheet-handle" aria-hidden="true" />
          <span className="mn-sheet-title">
            Scan to add <em>{name}</em>
          </span>
          <div className="mn-sheet-qr">
            <Image src={qrHref} alt={`QR code for ${name}'s card`} width={188} height={188} unoptimized />
          </div>
          <span className="mn-sheet-url">{url}</span>
          <button type="button" className="mn-sheet-done" onClick={() => dialog.current?.close()}>
            Done
          </button>
        </div>
      </dialog>
    </>
  );
}
