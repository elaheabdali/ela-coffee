import { expect, test } from "@playwright/test";
import type { Locale } from "./locales";

const LOCALE_LIST: Locale[] = ["fa", "en"];

for (const locale of LOCALE_LIST) {
  test.describe(`seo & errors /${locale}`, () => {
    test("unknown route returns the branded 404", async ({ page }) => {
      const response = await page.goto(`/${locale}/does-not-exist`);
      expect(response?.status()).toBe(404);
      // Unmatched routes render global-not-found.tsx, not the
      // [locale] one: it is fa-first by design (it bypasses every
      // layout, so next-intl is unavailable) and carries the English
      // paragraph inline. Both locales get the same page.
      await expect(page.getByRole("heading", { name: "این فنجان خالی است…" })).toBeVisible();
      await expect(page.getByText("۴۰۴")).toBeVisible();
      await expect(page.getByText("This cup is empty…")).toBeVisible();
    });

    test("page head carries canonical, hreflang and Open Graph tags", async ({ page }) => {
      await page.goto(`/${locale}`);
      // NOTE: the base URL is the NEXT_PUBLIC_SITE_URL placeholder
      // (ela-coffee.vercel.app) until Phase 11 replaces it with the
      // real domain — then this assertion moves with it.
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute("href", `https://ela-coffee.vercel.app/${locale}`);
      // hreflang for fa, en and x-default (→ /fa).
      for (const lang of ["fa", "en", "x-default"]) {
        const link = page.locator(`link[rel="alternate"][hreflang="${lang}"]`);
        await expect(link).toHaveAttribute(
          "href",
          `https://ela-coffee.vercel.app/${lang === "x-default" ? "fa" : lang}`,
        );
      }
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
        "content",
        locale === "fa" ? "fa_IR" : "en_US",
      );
      // JSON-LD is present and parses, with the CafeOrCoffeeShop type.
      const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
      const parsed = JSON.parse(jsonLd ?? "") as { "@graph"?: { "@type"?: string }[] };
      expect(parsed["@graph"]?.some((node) => node["@type"] === "CafeOrCoffeeShop")).toBe(true);
    });
  });
}

test.describe("sitemap & robots", () => {
  test("sitemap.xml lists both locales with hreflang alternates", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("https://ela-coffee.vercel.app/fa");
    expect(body).toContain("https://ela-coffee.vercel.app/en");
    expect(body).toContain('hreflang="x-default"');
    // The dev-only design-system catalog is not indexed.
    expect(body).not.toContain("design-system");
  });

  test("robots.txt allows the site, blocks /api/, and points at the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap: https://ela-coffee.vercel.app/sitemap.xml");
  });
});
