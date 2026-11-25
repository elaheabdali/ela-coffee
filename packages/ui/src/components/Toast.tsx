"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";
import { cn } from "../cn";

export interface ToastProps {
  /** Message text. */
  message: string;
  /** Whether the toast is shown. When false, nothing is rendered. */
  open: boolean;
  /** Called after `durationMs` (auto-dismiss) — the parent hides it. */
  onClose?: () => void;
  /** Auto-dismiss delay in milliseconds. Set 0 to disable auto-dismiss. */
  durationMs?: number;
  /**
   * Changing this value re-triggers the `ela-bump` animation
   * (audit §4, .48s) — used when a count the toast refers to changes.
   */
  bumpKey?: string | number;
  className?: string;
}

/**
 * Bottom-centre toast (the reference's "added to your bag" feedback,
 * audit §2). `role="status"` + `aria-live="polite"` announce it to
 * screen readers without interrupting them. Cream pill + check icon
 * (fix batch 5): the old dark-on-dark pill was easy to miss over the
 * busy menu photos, so the toast now reads as the reference's own
 * "Added" confirmation — crema-on-cream like the hero chip's check.
 */
export function Toast({
  message,
  open,
  onClose,
  durationMs = 4000,
  bumpKey,
  className,
}: ToastProps) {
  useEffect(() => {
    if (!open || !onClose || durationMs <= 0) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, durationMs]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-ela-dialog-in pointer-events-auto inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2.5 text-sm font-semibold text-espresso shadow-ela-lift ring-1 ring-espresso/20",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-espresso p-1 text-cream"
      >
        <Check size={14} />
      </span>
      <span
        key={bumpKey}
        className={bumpKey !== undefined ? "animate-ela-bump inline-block" : undefined}
      >
        {message}
      </span>
    </div>
  );
}

interface ToastItem {
  id: number;
  message: string;
}

interface ToastContextValue {
  /** Show a toast that dismisses itself after `durationMs`. */
  showToast: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Read the toast API. Must be used inside a `ToastProvider`. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
}

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast host: renders toasts bottom-centre in an `aria-live="polite"`
 * region and removes each one after its duration. Wrap the app (or a
 * section) once; call `showToast` from any client component inside it.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const showToast = useCallback((message: string, durationMs = 4000) => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setItems((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <Toast key={item.id} message={item.message} open />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
