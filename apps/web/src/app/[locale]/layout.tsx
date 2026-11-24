import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
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

export const metadata: Metadata = {
  title: "Kuro Coffee — Small-batch iced lattes",
  description:
    "Small-batch iced lattes and matchas, poured black first, flavoured fresh every morning.",
};

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
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
