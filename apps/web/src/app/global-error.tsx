"use client";

/**
 * Global error page (Phase 8, architecture §12).
 *
 * Rendered when even the locale layout fails, so it lives outside
 * every layout and carries its own <html>/<body> with both languages
 * inline (same pattern as global-not-found.tsx). Minimal by design:
 * no translations, no providers, no stack trace — just the brand,
 * the message, and a way back.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl" data-brand="kuro">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 text-center">
          <p className="font-display text-8xl font-black tracking-[-0.02em]">۵۰۰</p>
          <h1 className="font-display text-3xl font-bold">مشکلی پیش آمد…</h1>
          <p className="max-w-md text-muted-foreground">
            فنجان را زمین گذاشتیم — مشکلی در بارگذاری این صفحه پیش آمد. دوباره تلاش کن؛ اگر ادامه
            داشت، بعداً برگرد.
          </p>
          <p className="max-w-md text-sm text-muted-foreground" lang="en" dir="ltr">
            Something went wrong… We set the cup down — something went wrong loading this page. Try
            again; if it keeps happening, come back later.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground"
            >
              تلاش دوباره
            </button>
            <a
              href="/fa"
              className="inline-flex items-center rounded-full border border-current px-5 py-2.5 font-medium"
            >
              بازگشت به طعم‌ها
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
