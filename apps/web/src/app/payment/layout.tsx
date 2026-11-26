import type { ReactNode } from "react";
import "../globals.css";

/**
 * Minimal layout for the locale-less payment pages (the mock gateway).
 *
 * The root layout renders only its children and the `<html>` / `<body>`
 * elements live in `src/app/[locale]/layout.tsx`, so any route outside
 * `[locale]` needs its own shell. This one is deliberately plain —
 * the mock gateway is a dev/demo simulation page, not part of the
 * storefront — Persian-first (RTL) with both languages on the page.
 */
export default function PaymentLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-brand="ela">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
