import { expect, test } from "@playwright/test";
import type { Locale } from "./locales";

/**
 * Visual regression (Phase 10) — the Phase 4 manual screenshots,
 * made repeatable.
 *
 * - 5 widths × 2 locales × 2 shots (hero viewport + full page) = 20
 *   baselines in `tests/visual/baseline/`, compared with a 2%
 *   pixel-diff tolerance (`maxDiffPixelRatio: 0.02`): strict enough
 *   to catch a broken layout, tolerant of font/image decoding noise.
 * - `reducedMotion: "reduce"` + `animations: "disabled"` settle the
 *   pour/wheel-in/float/marquee animations so screenshots are
 *   deterministic. The page is scrolled through once first so every
 *   IntersectionObserver reveal has fired, then back to the top.
 * - The full-page shot includes the hero's 300vh section: the sticky
 *   stage occupies the first viewport and the rest of the section is
 *   empty dark space by design — that band is part of the baseline,
 *   not a defect.
 * - Regenerate baselines after an intentional visual change with:
 *     pnpm --filter web exec playwright test --project=visual --update-snapshots
 *   Review the diff before committing a regenerated baseline.
 */
const WIDTHS = [360, 768, 1024, 1440, 1920];
const LOCALE_LIST: Locale[] = ["fa", "en"];
const SECTIONS = ["#hero", "#story", "#menu", "#process", "#origins", "#join"];

test.describe("visual regression", () => {
  test.use({ reducedMotion: "reduce" });

  for (const locale of LOCALE_LIST) {
    for (const width of WIDTHS) {
      test(`${locale} @ ${width}px — hero + full page`, async ({ page }) => {
        test.setTimeout(120_000);
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(String(error)));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });

        await page.setViewportSize({ width, height: width === 360 ? 844 : 900 });
        await page.goto(`/${locale}`, { waitUntil: "networkidle" });

        // Scroll through the whole page so every reveal fires, then
        // back to the top (the scroll-linked wheel returns to 01).
        // Deliberately slow (300 px / 250 ms): a fast scroll jumps
        // past Firefox's lazy-load trigger, so below-the-fold images
        // never start loading and the full-page shot gets black tiles
        // (the 2nd menu row stayed unloaded at 1440/1920 until the
        // scroll was slowed down). The browser picks the right
        // variant — menu tiles resolve to 640w, per `sizes`.
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => {
            let y = 0;
            const step = () => {
              y += 300;
              window.scrollTo(0, y);
              if (y < document.body.scrollHeight) setTimeout(step, 250);
              else resolve();
            };
            step();
          });
        });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(800);
        // Wait for every image to finish loading: below-the-fold
        // images are lazy, and a full-page screenshot taken while
        // they are still loading is non-deterministic (black tiles).
        // 60 s, not 15: on this 1.5-CPU sandbox the Next image
        // optimizer can take a while to encode the large variants
        // the 1440/1920 viewports request; the wait returns as soon
        // as the last image completes, so a warm cache is still fast.
        // Images inside a `display: none` subtree (e.g. the Join
        // sprite tiles, `hidden lg:block`) are skipped: Firefox
        // never starts a lazy fetch for them, so `complete` stays
        // false forever below lg — and a hidden image cannot affect
        // any screenshot pixel anyway.
        await page.waitForFunction(
          () => [...document.images].every((img) => img.complete || img.offsetParent === null),
          undefined,
          { timeout: 60_000 },
        );
        await page.waitForLoadState("networkidle");

        // Structural checks (no pixel comparison needed for these).
        for (const section of SECTIONS) {
          await expect(page.locator(section)).toHaveCount(1);
        }
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        expect(overflow, `horizontal overflow at ${width}px`).toBe(false);

        // Hero (above the fold) + the whole page, vs the baselines.
        await expect(page).toHaveScreenshot(`${locale}-${width}-hero.png`, {
          animations: "disabled",
          maxDiffPixelRatio: 0.02,
        });
        await expect(page).toHaveScreenshot(`${locale}-${width}-full.png`, {
          animations: "disabled",
          fullPage: true,
          maxDiffPixelRatio: 0.02,
        });

        expect(errors, `console/page errors at ${width}px: ${errors.join("; ")}`).toEqual([]);
      });
    }
  }
});
