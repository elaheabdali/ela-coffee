import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button while an action is running. */
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  // Accent (crema in kuro, green in midori) — the reference's main action.
  primary: "bg-primary text-primary-foreground hover:brightness-110",
  // Quiet surface action.
  secondary: "bg-secondary text-foreground ring-1 ring-border hover:bg-accent",
  // No background at all.
  ghost: "bg-transparent text-foreground hover:bg-accent",
  // Visible ring, transparent fill.
  outline: "bg-transparent text-foreground ring-1 ring-foreground/50 hover:bg-foreground/10",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
};

/**
 * Action button. Colours come from the brand tokens (`--primary` /
 * `--primary-foreground`), so it follows the kuro → midori brand switch
 * automatically. Hover `scale-105` / active `scale-95` match the
 * reference's add-to-bag behaviour (audit §4); focus is always visible
 * via the global `:focus-visible` ring (audit defect §8.6).
 */
export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[scale,background-color,filter] duration-200 ease-out",
        "enabled:hover:scale-105 enabled:active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
