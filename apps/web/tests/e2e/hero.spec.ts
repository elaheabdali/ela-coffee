import { expect, test } from "@playwright/test";
import { gotoLocale, LOCALES, wheelStage, type Locale } from "./locales";

const LOCALE_LIST: Locale[] = ["fa", "en"];

for (const locale of LOCALE_LIST) {
  test.describe(`hero /${locale}`, () => {
    const t = LOCALES[locale];

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
      await expect(html).toHaveAttribute("data-brand", "kuro");

      await page.getByRole("button", { name: t.brandCoffee, exact: true }).click();
      await expect(html).toHaveAttribute("data-brand", "midori");
      // The toggle now offers the other brand, and the hero title follows.
      await expect(page.getByRole("button", { name: t.brandMatcha, exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: locale === "fa" ? "ماچا‌ات را انتخاب کن" : "Choose your matcha" }),
      ).toBeVisible();

      await page.getByRole("button", { name: t.brandMatcha, exact: true }).click();
      await expect(html).toHaveAttribute("data-brand", "kuro");
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

    test("tasting-notes dialog shows exactly 3 notes for the current drink", async ({ page }) => {
      await gotoLocale(page, locale);
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
  });
}
