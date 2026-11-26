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

      // The checkout redirects to the Mock gateway (standing in for
      // Zarinpal's StartPay page); paying there returns via the
      // callback to the success page with the order id.
      await expect(page.getByTestId("mock-pay-success")).toBeVisible();
      await page.getByTestId("mock-pay-success").click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/payment/success\\?order=`));
      const orderId = await page.locator("main span[dir='ltr']").first().innerText();
      await expect(orderId).toMatch(/^[A-Za-z0-9_-]{8,}$/);

      // The server computed the total from its own prices (180,000 for
      // one Ela Original) and the callback marked the order PAID — the
      // client never sent a total, which is the point of this assertion.
      const created = await page.request.get(`/api/orders/${orderId}`);
      expect(created.status()).toBe(200);
      const data = (await created.json()) as {
        order: { totalToman: number; payment: string; status: string };
      };
      expect(data.order.totalToman).toBe(180_000);
      expect(data.order.payment).toBe("PAID");
      expect(data.order.status).toBe("RECEIVED");
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
