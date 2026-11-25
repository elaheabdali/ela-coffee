import { expect, test } from "@playwright/test";
import {
  addCurrentFlavourViaDialog,
  bagCountBadge,
  gotoLocale,
  LOCALES,
  openBag,
  type Locale,
} from "./locales";

const LOCALE_LIST: Locale[] = ["fa", "en"];

for (const locale of LOCALE_LIST) {
  test.describe(`bag & checkout /${locale}`, () => {
    const t = LOCALES[locale];

    test("add to bag updates the count, stepper changes the total, remove empties the bag", async ({
      page,
    }) => {
      await gotoLocale(page, locale);
      await addCurrentFlavourViaDialog(page, locale);
      await expect(bagCountBadge(page)).toHaveText(locale === "fa" ? "۱" : "1");

      const dialog = await openBag(page, locale);
      await expect(dialog.getByText(t.drinkName)).toBeVisible();
      // One item: the price appears 3× (unit + line total + subtotal).
      await expect(dialog.getByText(t.priceOne)).toHaveCount(3);

      // Stepper +1 → 2 items: unit stays 180,000 (×1), line total and
      // subtotal become 360,000 (×2).
      await dialog.getByRole("button", { name: new RegExp(t.increase) }).click();
      await expect(bagCountBadge(page)).toHaveText(locale === "fa" ? "۲" : "2");
      await expect(dialog.getByText(t.priceOne)).toHaveCount(1);
      await expect(dialog.getByText(t.priceTwo)).toHaveCount(2);

      // Stepper −1 → back to 1 item.
      await dialog.getByRole("button", { name: new RegExp(t.decrease) }).click();
      await expect(dialog.getByText(t.priceOne)).toHaveCount(3);

      // Stepper −1 at qty 1 removes the item (bag store: qty 0 = remove).
      await dialog.getByRole("button", { name: new RegExp(t.decrease) }).click();
      await expect(dialog.getByText(t.bagEmpty)).toBeVisible();
      await expect(bagCountBadge(page)).toHaveCount(0);
    });

    test("remove button empties the bag", async ({ page }) => {
      await gotoLocale(page, locale);
      await addCurrentFlavourViaDialog(page, locale);
      const dialog = await openBag(page, locale);
      await dialog.getByRole("button", { name: t.bagRemove }).click();
      await expect(dialog.getByText(t.bagEmpty)).toBeVisible();
    });

    test("clear bag empties the bag", async ({ page }) => {
      await gotoLocale(page, locale);
      await addCurrentFlavourViaDialog(page, locale);
      const dialog = await openBag(page, locale);
      await dialog.getByRole("button", { name: t.bagClear }).click();
      await expect(dialog.getByText(t.bagEmpty)).toBeVisible();
    });

    test("checkout creates a real order with the server-side total", async ({ page }) => {
      await gotoLocale(page, locale);
      await addCurrentFlavourViaDialog(page, locale);
      const dialog = await openBag(page, locale);
      await dialog.getByRole("button", { name: t.checkoutTitle, exact: true }).click();

      // The checkout form is the same dialog, now in the checkout step.
      await dialog.getByLabel(t.nameLabel).fill("Elahe Test");
      await dialog.getByLabel(t.phoneLabel).fill("09123456789");
      await dialog.getByRole("button", { name: t.checkoutSubmit }).click();

      // Tracking view: order number + RECEIVED status + server total.
      // The client never sends a total — the total shown here is the
      // one the server computed from its own prices (180,000 for one
      // Kuro Original), which is the point of this assertion. All
      // assertions are scoped to the bag dialog: the hero behind it
      // shows the same price text.
      await expect(dialog.getByRole("heading", { name: t.trackingTitle })).toBeVisible();
      await expect(dialog.getByText(t.orderNumberLabel)).toBeVisible();
      const orderId = dialog.locator('span[dir="ltr"]', { hasText: /^[A-Za-z0-9_-]{8,}$/ }).first();
      await expect(orderId).toBeVisible();
      await expect(dialog.getByText(t.statusReceived)).toBeVisible();
      // Line total + order total, both 180,000. The Mock payment
      // completes the payment immediately (orders/route.ts), so the
      // order shows as Paid — no real money moves.
      await expect(dialog.getByText(t.priceOne)).toHaveCount(2);
      await expect(dialog.getByText(t.paymentPaid)).toBeVisible();
    });

    test("checkout rejects an invalid phone without creating an order", async ({ page }) => {
      await gotoLocale(page, locale);
      await addCurrentFlavourViaDialog(page, locale);
      const dialog = await openBag(page, locale);
      await dialog.getByRole("button", { name: t.checkoutTitle, exact: true }).click();

      await dialog.getByLabel(t.nameLabel).fill("Elahe Test");
      await dialog.getByLabel(t.phoneLabel).fill("123");
      await dialog.getByRole("button", { name: t.checkoutSubmit }).click();

      await expect(dialog.getByRole("alert")).toHaveText(t.phoneInvalid);
      // Still on the checkout form — no tracking view appeared.
      await expect(page.getByRole("heading", { name: t.trackingTitle })).toHaveCount(0);
    });
  });
}
