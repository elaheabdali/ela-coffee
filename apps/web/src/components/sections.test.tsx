import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
    ["fa", "ela", "الا سیاه شروع می‌شود. بقیه‌اش با توست.", "۷ روز"],
    ["en", "ela", "Ela starts black. The rest is up to you.", "7 days"],
    ["fa", "midori", /میدوری یعنی سبز\. ما این را جدی می‌گیریم\./, "۲۱ روز"],
    ["en", "midori", "Midori means green. We take that seriously.", "21 days"],
  ] as const)(
    "renders the %s heading and badge in %s",
    (locale, brand, heading, badge) => {
      useBrand.setState({ brand });
      renderWithLocale(<Story />, locale);
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
      // The days value is the floating badge over the image (reference
      // markup), not a stat.
      expect(screen.getByText(badge)).toBeInTheDocument();
    },
  );

  it("renders exactly three stats with the reference labels (en)", () => {
    for (const [brand, labels] of [
      [
        "ela",
        [
          "Single origins, roasted every week",
          "Flavors made in house each morning",
          "Powders or artificial syrups",
        ],
      ],
      [
        "midori",
        [
          "Tea gardens in Japan we source from",
          "Fruit pairings made fresh each morning",
          "Added colors or powdered mixes",
        ],
      ],
    ] as const) {
      useBrand.setState({ brand });
      const { unmount } = renderWithLocale(<Story />, "en");
      for (const label of labels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      unmount();
    }
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
    expect(dl?.querySelectorAll("dt")).toHaveLength(3);
    expect(dl?.querySelectorAll("dd")).toHaveLength(3);
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
    // Options are one comma-joined line per group (reference markup),
    // not separate list items.
    expect(screen.getByText("Whole, Oat, Almond")).toBeInTheDocument();
    expect(screen.getByText("Full, Half, Unsweetened")).toBeInTheDocument();
    expect(screen.getByText("12 oz, 16 oz, 20 oz")).toBeInTheDocument();
  });

  it("links the flavor wheel pill to #hero", () => {
    renderWithQuery(<MenuSection />, "en");
    expect(
      screen.getByRole("link", { name: /Spin the flavor wheel/ }),
    ).toHaveAttribute("href", "#hero");
  });

  it("shows the price pill on the card image (en)", () => {
    renderWithQuery(<MenuSection />, "en");
    // One pill per card, each showing its Toman price — plus the same
    // price in the card's Add button (fix batch 9), so each price
    // text appears twice per card.
    expect(screen.getAllByText("180,000 T")).toHaveLength(2);
    expect(screen.getAllByText("205,000 T")).toHaveLength(2);
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
    // Reference markup: the h3 is the region only ("Huila"), the
    // country is a separate line under it.
    expect(screen.getByRole("heading", { level: 3, name: "Huila" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Sidama" })).toBeInTheDocument();
    expect(screen.getByText("Colombia")).toBeInTheDocument();
    expect(screen.getByText("Ethiopia")).toBeInTheDocument();
    expect(screen.getByText("60% of the blend")).toBeInTheDocument();
    expect(screen.getByText("40% of the blend")).toBeInTheDocument();
    expect(screen.getByText("1,700 m")).toBeInTheDocument();
    expect(screen.getByText("Natural")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Grown around 1,700 meters on the Andean slopes of southern Colombia, this washed coffee gives the blend its cocoa backbone and a long caramel finish.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the midori gardens with the reference's facts", () => {
    useBrand.setState({ brand: "midori" });
    renderWithLocale(<Origins />, "en");
    expect(
      screen.getByRole("heading", { level: 2, name: "Two gardens, blended for balance." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Uji" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Nishio" })).toBeInTheDocument();
    expect(screen.getByText("Kyoto, Japan")).toBeInTheDocument();
    expect(screen.getByText("Aichi, Japan")).toBeInTheDocument();
    expect(screen.getByText("Umami, sweet grass")).toBeInTheDocument();
    expect(screen.getByText("Floral, sweet pea")).toBeInTheDocument();
    expect(screen.getByText("20 days")).toBeInTheDocument();
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
        // The honeypot posts under the API's `website` field name;
        // an empty `join-company` field maps to an empty string.
        body: JSON.stringify({ email: "taster@example.com", website: "" }),
      }),
    );
  });

  it("renders the reference intro and the offscreen honeypot field", () => {
    renderWithLocale(<JoinList />, "en");
    expect(
      screen.getByText(
        "New flavors land every season. Leave your email and we'll tell you the day they reach the menu.",
      ),
    ).toBeInTheDocument();
    const honeypot = document.querySelector("#join-company");
    expect(honeypot).not.toBeNull();
    expect(honeypot?.getAttribute("name")).toBe("join-company");
    expect(honeypot?.getAttribute("type")).toBe("text");
    expect(honeypot?.getAttribute("tabindex")).toBe("-1");
    // The reservation form is kept below the crema card, inside #join.
    expect(screen.getByRole("heading", { level: 3, name: "Book a table" })).toBeInTheDocument();
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
    // The price is a pill on the image, not a footer Price component —
    // and, since fix batch 9, also a span in the Add button.
    expect(screen.getAllByText("180,000 T")).toHaveLength(2);
    // The sprite thumbnail is the decorative sprite-sheet img.
    expect(screen.getByAltText("")).toBeInTheDocument();

    // The button's accessible name is its aria-label (reference:
    // "Add Kuro Original to your bag, $5.40", Toman here).
    const addButton = screen.getByRole("button", {
      name: "Add Ela Original to your bag, 180,000 T",
    });
    fireEvent.click(addButton);
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);

    fireEvent.click(addButton);
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 2 }]);
  });

  it("shows a brief crema check after clicking Add, then reverts", () => {
    vi.useFakeTimers();
    try {
      const drink = BRANDS.ela.drinks[0];
      renderWithLocale(<MenuCard drink={drink} />, "en");
      const addButton = screen.getByRole("button", {
        name: "Add Ela Original to your bag, 180,000 T",
      });

      // Resting state: bag icon, "Add to bag", price span in the button.
      expect(addButton.querySelector(".lucide-shopping-bag")).not.toBeNull();
      expect(addButton.querySelector(".lucide-check")).toBeNull();
      expect(addButton).toHaveTextContent("Add to bag");
      expect(addButton.querySelector("span.tabular-nums")).not.toBeNull();

      fireEvent.click(addButton);
      expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
      // Added state: crema background, Check (strokeWidth 2.5), no price.
      expect(addButton.querySelector(".lucide-check")).not.toBeNull();
      expect(addButton.querySelector(".lucide-shopping-bag")).toBeNull();
      expect(addButton).toHaveTextContent("Added to your bag");
      expect(addButton.className).toContain("bg-crema");
      expect(addButton.querySelector("span.tabular-nums")).toBeNull();

      // After ~1.4 s it reverts on its own; the drink stays in the bag.
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      expect(addButton.querySelector(".lucide-shopping-bag")).not.toBeNull();
      expect(addButton.querySelector(".lucide-check")).toBeNull();
      expect(addButton).toHaveTextContent("Add to bag");
      expect(addButton.className).toContain("bg-cream");
      expect(addButton.querySelector("span.tabular-nums")).not.toBeNull();
      expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the fa name, notes and price", () => {
    const drink = BRANDS.ela.drinks[0];
    renderWithLocale(<MenuCard drink={drink} />, "fa");
    expect(screen.getByRole("heading", { level: 3, name: "الا اورجینال" })).toBeInTheDocument();
    expect(screen.getByText("کاکائوی تلخ — TODO(review)")).toBeInTheDocument();
    expect(screen.getAllByText("۱۸۰٬۰۰۰ تومان")).toHaveLength(2);
  });
});
