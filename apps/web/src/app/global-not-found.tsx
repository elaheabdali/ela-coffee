import "./globals.css";

/**
 * Branded 404 for URLs that match no route at all (e.g. /fa/does-not-exist).
 *
 * Next.js 16 renders `not-found.tsx` only when `notFound()` is thrown
 * inside a segment; unmatched routes need `global-not-found.tsx`
 * (experimental `globalNotFound` flag in next.config.ts). This file
 * bypasses every layout, so it renders its own <html>/<body>, imports
 * globals.css itself, and carries both languages inline — next-intl is
 * not available here. Fonts fall back to system sans on this page only
 * (next/font variables live in [locale]/layout.tsx, which is bypassed);
 * the brand tokens and dark background still apply.
 */
export default function GlobalNotFound() {
  return (
    <html lang="fa" dir="rtl" data-brand="ela">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 text-center">
          <p className="text-8xl font-black tracking-[-0.02em]">۴۰۴</p>
          <h1 className="text-3xl font-bold">این فنجان خالی است…</h1>
          <p className="max-w-md text-muted-foreground">
            صفحه‌ای که دنبالش بودی جابه‌جا شده یا هرگز وجود نداشته است.
          </p>
          <p className="max-w-md text-sm text-muted-foreground" lang="en" dir="ltr">
            This cup is empty… The page you were looking for has moved or never existed.
          </p>
          <a
            href="/fa"
            className="mt-2 inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground"
          >
            بازگشت به طعم‌ها
          </a>
        </main>
      </body>
    </html>
  );
}
