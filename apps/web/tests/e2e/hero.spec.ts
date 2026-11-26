import { expect, test, type Page } from "@playwright/test";
import { bagCountBadge, gotoLocale, LOCALES, wheelStage, type Locale } from "./locales";

const LOCALE_LIST: Locale[] = ["fa", "en"];

for (const locale of LOCALE_LIST) {
  test.describe(`hero /${locale}`, () => {
    const t = LOCALES[locale];

    // Fix batch 7: the menu card's Add button shares the hero chip's
    // aria-label prefix ("Add {name} to your bag, {price}" — the
    // reference uses the same label in both places), so an unscoped
    // chip locator resolves to 2 buttons. Scope to the hero region
    // (labelled by the hero title) to pick the chip, not the card.
    function heroChip(page: Page, name: string) {
      return page
        .getByRole("region", { name: t.heroTitle })
        .getByRole("button", { name });
    }

    test("page loads with the hero heading and the first flavour", async ({ page }) => {
      await gotoLocale(page, locale);
      // The flavour counter starts at 1 / 6 and the hero H1 is visible.
      await expect(page.getByText(t.counterInitial, { exact: true })).toBeVisible();
      // exact: the flavour dot "دارچین و شکر قهوه‌ای" contains "قهوه"
      // as a substring, so a loose name match resolves to 2 buttons.
      await expect(page.getByRole("button", { name: t.brandCoffee, exact: true })).toBeVisible();
      // The scroll cue and the flavour dots are present.
      await expect(page.getByRole("group", { name: t.allFlavors })).toBeVisible();
    });

    test("brand toggle flips html[data-brand] coffee ↔ matcha", async ({ page }) => {
      await gotoLocale(page, locale);
      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-brand", "ela");

      // The hero navbar is the reference's segmented control at this
      // viewport (fix batch 2): click the inactive brand (Matcha),
      // not the already-active Coffee — pressing the active segment
      // is a no-op by design.
      await page.getByRole("button", { name: t.brandMatcha, exact: true }).click();
      await expect(html).toHaveAttribute("data-brand", "midori");
      // The toggle now offers the other brand, and the hero title follows.
      await expect(page.getByRole("button", { name: t.brandCoffee, exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: locale === "fa" ? "ماچا‌ات را انتخاب کن" : "Choose your matcha" }),
      ).toBeVisible();

      await page.getByRole("button", { name: t.brandCoffee, exact: true }).click();
      await expect(html).toHaveAttribute("data-brand", "ela");
    });

    test("wheel keyboard navigation moves the flavour counter", async ({ page }) => {
      await gotoLocale(page, locale);
      const stage = wheelStage(page, locale);
      await stage.focus();
      await page.keyboard.press("ArrowRight");
      // RTL mirrors the direction: fa goes 1 → 6, en goes 1 → 2.
      await expect(page.getByText(t.counterAfterArrowRight, { exact: true })).toBeVisible();
      // The counter no longer shows the first flavour.
      await expect(page.getByText(t.counterInitial, { exact: true })).toHaveCount(0);
    });

    test("Surprise me jumps to a different flavour", async ({ page }) => {
      await gotoLocale(page, locale);
      await page.getByRole("button", { name: t.surpriseMe }).click();
      // surprise() guarantees a flavour other than the current one.
      await expect(page.getByText(t.counterInitial, { exact: true })).toHaveCount(0);
    });

    test("menu drawer opens, shows the section links, and closes", async ({ page }) => {
      await gotoLocale(page, locale);
      await page.getByRole("button", { name: t.drawerMenu, exact: true }).click();
      const drawer = page.getByRole("dialog", { name: t.drawerMenu });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("link", { name: t.navStory })).toBeVisible();
      await expect(drawer.getByRole("button", { name: t.drawerClose })).toBeVisible();

      await page.getByRole("button", { name: t.drawerClose }).click();
      await expect(drawer).toHaveCount(0);
    });

    test("tasting-notes dialog shows exactly 3 notes for the current drink", async ({ page }) => {      await gotoLocale(page, locale);
      await page.getByRole("button", { name: t.tastingNotes }).click();
      const dialog = page.getByRole("dialog", { name: t.drinkName });
      await expect(dialog).toBeVisible();
      const notes = dialog.locator("ul li");
      await expect(notes).toHaveCount(3);
      for (const note of t.drinkNotes) {
        await expect(dialog.getByText(note, { exact: true })).toBeVisible();
      }
      // The dialog price matches the dataset price.
      await expect(dialog.getByText(t.priceOne)).toBeVisible();

      await dialog.getByRole("button", { name: t.dialogClose }).click();
      await expect(dialog).toHaveCount(0);
    });

    // Fix batch 3: real Playwright clicks (not JS .click()) — the hero
    // region used to capture the pointer on pointerdown, which
    // retargeted the click to the region and swallowed it, so the chip
    // never added anything. Fix batch 4: the check is a brief
    // confirmation — it reverts to the bag icon ~1.5 s after the click
    // while the drink stays in the bag.
    //
    // Chromium CI flake (fix batch 4 follow-up): the chip floats
    // (ela-float) and re-renders when the check appears, so its box
    // moves between Playwright's locator resolution and the click —
    // and Chromium's click then scrolls the page to chase it
    // (scrollIntoViewIfNeeded, 93–416 px in local repro). That scroll
    // fires the scroll-linked flavour handler, the flavour changes
    // under the test, and this chip locator (bound to the first
    // drink's name) stops matching — the check assertion fails
    // although the bag itself got the item. `force: true` still
    // dispatches real pointer/mouse events (so the batch-3
    // pointer-capture behaviour is still exercised) but skips the
    // scroll-into-view chase. A real tap never scrolls the page, so
    // this is test-only: the component is unchanged. Firefox never
    // scrolls here, which is why the same test passed 18/18 there.
    test("hero price chip adds the drink — badge 1, check briefly, then bag icon again", async ({
      page,
    }) => {
      await gotoLocale(page, locale);
      const chip = heroChip(page, t.chipAdd);
      await chip.click({ force: true });
      await expect(bagCountBadge(page)).toHaveText(locale === "fa" ? "۱" : "1");
      await expect(chip.locator(".lucide-check")).toHaveCount(1);
      await expect(chip.locator(".lucide-shopping-bag")).toHaveCount(0);
      // The check reverts on its own; the badge stays.
      await expect(chip.locator(".lucide-check")).toHaveCount(0);
      await expect(chip.locator(".lucide-shopping-bag")).toHaveCount(1);
      await expect(bagCountBadge(page)).toHaveText(locale === "fa" ? "۱" : "1");
    });

    test("clicking a flavour dot changes the flavour", async ({ page }) => {
      await gotoLocale(page, locale);
      await page.getByRole("button", { name: t.dotMocha, exact: true }).click({ force: true });
      await expect(heroChip(page, t.chipAddMocha)).toBeVisible();
    });

    test("a second chip click makes 2 in the bag and shows the check briefly again", async ({ page }) => {
      await gotoLocale(page, locale);
      const chip = heroChip(page, t.chipAdd);
      await chip.click({ force: true });
      await expect(bagCountBadge(page)).toHaveText(locale === "fa" ? "۱" : "1");
      await chip.click({ force: true });
      await expect(bagCountBadge(page)).toHaveText(locale === "fa" ? "۲" : "2");
      await expect(chip.locator(".lucide-check")).toHaveCount(1);
      await expect(chip.locator(".lucide-check")).toHaveCount(0);
      await expect(chip.locator(".lucide-shopping-bag")).toHaveCount(1);
      await expect(bagCountBadge(page)).toHaveText(locale === "fa" ? "۲" : "2");
    });
  });
}
