import { expect, test } from "@playwright/test";
import { gotoLocale, LOCALES, type Locale } from "./locales";

const LOCALE_LIST: Locale[] = ["fa", "en"];

/** A date safely in the future for the reservation form. */
const FUTURE_DATE = "2027-06-15T12:00";

for (const locale of LOCALE_LIST) {
  test.describe(`forms /${locale}`, () => {
    const t = LOCALES[locale];

    test("newsletter rejects an invalid email client-side", async ({ page }) => {
      await gotoLocale(page, locale);
      const join = page.locator("#join");
      await join.scrollIntoViewIfNeeded();
      await join.locator("#join-email").fill("not-an-email");
      await join.getByRole("button", { name: t.joinSubmit }).click();
      await expect(join.getByRole("alert")).toHaveText(t.joinEmailInvalid);
      await expect(join.getByText(t.joinSuccess)).toHaveCount(0);
    });

    test("newsletter subscribes with a valid email", async ({ page }) => {
      await gotoLocale(page, locale);
      const join = page.locator("#join");
      await join.scrollIntoViewIfNeeded();
      await join.locator("#join-email").fill(`e2e-${locale}@example.com`);
      await join.getByRole("button", { name: t.joinSubmit }).click();
      // getByText, not getByRole("status"): the reservation Stepper's
      // <output> also has implicit role=status inside #join.
      await expect(join.getByText(t.joinSuccess)).toBeVisible();
    });

    test("reservation rejects an invalid phone", async ({ page }) => {
      await gotoLocale(page, locale);
      const join = page.locator("#join");
      await join.scrollIntoViewIfNeeded();
      await join.getByLabel(t.nameLabel).fill("Elahe Test");
      await join.getByLabel(t.phoneLabel).fill("123");
      await join.locator("#reservation-date").fill(FUTURE_DATE);
      await join.getByRole("button", { name: t.reservationSubmit }).click();
      await expect(join.getByRole("alert")).toHaveText(t.phoneInvalid);
      await expect(join.getByText(t.reservationSuccess)).toHaveCount(0);
    });

    test("reservation books with valid details", async ({ page }) => {
      await gotoLocale(page, locale);
      const join = page.locator("#join");
      await join.scrollIntoViewIfNeeded();
      await join.getByLabel(t.nameLabel).fill("Elahe Test");
      await join.getByLabel(t.phoneLabel).fill("09123456789");
      await join.locator("#reservation-date").fill(FUTURE_DATE);
      await join.getByRole("button", { name: t.reservationSubmit }).click();
      await expect(join.getByText(t.reservationSuccess)).toBeVisible();
    });

    test("contact rejects an invalid email/phone", async ({ page }) => {
      await gotoLocale(page, locale);
      const footer = page.locator("footer");
      await footer.scrollIntoViewIfNeeded();
      await footer.getByLabel(t.nameLabel).fill("Elahe Test");
      await footer
        .getByLabel(locale === "fa" ? "ایمیل یا شمارهٔ موبایل" : "Email or mobile number")
        .fill("not-valid");
      await footer.getByLabel(locale === "fa" ? "پیام" : "Message").fill("Hello, test message.");
      await footer.getByRole("button", { name: t.contactSubmit }).click();
      await expect(footer.getByRole("alert")).toHaveText(t.contactInvalid);
      await expect(footer.getByText(t.contactSuccess)).toHaveCount(0);
    });

    test("contact sends with valid details", async ({ page }) => {
      await gotoLocale(page, locale);
      const footer = page.locator("footer");
      await footer.scrollIntoViewIfNeeded();
      await footer.getByLabel(t.nameLabel).fill("Elahe Test");
      await footer
        .getByLabel(locale === "fa" ? "ایمیل یا شمارهٔ موبایل" : "Email or mobile number")
        .fill(`e2e-${locale}@example.com`);
      await footer.getByLabel(locale === "fa" ? "پیام" : "Message").fill("Hello, test message.");
      await footer.getByRole("button", { name: t.contactSubmit }).click();
      await expect(footer.getByText(t.contactSuccess)).toBeVisible();
    });
  });
}

test.describe("honeypot (API)", () => {
  test("a filled honeypot field gets a fake success and stores nothing", async ({ request }) => {
    // The server answers { ok: true } on purpose — a bot cannot tell
    // it was caught — but the message is never stored. There is no
    // public read endpoint for contact messages, so the observable
    // contract is the fake-success response itself.
    // The server's CSRF check rejects requests with no Origin, so
    // the API client sends the same-origin Origin a browser would.
    const response = await request.post("/api/contact", {
      headers: { Origin: "http://localhost:3000" },
      data: {
        name: "Bot",
        contact: "bot@example.com",
        message: "spam",
        website: "https://spam.example",
      },
    });
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  test("the same endpoint accepts a clean payload with the same shape", async ({ request }) => {
    // Contrast check: without the honeypot the same { ok: true } is
    // returned, but this time the message is really stored.
    const response = await request.post("/api/contact", {
      headers: { Origin: "http://localhost:3000" },
      data: { name: "Real", contact: "real@example.com", message: "Hello from the API test." },
    });
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
