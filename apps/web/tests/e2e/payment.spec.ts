import { expect, test } from "@playwright/test";
import {
  addCurrentFlavourViaDialog,
  bagCountBadge,
  gotoLocale,
  LOCALES,
  openBag,
  type Locale,
} from "./locales";

/**
 * Payment flow E2E (batch 9, item 6) — Mock provider only, no network,
 * no real money.
 *
 * The checkout returns a payment URL (the mock gateway, standing in
 * for Zarinpal's StartPay page); the gateway links back to
 * /api/payments/callback, which verifies the payment and redirects to
 * the success / failure page. The real Zarinpal leg runs the same
 * code against sandbox.zarinpal.com with a test merchant ID (see
 * docs/zarinpal-setup.md) — no real money moves there either.
 *
 * The copy asserted here is duplicated from the pages on purpose (see
 * locales.ts): the test must fail if the page text drifts.
 */
const PAYMENT_COPY: Record<Locale, { success: string; failed: string; orderLabel: string }> = {
  fa: {
    success: "پرداخت انجام شد",
    failed: "پرداخت انجام نشد",
    orderLabel: "شمارهٔ سفارش",
  },
  en: {
    success: "Payment successful",
    failed: "Payment didn't go through",
    orderLabel: "Order number",
  },
};

const LOCALE_LIST: Locale[] = ["fa", "en"];

for (const locale of LOCALE_LIST) {
  test.describe(`payment flow /${locale}`, () => {
    const t = LOCALES[locale];
    const p = PAYMENT_COPY[locale];

    test("checkout returns a mock payment redirect; simulating payment lands on the success page", async ({
      page,
    }) => {
      await gotoLocale(page, locale);
      await addCurrentFlavourViaDialog(page, locale);
      const dialog = await openBag(page, locale);
      await dialog.getByRole("button", { name: t.checkoutTitle, exact: true }).click();

      await dialog.getByLabel(t.nameLabel).fill("Elahe Test");
      await dialog.getByLabel(t.phoneLabel).fill("09123456789");
      await dialog.getByRole("button", { name: t.checkoutSubmit }).click();

      // The checkout redirects to the mock gateway (standing in for
      // Zarinpal's StartPay page). The authority is in the gateway
      // URL itself — the POST response body cannot be read here: the
      // redirect navigation drops it in Chromium ("No resource with
      // given identifier found").
      await expect(page.getByTestId("mock-pay-success")).toBeVisible();
      const gatewayUrl = new URL(page.url());
      expect(gatewayUrl.pathname).toBe("/payment/mock");
      const authority = gatewayUrl.searchParams.get("authority") ?? "";
      expect(authority).toMatch(/^mock_/);

      // Follow the redirect to the mock gateway and "pay".
      await page.getByTestId("mock-pay-success").click();

      // The callback verified the (mock) payment and redirected here.
      await expect(page).toHaveURL(new RegExp(`/${locale}/payment/success\\?order=`));
      await expect(page.getByRole("heading", { name: p.success })).toBeVisible();
      await expect(page.getByText(p.orderLabel).first()).toBeVisible();
      const orderId = await page.locator("main span[dir='ltr']").first().innerText();
      await expect(orderId).toMatch(/^[A-Za-z0-9_-]{8,}$/);

      // The callback marked the order PAID — and the authority the
      // gateway echoed back is the one the checkout created.
      const created = await page.request.get(`/api/orders/${orderId}`);
      expect(created.status()).toBe(200);
      const data = (await created.json()) as {
        order: { payment: string; status: string };
      };
      expect(data.order.payment).toBe("PAID");
      expect(data.order.status).toBe("RECEIVED");
      expect(authority).toContain(orderId);

      // The success page clears the bag once the order is PAID
      // (bag-clear fix): wait for the persisted bag to empty before
      // navigating away, then the bag-count badge is gone at home.
      await page.waitForFunction(() => {
        const raw = window.localStorage.getItem("ela-coffee-bag");
        if (!raw) return true;
        try {
          const data = JSON.parse(raw) as { state?: { items?: unknown[] } };
          return (data.state?.items?.length ?? 0) === 0;
        } catch {
          return false;
        }
      });
      await gotoLocale(page, locale);
      await expect(bagCountBadge(page)).toHaveCount(0);
    });

    test("cancelling on the gateway lands on the failure page with the order id", async ({
      page,
    }) => {
      await gotoLocale(page, locale);
      // The callback reads the locale from the NEXT_LOCALE cookie;
      // pin it so the redirect lands in this test's locale.
      const origin = new URL(page.url()).origin;
      await page.context().addCookies([{ name: "NEXT_LOCALE", value: locale, url: origin }]);

      // Create the order through the API (same-origin Origin header,
      // as the CSRF guard requires for non-browser callers).
      const created = await page.request.post("/api/orders", {
        headers: { Origin: origin, "Idempotency-Key": `e2e-cancel-${locale}` },
        data: {
          items: [{ drinkId: "ela-original", qty: 1 }],
          customerName: "Elahe Test",
          phone: "09123456789",
        },
      });
      expect(created.status()).toBe(201);
      const data = (await created.json()) as {
        order: { id: string };
        payment: { authority: string };
      };

      await page.goto(`/api/payments/callback?Authority=${data.payment.authority}&Status=NOK`);
      await expect(page).toHaveURL(new RegExp(`/${locale}/payment/failed\\?order=`));
      await expect(page.getByRole("heading", { name: p.failed })).toBeVisible();
      await expect(page.locator("main span[dir='ltr']").first()).toHaveText(data.order.id);
    });

    test("callback with an unknown authority lands on the failure page", async ({ page }) => {
      await gotoLocale(page, locale);
      const origin = new URL(page.url()).origin;
      await page.context().addCookies([{ name: "NEXT_LOCALE", value: locale, url: origin }]);

      await page.goto("/api/payments/callback?Authority=unknown-authority&Status=OK");
      await expect(page).toHaveURL(new RegExp(`/${locale}/payment/failed`));
      await expect(page.getByRole("heading", { name: p.failed })).toBeVisible();
      // No order matched, so no order number is shown.
      await expect(page.getByText(p.orderLabel)).toHaveCount(0);
    });
  });
}
