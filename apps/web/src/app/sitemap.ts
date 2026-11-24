import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/seo";

/**
 * Sitemap (Phase 8, architecture §12).
 *
 * Only the public page, in both locales, with hreflang alternates.
 * The dev-only design-system catalog is DELIBERATELY excluded: it is
 * a component showcase, not public content, and must never be indexed
 * (it carries noindex metadata too). /api/ routes are not pages and
 * are excluded by construction — the sitemap lists pages, not APIs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const alternates = {
    languages: {
      fa: `${siteUrl}/fa`,
      en: `${siteUrl}/en`,
      "x-default": `${siteUrl}/fa`,
    },
  };

  return routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
    alternates,
  }));
}
