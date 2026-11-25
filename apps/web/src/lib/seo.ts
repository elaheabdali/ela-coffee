import type { Metadata } from "next";
import { ALL_DRINKS, BRANDS, type BrandData, type Drink } from "@/data/flavours";
import type { Locale } from "@/i18n/routing";

/**
 * SEO helpers (Phase 8, architecture §12).
 *
 * DEFAULT SITE URL — the real production domain (deployed in Phase 11
 * to https://ela-coffee-yi88.vercel.app). Canonical URLs, hreflang, OG
 * URLs, the sitemap and robots.txt all use NEXT_PUBLIC_SITE_URL, which
 * defaults to this value; the Vercel project env var overrides it in
 * production, so the two must stay in sync if the domain ever changes.
 * Never hardcode a localhost URL as canonical.
 */
export const DEFAULT_SITE_URL = "https://ela-coffee-yi88.vercel.app";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return fromEnv ? fromEnv.replace(/\/$/, "") : DEFAULT_SITE_URL;
}

const COPY: Record<
  Locale,
  {
    title: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
    siteName: string;
    ogLocale: "fa_IR" | "en_US";
    ogImageAlt: string;
  }
> = {
  fa: {
    title: "الا | لاته‌های یخی دست‌ساز",
    titleTemplate: "%s | الا",
    description:
      "لاته‌های یخی و ماچای دست‌ساز الا؛ اسپرسو اول سیاه ریخته می‌شود و طعم‌ها هر صبح تازه، از کارامل و وانیل واقعی ساخته می‌شوند.",
    keywords: ["لاته یخی", "ماچا", "قهوه تخصصی", "الا", "اسپرسو", "کافه"],
    siteName: "الا",
    ogLocale: "fa_IR",
    ogImageAlt: "یک لیوان لاتهٔ یخی الا روی تپه‌ای از قهوهٔ آسیاب‌شده",
  },
  en: {
    title: "Ela Coffee — Small-batch iced lattes",
    titleTemplate: "%s | Ela Coffee",
    description:
      "Small-batch iced lattes and matchas, poured black first, flavored fresh every morning.",
    keywords: ["iced latte", "matcha", "specialty coffee", "Ela Coffee", "espresso", "cafe"],
    siteName: "Ela Coffee",
    ogLocale: "en_US",
    ogImageAlt: "A Ela iced latte on a mound of ground coffee",
  },
};

/** Per-locale metadata for the single page (architecture §12). */
export function buildMetadata(locale: Locale): Metadata {
  const siteUrl = getSiteUrl();
  const copy = COPY[locale];
  const otherLocale: Locale = locale === "fa" ? "en" : "fa";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: copy.title, template: copy.titleTemplate },
    description: copy.description,
    keywords: copy.keywords,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fa: `${siteUrl}/fa`,
        en: `${siteUrl}/en`,
        "x-default": `${siteUrl}/fa`,
      },
    },
    openGraph: {
      type: "website",
      locale: copy.ogLocale,
      alternateLocale: COPY[otherLocale].ogLocale,
      url: `${siteUrl}/${locale}`,
      siteName: copy.siteName,
      title: copy.title,
      description: copy.description,
      images: [
        {
          // 1920×1072, the supplied hero scene (audit §5.1).
          url: `${siteUrl}/images/scenes/original.webp`,
          width: 1920,
          height: 1072,
          alt: copy.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [`${siteUrl}/images/scenes/original.webp`],
    },
  };
}

export interface JsonLdMenuItem {
  "@type": "MenuItem";
  name: string;
  description: string;
  offers: { "@type": "Offer"; price: number; priceCurrency: "IRR" };
}

/**
 * Structured data, built from the same dataset as the page
 * (src/data/flavours.ts) so the menu in JSON-LD can never disagree
 * with the menu on screen.
 *
 * Prices are the PLACEHOLDER Toman values (architecture §14) — they
 * must be replaced with the client's real prices before delivery.
 * priceRange is the min–max of the same dataset, formatted as the
 * task's literal "180000-210000 IRR" for the current seed data.
 */
export function buildJsonLd(locale: Locale): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const isFa = locale === "fa";
  const allDrinks: Drink[] = ALL_DRINKS;
  const prices = allDrinks.map((drink) => drink.priceToman);
  const priceRange = `${Math.min(...prices)}-${Math.max(...prices)} IRR`;

  const sections = (Object.values(BRANDS) as BrandData[]).map((brand) => {
    const menuItems: JsonLdMenuItem[] = brand.drinks.map((drink) => ({
      "@type": "MenuItem",
      name: isFa ? drink.nameFa : drink.nameEn,
      description: isFa ? drink.descriptionFa : drink.descriptionEn,
      offers: { "@type": "Offer", price: drink.priceToman, priceCurrency: "IRR" },
    }));
    return {
      "@type": "MenuSection",
      name: isFa
        ? brand.brand === "ela"
          ? "لاته‌های یخی"
          : "ماچاهای یخی"
        : brand.brand === "ela"
          ? "Iced lattes"
          : "Iced matchas",
      hasMenuItem: menuItems,
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CafeOrCoffeeShop",
        "@id": `${siteUrl}/#cafe`,
        name: isFa ? "الا" : "Ela Coffee",
        alternateName: isFa ? "Ela Coffee" : "الا",
        description: COPY[locale].description,
        url: `${siteUrl}/${locale}`,
        servesCuisine: ["Coffee", "Matcha"],
        priceRange,
        acceptsReservations: true,
        hasMenu: {
          "@type": "Menu",
          name: isFa ? "منوی الا" : "Ela menu",
          hasMenuSection: sections,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: isFa ? "خانه" : "Home",
            item: `${siteUrl}/${locale}`,
          },
        ],
      },
    ],
  };
}

/**
 * Serialize JSON-LD for an inline <script type="application/ld+json">.
 * `<` is escaped to \u003c so a `</script>` sequence can never break
 * out of the tag — the data is server-built from our own dataset, but
 * the escaping makes the injection structurally impossible.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
