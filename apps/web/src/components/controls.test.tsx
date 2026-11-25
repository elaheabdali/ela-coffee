import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("opens the bag drawer from the bag button", () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Open bag" }));
    expect(useBag.getState().isOpen).toBe(true);
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
    expect(screen.getByText("180,000 T")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to bag" })).toBeInTheDocument();
  });

  it("adds the drink to the bag from the Tasting notes dialog", async () => {
    renderControls();
    fireEvent.click(screen.getByRole("button", { name: "Tasting notes" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add to bag" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
    expect(screen.getByRole("status")).toHaveTextContent("Ela Original added to your bag.");
    expect(screen.queryByRole("dialog", { name: "Ela Original" })).not.toBeInTheDocument();
  });

  it("shows Persian digits for caffeine in the fa locale", async () => {
    renderControls("fa");
    fireEvent.click(screen.getByRole("button", { name: "یادداشت‌های طعم" }));
    expect(await screen.findByText("۱۵۰ میلی‌گرم")).toBeInTheDocument();
  });
});
