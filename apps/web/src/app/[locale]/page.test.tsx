import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { en, fa } from "@ela-coffee/i18n";
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
});
