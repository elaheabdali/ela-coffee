import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { en, fa } from "@ela-coffee/i18n";
import { ALL_DRINKS } from "@/data/flavours";
import Page from "./page";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace?: string) => (key: string) => `${namespace ?? "?"}.${key}`,
  setRequestLocale: () => undefined,
}));

// Phase 6: MenuSection loads /api/menu through TanStack Query — answer
// it from the static dataset so the page tests never touch the network.
const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      drinks: ALL_DRINKS.map((drink, index) => ({
        id: drink.id,
        brand: drink.brand,
        slug: drink.slug,
        nameFa: drink.nameFa,
        nameEn: drink.nameEn,
        priceToman: drink.priceToman,
        caffeineMg: drink.caffeineMg,
        notesFa: drink.notesFa,
        notesEn: drink.notesEn,
        image: drink.image,
        sort: index,
      })),
    }),
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("home page (Phase 4)", () => {
  it("renders hero, story, menu, process, origins, join and footer in fa", async () => {
    const ui = await Page({ params: Promise.resolve({ locale: "fa" }) });
    render(
      <NextIntlClientProvider locale="fa" messages={fa}>
        {ui}
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "قهوه‌ات را انتخاب کن" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "کورو یعنی سیاه. بقیه‌اش با توست." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "شش آیس‌لاته. یک شات بی‌نقص." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "از دانهٔ سبز تا فنجان تو، در چهار قدمِ دقیق." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "دو خاستگاه، آمیخته برای عمق." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "اولین نفر باش که طعم‌های تازه را می‌چشد." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/همهٔ حقوق محفوظ است/)).toBeInTheDocument();
    // The template badge is gone on purpose (audit §8.1).
    expect(screen.queryByText(/Modulify/i)).not.toBeInTheDocument();
  });

  it("renders the same sections in en", async () => {
    const ui = await Page({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {ui}
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Choose your coffee" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Kuro means black. The rest is up to you." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Six iced lattes. One perfect shot." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it("renders the fa page with Persian digits and no Latin digits in visible text", async () => {
    const ui = await Page({ params: Promise.resolve({ locale: "fa" }) });
    render(
      <NextIntlClientProvider locale="fa" messages={fa}>
        {ui}
      </NextIntlClientProvider>,
    );

    expect(screen.getAllByText("۱۸۰٬۰۰۰ تومان").length).toBeGreaterThan(0);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/[0-9]/);
  });

  it("renders the en page with Latin digits and no Persian script in visible text", async () => {
    const ui = await Page({ params: Promise.resolve({ locale: "en" }) });
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        {ui}
      </NextIntlClientProvider>,
    );

    expect(screen.getAllByText("180,000 Toman").length).toBeGreaterThan(0);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/[\u0600-\u06FF]/);
  });
});
