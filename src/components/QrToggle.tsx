"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { TILE } from "./tile";

/**
 * Flips the card header between its front and a QR face. Both faces use
 * backface-visibility: hidden and the back is pre-rotated 180deg, so the QR is
 * never mirrored. The hidden face is inert so it cannot be focused or read out.
 */
export function QrToggle({ front, qrHref, name }: { front: ReactNode; qrHref: string; name: string }) {
  const [showQr, setShowQr] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="[perspective:1000px]">
        <div
          className={`grid transition-transform duration-500 motion-reduce:transition-none [transform-style:preserve-3d] ${
            showQr ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="[grid-area:1/1] [backface-visibility:hidden]" inert={showQr}>
            {front}
          </div>
          <div
            className="flex items-center justify-center [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]"
            inert={!showQr}
          >
            <div className="rounded-lg bg-white p-3">
              <Image src={qrHref} alt={`QR code for ${name}'s card`} width={220} height={220} unoptimized />
            </div>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => setShowQr((v) => !v)} aria-pressed={showQr} className={TILE}>
        {showQr ? "Show card" : "Show QR code"}
      </button>
    </div>
  );
}
