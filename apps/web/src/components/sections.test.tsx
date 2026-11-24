import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ToastProvider } from "@ela-coffee/ui";
import { en, fa } from "@ela-coffee/i18n";
import { BRANDS } from "@/data/flavours";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { Story } from "@/components/Story";
import { MenuCard } from "@/components/MenuCard";
import { MenuSection } from "@/components/MenuSection";
import { Process } from "@/components/Process";
import { Origins } from "@/components/Origins";
import { JoinList } from "@/components/JoinList";
import { SiteFooter } from "@/components/SiteFooter";
import type { ReactNode } from "react";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

function renderWithLocale(ui: ReactNode, locale: "fa" | "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "fa" ? fa : en}>
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  useBag.getState().clear();
  useBrand.setState({ brand: "kuro" });
});

afterEach(() => {
  useBag.getState().clear();
  useBrand.setState({ brand: "kuro" });
});

describe("Story", () => {
  it.each([
    ["fa", "کورو یعنی سیاه. بقیه‌اش با توست.", "۷ روز"],
    ["en", "Kuro means black. The rest is up to you.", "7 days"],
  ] as const)("renders the heading in %s", (locale, heading, stat) => {
    renderWithLocale(<Story />, locale);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    expect(screen.getByText(stat)).toBeInTheDocument();
  });
});

describe("MenuSection", () => {
  it.each([
    ["fa", "شش آیس‌لاته. یک شات بی‌نقص."],
    ["en", "Six iced lattes. One perfect shot."],
  ] as const)("renders the heading in %s", (locale, heading) => {
    renderWithLocale(<MenuSection />, locale);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
  });

  it("renders six cards and the make-it-yours groups", () => {
    renderWithLocale(<MenuSection />, "en");
    expect(screen.getByRole("heading", { level: 3, name: "Kuro Original" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Dark Mocha" })).toBeInTheDocument();
    expect(screen.getByText("Make it yours")).toBeInTheDocument();
    expect(screen.getByText("Every swap is free. Just ask when you order.")).toBeInTheDocument();
    expect(screen.getByText("Whole")).toBeInTheDocument();
    expect(screen.getByText("Unsweetened")).toBeInTheDocument();
    expect(screen.getByText("20 oz")).toBeInTheDocument();
  });
});

describe("Process", () => {
  it.each([
    ["fa", "از دانهٔ سبز تا فنجان تو، در چهار قدمِ دقیق."],
    ["en", "From green bean to your cup in four careful steps."],
  ] as const)("renders the heading in %s", (locale, heading) => {
    renderWithLocale(<Process />, locale);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
  });

  it("renders all four numbered steps", () => {
    renderWithLocale(<Process />, "en");
    for (const step of ["Roast", "Rest", "Pull", "Pour"]) {
      expect(screen.getByRole("heading", { level: 3, name: step })).toBeInTheDocument();
    }
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
  });
});

describe("Origins", () => {
  it.each([
    ["fa", "دو خاستگاه، آمیخته برای عمق."],
    ["en", "Two origins, blended for depth."],
  ] as const)("renders the heading in %s", (locale, heading) => {
    renderWithLocale(<Origins />, locale);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
  });

  it("renders both origin cards with shares and facts", () => {
    renderWithLocale(<Origins />, "en");
    expect(screen.getByRole("heading", { level: 3, name: "Huila, Colombia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Sidama, Ethiopia" })).toBeInTheDocument();
    expect(screen.getByText("60% of the blend")).toBeInTheDocument();
    expect(screen.getByText("40% of the blend")).toBeInTheDocument();
    expect(screen.getByText("1,700 m")).toBeInTheDocument();
    expect(screen.getByText("Natural")).toBeInTheDocument();
  });

  it("renders the fa share label with Persian digits", () => {
    renderWithLocale(<Origins />, "fa");
    expect(screen.getByText("۶۰٪ از ترکیب")).toBeInTheDocument();
  });
});

describe("JoinList", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it.each([
    ["fa", "اولین نفر باش که طعم‌های تازه را می‌چشد."],
    ["en", "Be first to taste what's next."],
  ] as const)("renders the heading in %s", (locale, heading) => {
    renderWithLocale(<JoinList />, locale);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
  });

  it("shows the Zod error for an invalid email and never calls fetch", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
    renderWithLocale(<JoinList />, "en");

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join the list" }));

    expect(
      await screen.findByText("That email address doesn't look right."),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows the Zod error for an empty email", async () => {
    renderWithLocale(<JoinList />, "en");
    fireEvent.click(screen.getByRole("button", { name: "Join the list" }));
    expect(await screen.findByText("An email address is required.")).toBeInTheDocument();
  });

  it("shows the success state for a valid email and never calls fetch", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
    renderWithLocale(<JoinList />, "en");

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "taster@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join the list" }));

    expect(await screen.findByRole("status")).toHaveTextContent("You're on the list!");
    expect(screen.getByText("We'll write the day a new flavour reaches the menu.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("SiteFooter", () => {
  it("renders the brand wordmark, tagline, explore links and back-to-top", () => {
    renderWithLocale(<SiteFooter />, "en");
    expect(screen.getByText("kuro")).toBeInTheDocument();
    expect(
      screen.getByText("Small-batch iced lattes, poured black first, flavoured fresh every morning."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Story" })).toHaveAttribute("href", "#story");
    expect(screen.getByRole("link", { name: "Menu" })).toHaveAttribute("href", "#menu");
    expect(screen.getByRole("link", { name: "How it's made" })).toHaveAttribute("href", "#process");
    expect(screen.getByRole("link", { name: "Origins" })).toHaveAttribute("href", "#origins");
    expect(screen.getByRole("link", { name: "Join the list" })).toHaveAttribute("href", "#join");
    expect(screen.getByRole("link", { name: "Back to top" })).toHaveAttribute("href", "#hero");
    expect(screen.getByText("© 2026 Kuro Coffee. All rights reserved.")).toBeInTheDocument();
    expect(screen.queryByText(/Modulify/i)).not.toBeInTheDocument();
  });

  it("renders the midori wordmark and tagline when the brand is matcha", () => {
    useBrand.setState({ brand: "midori" });
    renderWithLocale(<SiteFooter />, "en");
    expect(screen.getByText("midori")).toBeInTheDocument();
    expect(
      screen.getByText("Small-batch iced matchas, whisked bright first, every morning."),
    ).toBeInTheDocument();
  });
});

describe("MenuCard", () => {
  it("adds the drink to the bag store on click", async () => {
    const drink = BRANDS.kuro.drinks[0];
    renderWithLocale(<MenuCard drink={drink} />, "en");

    expect(screen.getByRole("heading", { level: 3, name: "Kuro Original" })).toBeInTheDocument();
    // All three tasting notes from the same array the dialog uses.
    for (const note of ["Dark cocoa", "Toasted almond", "Brown sugar"]) {
      expect(screen.getByText(note)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "kuro-original", qty: 1 }]);

    fireEvent.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "kuro-original", qty: 2 }]);
  });

  it("renders the fa name, notes and price", () => {
    const drink = BRANDS.kuro.drinks[0];
    renderWithLocale(<MenuCard drink={drink} />, "fa");
    expect(screen.getByRole("heading", { level: 3, name: "کورو اورجینال" })).toBeInTheDocument();
    expect(screen.getByText("کاکائوی تلخ")).toBeInTheDocument();
  });
});
