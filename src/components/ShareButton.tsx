"use client";

import { useState } from "react";
import { TILE } from "./tile";

/** Web Share API, falling back to copying the link. */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function onClick() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch (err) {
      // Closing the share sheet rejects with AbortError: not a failure.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button type="button" onClick={onClick} className={TILE}>
      <span aria-live="polite">
        {status === "copied" ? "Link copied" : status === "failed" ? "Could not share" : "Share"}
      </span>
    </button>
  );
}
