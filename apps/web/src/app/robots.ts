import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/**
 * robots.txt (Phase 8, architecture §12).
 *
 * Everything public is crawlable; /api/ is disallowed (it is an
 * application API, not content). The sitemap URL uses the same
 * placeholder base URL as the rest of Phase 8 — see src/lib/seo.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
