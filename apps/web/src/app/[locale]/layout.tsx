import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { buildJsonLd, buildMetadata, serializeJsonLd } from "@/lib/seo";
import "@fontsource-variable/vazirmatn";
import "../globals.css";

/**
 * Self-hosted fonts, wired with next/font/local (font-display: swap).
 * Fraunces / Manrope / Geist Mono are the supplied latin-subset woff2
 * files (audit §5.2), copied to public/fonts and renamed. Vazirmatn
 * comes from the @fontsource-variable/vazirmatn npm package — no Google
 * Fonts, no CDN. Fallback metrics are computed by next/font automatically
 * (audit §3.3 values: Manrope→Arial, Fraunces→Times New Roman,
 * Geist Mono→Arial).
 */
const fraunces = localFont({
  src: "../../../public/fonts/fraunces-black.woff2",
  variable: "--font-app-heading",
  display: "swap",
  weight: "100 900",
});

const manrope = localFont({
  src: "../../../public/fonts/manrope-extralight.woff2",
  variable: "--font-app-sans",
  display: "swap",
  weight: "200 800",
});

const geistMono = localFont({
  src: "../../../public/fonts/geist-mono.woff2",
  variable: "--font-app-mono",
  display: "swap",
  weight: "100 900",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata(locale === "en" ? "en" : "fa");
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "fa" ? "rtl" : "ltr"}
      data-brand="kuro"
      className={`${fraunces.variable} ${manrope.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/*
          Structured data (Phase 8): built from the same dataset as the
          page, so it can never disagree with the menu on screen.
          `dangerouslySetInnerHTML` is the documented Next.js way to emit
          JSON-LD; the payload is server-built from our own trusted
          dataset (no user input) and serializeJsonLd escapes `<`, so a
          `</script>` breakout is structurally impossible. This is the
          single sanctioned use in the codebase — see SECURITY.md §3.
          CSP allows it: the script is same-origin inline JSON, and the
          production CSP keeps script-src 'self' 'unsafe-inline'.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildJsonLd(locale === "en" ? "en" : "fa")),
          }}
        />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
