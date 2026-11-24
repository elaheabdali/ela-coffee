import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { en } from "@ela-coffee/i18n";
import { BagDrawer } from "./BagDrawer";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

function renderBag() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <BagDrawer />
    </NextIntlClientProvider>,
  );
}

function assertNoCheckout() {
  for (const button of screen.getAllByRole("button")) {
    expect(button.textContent ?? "").not.toMatch(/checkout|payment|pay now/i);
  }
  for (const link of screen.queryAllByRole("link")) {
    expect(link.textContent ?? "").not.toMatch(/checkout|payment|pay now/i);
  }
  expect(document.body.textContent ?? "").not.toMatch(/checkout/i);
}

beforeEach(() => {
  localStorage.clear();
  useBag.setState({ items: [], isOpen: false });
  useBrand.setState({ brand: "kuro" });
});

describe("BagDrawer", () => {
  it("renders nothing while closed", () => {
    renderBag();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the empty state when open with no items", () => {
    useBag.setState({ isOpen: true, items: [] });
    renderBag();
    expect(screen.getByRole("dialog", { name: "Your bag" })).toBeInTheDocument();
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
    expect(screen.getByText("Tap the bag under any drink to add it here.")).toBeInTheDocument();
    assertNoCheckout();
  });

  it("shows filled rows with stepper and subtotal", () => {
    useBag.setState({ isOpen: true, items: [{ drinkId: "kuro-caramel", qty: 2 }] });
    renderBag();
    expect(screen.getByText("Salted Caramel")).toBeInTheDocument();
    expect(screen.getByText("195,000 Toman")).toBeInTheDocument();
    // Line total and subtotal are both 390,000 Toman at qty 2.
    expect(screen.getAllByText("390,000 Toman")).toHaveLength(2);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(useBag.getState().items).toEqual([{ drinkId: "kuro-caramel", qty: 3 }]);
    expect(screen.getAllByText("585,000 Toman")).toHaveLength(2);
    assertNoCheckout();
  });

  it("removes the line when the stepper is stepped down to zero", () => {
    useBag.setState({ isOpen: true, items: [{ drinkId: "kuro-caramel", qty: 1 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));
    expect(useBag.getState().items).toEqual([]);
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
  });

  it("removes a line with the remove button", () => {
    useBag.setState({ isOpen: true, items: [{ drinkId: "kuro-caramel", qty: 1 }] });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Remove from bag" }));
    expect(useBag.getState().items).toEqual([]);
  });

  it("empties the bag with Clear bag", () => {
    useBag.setState({
      isOpen: true,
      items: [
        { drinkId: "kuro-caramel", qty: 1 },
        { drinkId: "kuro-mocha", qty: 2 },
      ],
    });
    renderBag();
    fireEvent.click(screen.getByRole("button", { name: "Clear bag" }));
    expect(useBag.getState().items).toEqual([]);
    expect(screen.getByText("Your bag is empty")).toBeInTheDocument();
    assertNoCheckout();
  });

  it("closes on Escape", () => {
    useBag.setState({ isOpen: true, items: [] });
    renderBag();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(useBag.getState().isOpen).toBe(false);
  });

  it("closes on overlay click", () => {
    useBag.setState({ isOpen: true, items: [] });
    renderBag();
    fireEvent.click(screen.getByTestId("bag-overlay"));
    expect(useBag.getState().isOpen).toBe(false);
  });
});
