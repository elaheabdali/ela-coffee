import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { gotoLocale, LOCALES, type Locale } from "./locales";

const LOCALE_LIST: Locale[] = ["fa", "en"];

/**
 * Scroll through the whole page and back to the top, so every
 * IntersectionObserver reveal has fired before axe measures: axe
 * evaluates the rendered page, and an unrevealed (opacity 0) element
 * would otherwise read as a contrast failure. This is the Phase 9
 * measurement procedure, not a way to hide failures — the
 * eyebrow/menu-card contrast bugs of Phase 10 were caught at full
 * opacity and fixed in the app itself.
 */
async function scrollThroughPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const step = () => {
        y += 600;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) setTimeout(step, 60);
        else resolve();
      };
      step();
    });
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  // Let every reveal finish before axe measures: reveals can carry a
  // 450 ms delay plus a ~1 s animation, and axe measuring mid-reveal
  // reads a part-opacity colour as a contrast failure (the Phase 10
  // flake: 4.31 measured mid-animation in fa). 800 ms was not always
  // enough under full-suite load; 1500 ms is.
  await page.waitForTimeout(1500);
}

/**
 * Accessibility smoke tests (Phase 10): axe-core on the live page.
 * Phase 9 already drove violations to 0 in all 8 states with the
 * same tool — these tests keep that bar green on every run, in both
 * locales, for the static page and the two most-used overlays.
 *
 * NOTE — @axe-core/playwright is pinned to 4.10.2 on purpose:
 * 4.14.1 crashes the Firefox renderer ("Page crashed" inside
 * AxeBuilder.analyze) on this page when the tasting-notes dialog is
 * open, while axe-core 4.10.2 (the version Phase 9 used) analyses
 * the same state cleanly. Verified by direct probe 2026-11-24.
 * Re-test the pin before upgrading: open the dialog and run the
 * suite — a crash means the pin is still needed.
 */
for (const locale of LOCALE_LIST) {
  test.describe(`axe /${locale}`, () => {
    const t = LOCALES[locale];

    test("static page has zero axe violations", async ({ page }) => {
      await gotoLocale(page, locale);
      await scrollThroughPage(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test("menu drawer open has zero axe violations", async ({ page }) => {
      await gotoLocale(page, locale);
      await page.getByRole("button", { name: t.drawerMenu, exact: true }).click();
      await expect(page.getByRole("dialog", { name: t.drawerMenu })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test("tasting-notes dialog open has zero axe violations", async ({ page }) => {
      await gotoLocale(page, locale);
      await page.getByRole("button", { name: t.tastingNotes }).click();
      await expect(page.getByRole("dialog", { name: t.drinkName })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

for (const locale of LOCALE_LIST) {
  // Fix batch 4: the midori theme tokens (green background/crema) were
  // never applied before — `html[data-brand="matcha"]` never matched
  // the real "midori" brand value — so axe must also run in midori
  // mode, where text/background tokens change.
  test.describe(`axe midori /${locale}`, () => {
    const t = LOCALES[locale];

    async function gotoMidori(page: Page): Promise<void> {
      await gotoLocale(page, locale);
      await page.getByRole("button", { name: t.brandMatcha, exact: true }).click();
      await expect(page.locator("html")).toHaveAttribute("data-brand", "midori");
      await page.waitForTimeout(800);
    }

    test("static page has zero axe violations", async ({ page }) => {
      await gotoMidori(page);
      await scrollThroughPage(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test("menu drawer open has zero axe violations", async ({ page }) => {
      await gotoMidori(page);
      await page.getByRole("button", { name: t.drawerMenu, exact: true }).click();
      await expect(page.getByRole("dialog", { name: t.drawerMenu })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test("tasting-notes dialog open has zero axe violations", async ({ page }) => {
      await gotoMidori(page);
      await page.getByRole("button", { name: t.tastingNotes }).click();
      await expect(page.getByRole("dialog", { name: t.drinkNameMidori })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
