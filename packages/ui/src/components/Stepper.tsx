"use client";

import { toFaDigits, type Locale } from "@ela-coffee/i18n";
import { cn } from "../cn";

export interface StepperProps {
  value: number;
  /** Called with the new value when the user steps up or down. */
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  decreaseLabel?: string;
  increaseLabel?: string;
  /** Accessible label for the current value. */
  valueLabel?: string;
  /** Locale for the displayed value: Persian digits in fa. */
  locale?: Locale;
  className?: string;
}

/**
 * Minus / plus quantity control (the bag line-item stepper, audit §2).
 * Buttons are disabled at the bounds, and the value is announced via
 * `aria-live="polite"`. The value renders in Persian digits when
 * locale is "fa" (architecture §10).
 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max,
  decreaseLabel = "Decrease quantity",
  increaseLabel = "Increase quantity",
  valueLabel = "Quantity",
  locale = "en",
  className,
}: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = max === undefined || value < max;

  const buttonClass =
    "inline-flex size-9 items-center justify-center rounded-full text-lg leading-none ring-1 ring-border transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={() => onChange(value - 1)}
        className={buttonClass}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output
        aria-live="polite"
        aria-label={valueLabel}
        className="min-w-6 text-center font-semibold tabular-nums"
      >
        {locale === "fa" ? toFaDigits(value) : value}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
        className={buttonClass}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
