"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon } from "./icons";

const ToastContext = createContext<(message: string) => void>(() => {});

/** Show a short confirmation ("Link copied"). Safe to call outside a provider (does nothing). */
export const useToast = () => useContext(ToastContext);

/**
 * Wraps a page and renders one live-region toast. `className` styles the pill, so each template
 * keeps its own look while sharing the timing and accessibility behaviour.
 */
export function ToastProvider({ className, children }: { className: string; children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((next: string) => {
    clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(""), 2200);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite">
        {message && (
          <div className={className}>
            <CheckIcon size={16} strokeWidth={2.4} />
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
