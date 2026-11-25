"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn";

export interface DialogProps {
  /** Whether the dialog is shown. When false, nothing is rendered. */
  open: boolean;
  /** Called on Esc, overlay click, or the close button. */
  onClose: () => void;
  /** Heading text — also used as the accessible name (`aria-labelledby`). */
  title: string;
  description?: string;
  children: ReactNode;
  /** Accessible label for the close (X) button. */
  closeLabel?: string;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog (the reference's tasting-notes / all-flavours
 * pattern, audit §2). Focus is trapped inside while open, Escape closes,
 * clicking the overlay closes, and focus returns to the element that
 * opened it. Enter animation is fade + scale (`ela-dialog-in`, audit §4);
 * under `prefers-reduced-motion` the animation is disabled in globals.css.
 *
 * Rendered in a portal so it is never clipped by an ancestor's overflow.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  closeLabel = "Close",
  className,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement;
    const panel = panelRef.current;
    if (!panel) return;

    // Focus the panel itself first (it is tabbable), then the first
    // focusable control inside it.
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    (focusables[0] ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      // Return focus to whatever opened the dialog.
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden="true"
        data-testid="dialog-overlay"
        onClick={onClose}
        tabIndex={-1}
        className="animate-ela-dialog-overlay-in absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-ela-dialog-in relative w-full max-w-md rounded-2xl bg-card p-6 text-foreground shadow-ela-hero outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="font-display text-2xl font-bold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[scale,background-color,color] hover:bg-accent hover:text-foreground active:scale-95"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
