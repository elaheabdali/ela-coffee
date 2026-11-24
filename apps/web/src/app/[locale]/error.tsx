"use client";

import { usePathname } from "next/navigation";

/**
 * Branded 500 page (Phase 8, architecture §12).
 *
 * The locale is read from the URL path, not from next-intl: an error
 * boundary can render when a provider above it failed, so this page
 * must not depend on the intl provider. Both languages are inline
 * (same pattern as global-not-found.tsx), primary copy in the URL
 * locale, secondary line in the other language.
 *
 * Deliberately renders NO stack trace, error message or digest: the
 * user gets a friendly page, the details stay in the server logs.
 */
const COPY = {
  fa: {
    title: "مشکلی پیش آمد…",
    body: "فنجان را زمین گذاشتیم — مشکلی در بارگذاری این صفحه پیش آمد. دوباره تلاش کن؛ اگر ادامه داشت، بعداً برگرد.",
    retry: "تلاش دوباره",
    home: "بازگشت به طعم‌ها",
  },
  en: {
    title: "Something went wrong…",
    body: "We set the cup down — something went wrong loading this page. Try again; if it keeps happening, come back later.",
    retry: "Try again",
    home: "Back to the flavors",
  },
} as const;

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "fa";
  const other = locale === "fa" ? "en" : "fa";
  const copy = COPY[locale];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="font-display text-8xl font-black tracking-[-0.02em]">
        {locale === "fa" ? "۵۰۰" : "500"}
      </p>
      <h1 className="font-display text-3xl font-bold">{copy.title}</h1>
      <p className="max-w-md text-muted-foreground">{copy.body}</p>
      <p
        className="max-w-md text-sm text-muted-foreground"
        lang={other}
        dir={other === "fa" ? "rtl" : "ltr"}
      >
        {COPY[other].body}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground"
        >
          {copy.retry}
        </button>
        <a
          href={`/${locale}`}
          className="inline-flex items-center rounded-full border border-current px-5 py-2.5 font-medium"
        >
          {copy.home}
        </a>
      </div>
    </main>
  );
}
