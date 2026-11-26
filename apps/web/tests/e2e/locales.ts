import { expect, type Page } from "@playwright/test";

/**
 * Per-locale strings the E2E suite asserts on, copied from the
 * dictionaries (`packages/i18n/src/fa.ts` / `en.ts`) and the flavour
 * dataset (`apps/web/src/data/flavours.ts`). They are duplicated here
 * on purpose: an E2E test must fail if the UI text drifts, and
 * importing the app's dictionaries would make the test pass by
 * construction (it would assert the app against itself).
 */
export type Locale = "fa" | "en";

export interface LocaleStrings {
  heroTitle: string;
  brandCoffee: string;
  brandMatcha: string;
  allFlavors: string;
  /** Wheel group label ("Flavors"). */
  flavors: string;
  tastingNotes: string;
  surpriseMe: string;
  counterInitial: string;
  /** Counter after one ArrowRight on the focused wheel stage. */
  counterAfterArrowRight: string;
  drinkName: string;
  drinkNotes: string[];
  priceOne: string;
  priceTwo: string;
  /** Hero price chip (add button) for the first drink, Ela Original. */
  chipAdd: string;
  /** Hero price chip for Dark Mocha (the tile-click target). */
  chipAddMocha: string;
  /** Pill bag button with exactly 1 drink in the bag. */
  bagButton: string;
  /** Menu-card Add button for the first drink, Ela Original. */
  cardAdd: string;
  /** Menu-card Add button text while resting / after adding. */
  cardAddToBag: string;
  cardAdded: string;
  /** First drink in midori mode (the tasting-notes dialog name). */
  drinkNameMidori: string;
  bagOpen: string;
  bagTitle: string;
  bagEmpty: string;
  subtotal: string;
  bagClear: string;
  bagRemove: string;
  decrease: string;
  increase: string;
  checkoutTitle: string;
  checkoutSubmit: string;
  nameLabel: string;
  phoneLabel: string;
  phoneInvalid: string;
  trackingTitle: string;
  orderNumberLabel: string;
  statusReceived: string;
  /** Mock payment completes immediately, so the order shows as paid. */
  paymentPaid: string;
  drawerMenu: string;
  drawerClose: string;
  dialogClose: string;
  dialogAddToBag: string;
  /** Tasting-notes panel Add button while its transient state shows. */
  dialogAddedToBag: string;
  navStory: string;
  joinSubmit: string;
  joinSuccess: string;
  joinEmailInvalid: string;
  reservationSubmit: string;
  reservationSuccess: string;
  contactSubmit: string;
  contactSuccess: string;
  contactInvalid: string;
  notFoundTitle: string;
  /** The big "404" numeral on the branded 404 page (Persian digits in fa). */
  notFoundDigits: string;
}

