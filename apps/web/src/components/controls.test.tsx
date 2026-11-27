import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { ToastProvider } from "@ela-coffee/ui";
import { en, fa } from "@ela-coffee/i18n";
import { FlavorControls } from "./FlavorControls";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

function renderControls(locale: "en" | "fa" = "en") {
  const messages = locale === "fa" ? fa : en;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ToastProvider>
        <FlavorControls />
      </ToastProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  useBag.setState({ items: [], isOpen: false });
  useBrand.setState({ brand: "ela" });
  useFlavour.setState({ index: 0 });
});

describe("FlavorControls", () => {
  it("changes the flavour index on Surprise me", () => {
    renderControls();
    expect(useFlavour.getState().index).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Surprise me" }));
    expect(useFlavour.getState().index).not.toBe(0);
  });

  it("opens the bag panel from the bag button and the drawer from its Checkout", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Your bag, empty" }));
    const panel = await screen.findByRole("dialog", { name: "Your bag" });
    expect(panel).toBeInTheDocument();
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
    // The empty bag has no Checkout: add a drink, reopen, then check out.
    act(() => {
      useBag.getState().add("ela-original");
    });
    expect(screen.getByRole("button", { name: "Your bag, 1 drink" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(useBag.getState().isOpen).toBe(true);
    expect(screen.queryByRole("dialog", { name: "Your bag" })).not.toBeInTheDocument();
  });

  it("toggles one panel at a time and marks the open button expanded", async () => {
    renderControls();
    const allButton = screen.getByRole("button", { name: "All flavors" });
    expect(allButton).toHaveAttribute("aria-haspopup", "dialog");
    expect(allButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(allButton);
    const panel = await screen.findByRole("dialog", { name: "All flavors" });
    expect(panel).toBeInTheDocument();
    expect(allButton).toHaveAttribute("aria-expanded", "true");
    expect(allButton).toHaveAttribute("aria-controls", "kuro-panel-flavors");
    // Opening Tasting notes replaces the panel; clicking All flavors
    // again would close it.
    fireEvent.click(screen.getByRole("button", { name: "Tasting notes" }));
    expect(screen.queryByRole("dialog", { name: "All flavors" })).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog", { name: "Ela Original" })).toBeInTheDocument();
    expect(allButton).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the panel on Escape and returns focus to the trigger", async () => {
    renderControls();
    const allButton = screen.getByRole("button", { name: "All flavors" });
    fireEvent.click(allButton);
    expect(await screen.findByRole("dialog", { name: "All flavors" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "All flavors" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(allButton);
  });

  it("closes the panel on a pointerdown outside the pill", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "All flavors" }));
    expect(await screen.findByRole("dialog", { name: "All flavors" })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog", { name: "All flavors" })).not.toBeInTheDocument();
  });

  it("lists all 6 drinks of the current brand in the All flavors dialog", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "All flavors" }));
    // The dialog is a dynamic import: the chunk loads after the click.
    const dialog = await screen.findByRole("dialog", { name: "All flavors" });
    expect(dialog).toBeInTheDocument();
    for (const name of [
      "Ela Original",
      "Salted Caramel",
      "Vanilla Cream",
      "Toasted Hazelnut",
      "Dark Mocha",
      "Brown Sugar Cinnamon",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toBeInTheDocument();
    }
    // The current flavour (index 0) is marked with aria-current.
    expect(screen.getByRole("button", { name: /Ela Original/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("jumps to a flavour when its All flavors row is clicked", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "All flavors" }));
    fireEvent.click(await screen.findByRole("button", { name: /Dark Mocha/ }));
    expect(useFlavour.getState().index).toBe(4);
    expect(screen.queryByRole("dialog", { name: "All flavors" })).not.toBeInTheDocument();
  });

  it("shows 3 notes plus size, caffeine and price in the Tasting notes dialog", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Tasting notes" }));
    const dialog = await screen.findByRole("dialog", { name: "Ela Original" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/double shot of our house espresso/)).toBeInTheDocument();
    for (const note of ["Dark cocoa", "Toasted almond", "Brown sugar"]) {
      expect(screen.getByText(note)).toBeInTheDocument();
    }
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("16 oz iced")).toBeInTheDocument();
    expect(screen.getByText("Caffeine")).toBeInTheDocument();
    expect(screen.getByText("150 mg")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    // The price shows twice: in the stats strip and on the Add button.
    expect(screen.getAllByText("180,000 T")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Add to bag/ })).toBeInTheDocument();
  });

  it("adds the drink from the Tasting notes panel and shows Added to your bag briefly", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Tasting notes" }));
    const dialog = await screen.findByRole("dialog", { name: "Ela Original" });
    const addButton = await screen.findByRole("button", { name: /Add to bag/ });
    fireEvent.click(addButton);
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
    expect(screen.getByRole("status")).toHaveTextContent("Ela Original added to your bag.");
    // The reference never closes the panel on add: it stays open
    // showing "Added to your bag", keeps bg-cream, and hides the
    // price span until the transient state reverts after 1400 ms.
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Added to your bag/ })).toBeInTheDocument();
    expect(addButton.querySelector(".lucide-check")).not.toBeNull();
    expect(addButton.className).not.toContain("bg-crema");
    expect(addButton.querySelector("span.tabular-nums")).toBeNull();
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /Add to bag/ })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(addButton.querySelector("span.tabular-nums")).not.toBeNull();
    // Escape closes the panel after the add.
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Ela Original" })).not.toBeInTheDocument();
  });

  it("steps quantities and clears the bag from the bag panel", async () => {
    act(() => {
      useBag.getState().add("ela-original");
    });
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Your bag, 1 drink" }));
    const panel = await screen.findByRole("dialog", { name: "Your bag" });
    expect(panel).toBeInTheDocument();
    expect(screen.getByText("Ela Original")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add one more Ela Original" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 2 }]);
    // Line total and subtotal are both 360,000 T at qty 2.
    expect(screen.getAllByText("360,000 T")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove one Ela Original" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
    fireEvent.click(screen.getByRole("button", { name: "Clear bag" }));
    expect(useBag.getState().items).toEqual([]);
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
  });

  it("shows Persian digits for caffeine in the fa locale", async () => {
    renderControls("fa");
    fireEvent.click(screen.getByRole("button", { name: "یادداشت‌های طعم" }));
    expect(await screen.findByText("۱۵۰ میلی‌گرم")).toBeInTheDocument();
  });
});
