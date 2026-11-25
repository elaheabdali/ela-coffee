import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { ToastProvider } from "@ela-coffee/ui";
import { en, fa } from "@ela-coffee/i18n";
import { ALL_DRINKS, BRANDS } from "@/data/flavours";
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

/**
 * Render with a TanStack Query client (Phase 6: MenuSection loads
 * /api/menu through useQuery). The fetch mock answers the menu
 * request from the static dataset so no network is touched.
 */
function renderWithQuery(ui: ReactNode, locale: "fa" | "en") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={locale === "fa" ? fa : en}>
        <ToastProvider>{ui}</ToastProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  useBag.getState().clear();
  useBrand.setState({ brand: "ela" });
});

afterEach(() => {
  useBag.getState().clear();
  useBrand.setState({ brand: "ela" });
  globalThis.fetch = originalFetch;
});

describe("Story", () => {
  it.each([
    ["fa", "الا سیاه شروع می‌شود. بقیه‌اش با توست.", "۷ روز"],
    ["en", "Ela starts black. The rest is up to you.", "7 days"],
  ] as const)("renders the heading in %s", (locale, heading, stat) => {
    renderWithLocale(<Story />, locale);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    expect(screen.getByText(stat)).toBeInTheDocument();
  });

  it("keeps the stats dt/dd directly in the dl (axe definition-list / dlitem)", () => {
    const { container } = renderWithLocale(<Story />, "en");
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    // axe requires every dt/dd to be a child of the dl or of a div that
    // is itself a direct child of the dl — no deeper nesting.
    for (const el of Array.from(dl?.querySelectorAll("dt, dd") ?? [])) {
      const parent = el.parentElement;
      expect(parent === dl || (parent?.tagName === "DIV" && parent.parentElement === dl)).toBe(
        true,
      );
    }
    expect(dl?.querySelectorAll("dt")).toHaveLength(4);
    expect(dl?.querySelectorAll("dd")).toHaveLength(4);
  });
});

describe("MenuSection", () => {
  it.each([
    ["fa", "شش آیس‌لاته. یک شات بی‌نقص."],
    ["en", "Six iced lattes. One perfect shot."],
  ] as const)("renders the heading in %s", (locale, heading) => {
    renderWithQuery(<MenuSection />, locale);
    expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
  });

  it("renders six cards and the make-it-yours groups", () => {
    renderWithQuery(<MenuSection />, "en");
    expect(screen.getByRole("heading", { level: 3, name: "Ela Original" })).toBeInTheDocument();
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

    expect(await screen.findByText("That email address doesn't look right.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows the Zod error for an empty email", async () => {
    renderWithLocale(<JoinList />, "en");
    fireEvent.click(screen.getByRole("button", { name: "Join the list" }));
    expect(await screen.findByText("An email address is required.")).toBeInTheDocument();
  });

  it("posts to /api/newsletter and shows the success state for a valid email", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    globalThis.fetch = fetchSpy as typeof fetch;
    renderWithLocale(<JoinList />, "en");

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "taster@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join the list" }));

    expect(await screen.findByText("You're on the list!")).toBeInTheDocument();
    expect(
      screen.getByText("We'll write the day a new flavor reaches the menu."),
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/newsletter",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "taster@example.com" }),
      }),
    );
  });
});

describe("SiteFooter", () => {
  it("renders the brand wordmark, tagline, explore links and back-to-top", () => {
    renderWithLocale(<SiteFooter />, "en");
    expect(screen.getByText("ela")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Small-batch iced lattes, poured black first, flavored fresh every morning.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Story" })).toHaveAttribute("href", "#story");
    expect(screen.getByRole("link", { name: "Menu" })).toHaveAttribute("href", "#menu");
    expect(screen.getByRole("link", { name: "How it's made" })).toHaveAttribute("href", "#process");
    expect(screen.getByRole("link", { name: "Origins" })).toHaveAttribute("href", "#origins");
    expect(screen.getByRole("link", { name: "Join the list" })).toHaveAttribute("href", "#join");
    expect(screen.getByRole("link", { name: "Back to top" })).toHaveAttribute("href", "#hero");
    expect(screen.getByText("© 2026 Ela Coffee. All rights reserved.")).toBeInTheDocument();
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
    const drink = BRANDS.ela.drinks[0];
    renderWithLocale(<MenuCard drink={drink} />, "en");

    expect(screen.getByRole("heading", { level: 3, name: "Ela Original" })).toBeInTheDocument();
    // All three tasting notes from the same array the dialog uses.
    for (const note of ["Dark cocoa", "Toasted almond", "Brown sugar"]) {
      expect(screen.getByText(note)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);

    fireEvent.click(screen.getByRole("button", { name: "Add to bag" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 2 }]);
  });

  it("renders the fa name, notes and price", () => {
    const drink = BRANDS.ela.drinks[0];
    renderWithLocale(<MenuCard drink={drink} />, "fa");
    expect(screen.getByRole("heading", { level: 3, name: "الا اورجینال" })).toBeInTheDocument();
    expect(screen.getByText("کاکائوی تلخ")).toBeInTheDocument();
  });
});
