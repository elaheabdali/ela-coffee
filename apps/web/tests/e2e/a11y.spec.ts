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
  await page.waitForTimeout(800);
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
