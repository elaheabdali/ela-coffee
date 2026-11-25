import { describe, expect, it } from "vitest";
import { ALL_DRINKS } from "@/data/flavours";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import {
  buildJsonLd,
  buildMetadata,
  getSiteUrl,
  DEFAULT_SITE_URL,
  serializeJsonLd,
} from "./seo";

/**
 * SEO (Phase 8): metadata, JSON-LD, sitemap and robots are built from
 * one place (src/lib/seo.ts), so the tests assert the builders, not
 * the rendered HTML — the live curl check in the Phase 8 doc covers
 * the rendered output.
 */
describe("getSiteUrl (Phase 8)", () => {
  it("defaults to the production domain", () => {
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
    expect(DEFAULT_SITE_URL).toBe("https://ela-coffee-yi88.vercel.app");
  });
});

describe("buildMetadata (Phase 8)", () => {
  it("fa: Persian title/description, canonical /fa, hreflang fa/en/x-default", () => {
    const meta = buildMetadata("fa");
    expect(meta.metadataBase?.toString()).toBe(`${DEFAULT_SITE_URL}/`);
    expect(meta.title).toEqual({ default: "الا | لاته‌های یخی دست‌ساز", template: "%s | الا" });
    expect(meta.description).toContain("الا");
    expect(meta.alternates?.canonical).toBe("/fa");
    expect(meta.alternates?.languages).toEqual({
      fa: `${DEFAULT_SITE_URL}/fa`,
      en: `${DEFAULT_SITE_URL}/en`,
      "x-default": `${DEFAULT_SITE_URL}/fa`,
    });
    expect(meta.openGraph?.locale).toBe("fa_IR");
    expect(meta.openGraph?.alternateLocale).toBe("en_US");
    // `Twitter` is a union; the base member has no `card` key.
    const twitter = meta.twitter as { card?: string } | null | undefined;
    expect(twitter?.card).toBe("summary_large_image");
  });

  it("en: English title/description, canonical /en, hreflang fa/en/x-default", () => {
    const meta = buildMetadata("en");
    expect(meta.title).toEqual({
      default: "Ela Coffee — Small-batch iced lattes",
      template: "%s | Ela Coffee",
    });
    expect(meta.description).toContain("iced lattes");
    expect(meta.alternates?.canonical).toBe("/en");
    expect(meta.openGraph?.locale).toBe("en_US");
    expect(meta.openGraph?.alternateLocale).toBe("fa_IR");
  });

  it("OG image is the hero scene with its real dimensions", () => {
    const meta = buildMetadata("en");
    const images = meta.openGraph?.images;
    expect(Array.isArray(images)).toBe(true);
    const image = (images as { url: string; width: number; height: number; alt: string }[])[0];
    expect(image.url).toBe(`${DEFAULT_SITE_URL}/images/scenes/original.webp`);
    expect(image.width).toBe(1920);
    expect(image.height).toBe(1072);
    expect(image.alt.length).toBeGreaterThan(0);
  });

  it("robots meta allows indexing and following", () => {
    expect(buildMetadata("fa").robots).toEqual({ index: true, follow: true });
  });
});

describe("buildJsonLd (Phase 8)", () => {
  it("fa: CafeOrCoffeeShop + Menu with all 12 drinks at seed prices", () => {
    const data = buildJsonLd("fa");
    const graph = data["@graph"] as Record<string, unknown>[];
    const cafe = graph.find((node) => node["@type"] === "CafeOrCoffeeShop") as Record<
      string,
      unknown
    >;
    expect(cafe.name).toBe("الا");
    expect(cafe.priceRange).toBe("180000-210000 IRR");
    expect(cafe.acceptsReservations).toBe(true);

    const menu = cafe.hasMenu as Record<string, unknown>;
    const sections = menu.hasMenuSection as { hasMenuItem: unknown[] }[];
    const items = sections.flatMap((section) => section.hasMenuItem) as {
      name: string;
      offers: { price: number; priceCurrency: string };
    }[];
    expect(items).toHaveLength(12);
    // Prices match the dataset exactly — JSON-LD can never disagree
    // with the page, because both read flavours.ts.
    const byName = new Map(items.map((item) => [item.name, item.offers.price]));
    for (const drink of ALL_DRINKS) {
      expect(byName.get(drink.nameFa)).toBe(drink.priceToman);
    }
    expect(items.every((item) => item.offers.priceCurrency === "IRR")).toBe(true);
  });

  it("en: drink names and descriptions are English", () => {
    const data = buildJsonLd("en");
    const graph = data["@graph"] as Record<string, unknown>[];
    const cafe = graph.find((node) => node["@type"] === "CafeOrCoffeeShop") as Record<
      string,
      unknown
    >;
    expect(cafe.name).toBe("Ela Coffee");
    const menu = cafe.hasMenu as Record<string, unknown>;
    const sections = menu.hasMenuSection as { hasMenuItem: { name: string }[] }[];
    const names = sections.flatMap((section) => section.hasMenuItem.map((item) => item.name));
    expect(names).toContain("Ela Original");
    expect(names).toContain("Midori Original");
  });

  it("includes a BreadcrumbList with Home", () => {
    const data = buildJsonLd("en");
    const graph = data["@graph"] as Record<string, unknown>[];
    const crumbs = graph.find((node) => node["@type"] === "BreadcrumbList") as Record<
      string,
      unknown
    >;
    const items = crumbs.itemListElement as { position: number; name: string }[];
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${DEFAULT_SITE_URL}/en`,
    });
  });

  it("serializes to parseable JSON with no </script> breakout", () => {
    const serialized = serializeJsonLd(buildJsonLd("fa"));
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<");
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    expect(parsed["@context"]).toBe("https://schema.org");
  });
});

describe("sitemap (Phase 8)", () => {
  it("lists /fa and /en with hreflang alternates, nothing else", () => {
    const entries = sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      `${DEFAULT_SITE_URL}/fa`,
      `${DEFAULT_SITE_URL}/en`,
    ]);
    for (const entry of entries) {
      expect(entry.alternates?.languages).toEqual({
        fa: `${DEFAULT_SITE_URL}/fa`,
        en: `${DEFAULT_SITE_URL}/en`,
        "x-default": `${DEFAULT_SITE_URL}/fa`,
      });
      expect(entry.priority).toBe(1);
    }
    // No dev catalog, no API routes — the sitemap lists pages, not APIs.
    expect(entries.some((entry) => entry.url.includes("design-system"))).toBe(false);
    expect(entries.some((entry) => entry.url.includes("/api/"))).toBe(false);
  });
});

describe("robots (Phase 8)", () => {
  it("allows all, disallows /api/, points at the sitemap", () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/", disallow: "/api/" });
    expect(result.sitemap).toBe(`${DEFAULT_SITE_URL}/sitemap.xml`);
  });
});
