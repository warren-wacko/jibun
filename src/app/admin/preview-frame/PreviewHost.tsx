"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { renderPreviewAction, type PreviewRequest } from "../(panel)/pages/preview-action";

/** Messages between the editor and this frame. Only same-origin messages are accepted. */
export type FrameMessage = { type: "render"; seq: number; request: PreviewRequest } | { type: "hello" };
export type FrameReply = { type: "ready" } | { type: "rendered"; seq: number; ok: boolean };

export function PreviewHost() {
  const [element, setElement] = useState<ReactElement | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    let alive = true;
    const onMessage = async (e: MessageEvent<FrameMessage>) => {
      if (e.origin !== window.location.origin) return;
      // The editor may finish loading after this frame did; it says hello until it hears that we are ready.
      if (e.data?.type === "hello") {
        window.parent.postMessage({ type: "ready" } satisfies FrameReply, window.location.origin);
        return;
      }
      if (e.data?.type !== "render") return;
      const { seq, request } = e.data;
      latest.current = seq;
      let result: ReactElement | null = null;
      try {
        result = await renderPreviewAction(request);
      } catch {
        result = null;
      }
      if (!alive || seq !== latest.current) return; // a newer request is already on its way
      if (result) setElement(result);
      window.parent.postMessage({ type: "rendered", seq, ok: Boolean(result) } satisfies FrameReply, window.location.origin);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "ready" } satisfies FrameReply, window.location.origin);
    return () => {
      alive = false;
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return element;
}
