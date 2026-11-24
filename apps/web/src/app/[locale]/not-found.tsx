import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { toFaDigits } from "@ela-coffee/i18n";
import { Link } from "@/i18n/navigation";

/**
 * Branded 404, kept from the reference: "This cup is empty." (audit §1).
 *
 * NOTE: Next.js does not pass `params` to a `not-found.tsx`, so the locale
 * is read from the request with next-intl's `getLocale()` instead.
 */
export default async function NotFound() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="font-display text-8xl font-black tracking-[-0.02em]">
        {locale === "fa" ? toFaDigits("404") : "404"}
      </p>
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="max-w-md text-muted-foreground">{t("body")}</p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground"
      >
        {t("back")}
      </Link>
    </main>
  );
}
