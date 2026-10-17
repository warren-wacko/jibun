"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CheckIcon, MoonIcon, QrIcon, ShareIcon, SunIcon, UserPlusIcon } from "@/components/icons";
import { ShareButton } from "@/components/ShareButton";
import { ToastProvider as BaseToastProvider, useToast } from "@/components/Toast";
import { ThemeToggle } from "../ThemeScope";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <BaseToastProvider className="pb-toast">{children}</BaseToastProvider>;
}

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/* ---------- Theme and share tiles (they are grid tiles themselves) ---------- */

export function ThemeTile() {
  return (
    <ThemeToggle className="pb-tile pb-theme pb-center">
      {(theme) => (theme === "dark" ? <SunIcon size={22} strokeWidth={1.9} /> : <MoonIcon size={22} strokeWidth={1.9} />)}
    </ThemeToggle>
  );
}

export function ShareTile({ url, title }: { url: string; title: string }) {
  const toast = useToast();
  return (
    <ShareButton url={url} title={title} className="pb-tile pb-share pb-center" onResult={(r) => r === "copied" && toast("Link copied")}>
      <ShareIcon size={22} strokeWidth={1.9} />
    </ShareButton>
  );
}

export { delay };

/* ---------- Save Contact + QR sheet ---------- */

/** A plain download link (works on iOS and Android); the state change is only feedback. */
export function SaveButton({ href }: { href: string }) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  return (
    <a
      href={href}
      download
      className={`pb-save${saved ? " is-saved" : ""}`}
      onClick={() => {
        if (!saved) {
          setSaved(true);
          toast("Contact saved");
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
      <button type="button" className="pb-qr-btn" aria-label="Show QR code" onClick={() => dialog.current?.showModal()}>
        <QrIcon size={20} strokeWidth={1.9} />
      </button>
      <dialog
        ref={dialog}
        className="pb-sheet"
        aria-label="QR code"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="pb-sheet-card">
          <div className="pb-sheet-handle" aria-hidden="true" />
          <span className="pb-sheet-title">Scan to add {name}</span>
          <div className="pb-sheet-frame">
            <div className="pb-sheet-qr">
              <Image src={qrHref} alt={`QR code for ${name}'s card`} width={180} height={180} unoptimized />
            </div>
          </div>
          <span className="pb-sheet-url">{url}</span>
          <button type="button" className="pb-sheet-done" onClick={() => dialog.current?.close()}>
            Done
          </button>
        </div>
      </dialog>
    </>
  );
}