export const LOCALES: Record<Locale, LocaleStrings> = {
  fa: {
    heroTitle: "قهوه‌ات را انتخاب کن",
    brandCoffee: "قهوه",
    brandMatcha: "ماچا",
    allFlavors: "همهٔ طعم‌ها",
    flavors: "طعم‌ها",
    tastingNotes: "یادداشت‌های طعم",
    surpriseMe: "سورپرایزم کن",
    counterInitial: "۰۱ / ۰۶",
    // RTL: ArrowRight moves to the previous flavour (wraps 0 → 5).
    counterAfterArrowRight: "۰۶ / ۰۶",
    drinkName: "الا اورجینال",
    drinkNotes: ["کاکائوی تلخ — TODO(review)", "بادام برشته — TODO(review)", "شکر قهوه‌ای — TODO(review)"],
    priceOne: "۱۸۰٬۰۰۰ تومان",
    priceTwo: "۳۶۰٬۰۰۰ تومان",
    chipAdd: "«الا اورجینال» را به سبد اضافه کن",
    chipAddMocha: "«موکای تلخ» را به سبد اضافه کن",
    cardAdd: "«الا اورجینال» را به سبد اضافه کن، ۱۸۰٬۰۰۰ تومان",
    cardAddToBag: "افزودن به سبد",
    cardAdded: "به سبد اضافه شد",
    bagButton: "سبد تو, ۱ نوشیدنی",
    drinkNameMidori: "میدوری اورجینال",
    bagOpen: "باز کردن سبد",
    bagTitle: "سبد تو",
    bagEmpty: "سبدت خالی است",
    subtotal: "جمع اقلام",
    bagClear: "خالی کردن سبد",
    bagRemove: "حذف از سبد",
    decrease: "کم کردن تعداد",
    increase: "زیاد کردن تعداد",
    checkoutTitle: "تسویهٔ حساب",
    checkoutSubmit: "ثبت سفارش",
    nameLabel: "نام",
    phoneLabel: "شمارهٔ موبایل",
    phoneInvalid: "شمارهٔ موبایل درست نیست.",
    trackingTitle: "پیگیری سفارش",
    orderNumberLabel: "شمارهٔ سفارش",
    statusReceived: "سفارش ثبت شد",
    paymentPaid: "پرداخت شده",
    drawerMenu: "منو",
    drawerClose: "بستن منو",
    dialogClose: "بستن",
    dialogAddToBag: "افزودن به سبد",
    dialogAddedToBag: "به سبد اضافه شد",
    navStory: "داستان ما",
    joinSubmit: "عضویت در فهرست",
    joinSuccess: "عضو فهرست شدی!",
    joinEmailInvalid: "نشانی ایمیل درست نیست.",
    reservationSubmit: "ثبت رزرو",
    reservationSuccess: "رزروت ثبت شد!",
    contactSubmit: "ارسال پیام",
    contactSuccess: "پیامت رسید!",
    contactInvalid: "ایمیل یا شمارهٔ موبایل درست نیست.",
    notFoundTitle: "این فنجان خالی است…",
    notFoundDigits: "۴۰۴",
  },
  en: {
    heroTitle: "Choose your coffee",
    brandCoffee: "Coffee",
    brandMatcha: "Matcha",
    allFlavors: "All flavors",
    flavors: "Flavors",
    tastingNotes: "Tasting notes",
    surpriseMe: "Surprise me",
    counterInitial: "01 / 06",
    // LTR: ArrowRight moves to the next flavour (0 → 1).
    counterAfterArrowRight: "02 / 06",
    drinkName: "Ela Original",
    drinkNotes: ["Dark cocoa", "Toasted almond", "Brown sugar"],
    priceOne: "180,000 T",
    priceTwo: "360,000 T",
    chipAdd: "Add Ela Original to your bag",
    chipAddMocha: "Add Dark Mocha to your bag",
    cardAdd: "Add Ela Original to your bag, 180,000 T",
    cardAddToBag: "Add to bag",
    cardAdded: "Added to your bag",
    bagButton: "Your bag, 1 drink",
    drinkNameMidori: "Midori Original",
    bagOpen: "Open bag",
    bagTitle: "Your bag",
    bagEmpty: "Your bag is empty",
    subtotal: "Subtotal",
    bagClear: "Clear bag",
    bagRemove: "Remove from bag",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    checkoutTitle: "Checkout",
    checkoutSubmit: "Place order",
    nameLabel: "Name",
    phoneLabel: "Mobile number",
    phoneInvalid: "That mobile number doesn't look right.",
    trackingTitle: "Track your order",
    orderNumberLabel: "Order number",
    statusReceived: "Order received",
    paymentPaid: "Paid",
    drawerMenu: "Menu",
    drawerClose: "Close menu",
    dialogClose: "Close",
    dialogAddToBag: "Add to bag",
    dialogAddedToBag: "Added to your bag",
    navStory: "Story",
    joinSubmit: "Join the list",
    joinSuccess: "You're on the list!",
    joinEmailInvalid: "That email address doesn't look right.",
    reservationSubmit: "Book a table",
    reservationSuccess: "Your table is booked!",
    contactSubmit: "Send message",
    contactSuccess: "Message received!",
    contactInvalid: "Enter a valid email or mobile number.",
    notFoundTitle: "This cup is empty…",
    notFoundDigits: "404",
  },
};

/** Open a locale page and wait for the hero heading to render. */
export async function gotoLocale(page: Page, locale: Locale): Promise<void> {
  await page.goto(`/${locale}`);
  await expect(page.getByRole("heading", { name: LOCALES[locale].heroTitle })).toBeVisible();
}

/** The wheel stage (keyboard-focusable region) on the hero. */
export function wheelStage(page: Page, locale: Locale) {
  return page.getByRole("region", { name: LOCALES[locale].heroTitle });
}

/**
 * Wait until the client has hydrated: the keyboard handler, the bag
 * buttons and every other client effect live in passive effects, so
 * a click or key pressed before hydration finishes is silently lost.
 * The React fiber key appears when hydration starts, but the effects
 * register after commit — so wait for the network to settle AND the
 * fiber AND a short settle. Without this the hero/menu tests flake
 * under load (fix batch 9).
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => {
    const stage = document.querySelector('[data-testid="hero-stage"]');
    return !!stage && Object.keys(stage).some((key) => key.startsWith("__reactFiber$"));
  });
  await page.waitForTimeout(500);
}

/** The bag-count badge (renders only when the bag is non-empty). */
export function bagCountBadge(page: Page) {
  return page.getByTestId("bag-count").first();
}

/** Add the current hero flavour to the bag via its tasting-notes dialog. */
export async function addCurrentFlavourViaDialog(page: Page, locale: Locale): Promise<void> {
  const t = LOCALES[locale];
  await page.getByRole("button", { name: t.tastingNotes }).click();
  const dialog = page.getByRole("dialog", { name: t.drinkName });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: t.dialogAddToBag }).click();
  // The panel stays open on add (reference behaviour) showing the
  // transient "Added to your bag" state; Escape closes it.
  await expect(dialog.getByRole("button", { name: t.dialogAddedToBag })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(bagCountBadge(page)).toBeVisible();
}

/**
 * Open the bag drawer and return its dialog. The header pill's bag
 * button opens the anchored bag panel (reference behaviour); the
 * panel's Checkout button opens the drawer with the real order flow.
 */
export async function openBag(page: Page, locale: Locale) {
  const t = LOCALES[locale];
  await page.getByRole("button", { name: t.bagButton }).click();
  const panel = page.getByRole("dialog", { name: t.bagTitle });
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: t.checkoutTitle }).click();
  const dialog = page.getByRole("dialog", { name: t.bagTitle });
  await expect(dialog).toBeVisible();
  return dialog;
}
