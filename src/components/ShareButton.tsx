"use client";

import { useState, type ReactNode } from "react";
import { TILE } from "./tile";

export type ShareResult = "shared" | "copied" | "failed";

/**
 * Web Share API, falling back to copying the link.
 * Default: a tile that shows its own status. Pass `children` and `className` to restyle it, and
 * `onResult` to react to the outcome (for example to show a toast).
 */
export function ShareButton({
  url,
  title,
  className,
  children,
  onResult,
}: {
  url: string;
  title: string;
  className?: string;
  children?: ReactNode;
  onResult?: (result: ShareResult) => void;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function onClick() {
    let result: ShareResult;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        onResult?.("shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      result = "copied";
    } catch (err) {
      // Closing the share sheet rejects with AbortError: not a failure.
      if (err instanceof DOMException && err.name === "AbortError") return;
      result = "failed";
    }
    setStatus(result === "copied" ? "copied" : "failed");
    onResult?.(result);
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button type="button" onClick={onClick} className={className ?? TILE} aria-label={children ? "Share this card" : undefined}>
      {children ?? (
        <span aria-live="polite">
          {status === "copied" ? "Link copied" : status === "failed" ? "Could not share" : "Share"}
        </span>
      )}
    </button>
  );
}
