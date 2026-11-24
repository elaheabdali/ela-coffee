import type { ReactNode } from "react";

/**
 * Root layout. It renders only the children: the `<html>` / `<body>`
 * elements (with per-locale `lang` / `dir` and the font variables) live
 * in `src/app/[locale]/layout.tsx`. This is the documented next-intl
 * App Router pattern.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
