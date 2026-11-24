import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ToastProvider } from "@ela-coffee/ui";
import { en } from "@ela-coffee/i18n";
import { FlavorWheel, flavourIndexForProgress, wrappedDelta } from "./FlavorWheel";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

function renderWheel() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ToastProvider>
        <FlavorWheel />
      </ToastProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useBrand.setState({ brand: "kuro" });
  useFlavour.setState({ index: 0 });
  useBag.setState({ items: [], isOpen: false });
  document.documentElement.setAttribute("dir", "ltr");
});

describe("wheel helpers", () => {
  it("wraps angular distance to (-3, 3]", () => {
    expect(wrappedDelta(0)).toBe(0);
    expect(wrappedDelta(5)).toBe(-1);
    expect(wrappedDelta(-1)).toBe(-1);
    expect(wrappedDelta(3)).toBe(-3);
    expect(wrappedDelta(9)).toBe(-3);
  });

  it("maps scroll progress to a looping flavour index", () => {
    expect(flavourIndexForProgress(0)).toBe(0);
    expect(flavourIndexForProgress(0.5)).toBe(3);
    expect(flavourIndexForProgress(0.99)).toBe(5);
    expect(flavourIndexForProgress(1)).toBe(0);
    expect(flavourIndexForProgress(-0.5)).toBe(0);
  });
});

describe("FlavorWheel", () => {
  it("renders the hero heading, current flavour, price pill and 6 dots", () => {
    renderWheel();
    expect(screen.getByRole("heading", { level: 1, name: "Choose your coffee" })).toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Kuro Original to your bag, 180,000 Toman/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "All flavors" })).toBeInTheDocument();
  });

  it("shows the reference's 4 featured flavours", () => {
    renderWheel();
    for (const name of ["Mocha", "Cinnamon", "Caramel", "Vanilla"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Hazelnut" })).not.toBeInTheDocument();
  });

  it("ArrowRight goes to the next flavour, ArrowLeft to the previous", () => {
    renderWheel();
    const stage = screen.getByRole("region", { name: "Choose your coffee" });
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Salted Caramel to your bag/ }),
    ).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: "ArrowLeft" });
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("clicking a dot jumps directly to that flavour", () => {
    renderWheel();
    fireEvent.click(screen.getByRole("button", { name: "Dark Mocha" }));
    expect(screen.getByText("5 / 6")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Dark Mocha to your bag/ }),
    ).toBeInTheDocument();
  });

  it("dragging left goes next, dragging right goes previous", () => {
    renderWheel();
    const stage = screen.getByRole("region", { name: "Choose your coffee" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 200 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 200 });
    expect(screen.getByText("2 / 6")).toBeInTheDocument();

    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 200, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 300 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 300 });
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("a short drag does not change the flavour", () => {
    renderWheel();
    const stage = screen.getByRole("region", { name: "Choose your coffee" });
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 280 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 280 });
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("the price pill adds the current drink to the bag", () => {
    renderWheel();
    fireEvent.click(screen.getByRole("button", { name: /Add Kuro Original to your bag/ }));
    expect(useBag.getState().items).toEqual([{ drinkId: "kuro-original", qty: 1 }]);
    expect(screen.getByRole("status")).toHaveTextContent("Kuro Original added to your bag.");
  });

  it("keeps the tile ring behind the cup photo (z-0 under the z-10 scene)", () => {
    const { container } = renderWheel();
    // The ring wrapper is the aria-hidden layer that holds the tile images.
    const ring = container.querySelector('[aria-hidden="true"].z-0');
    expect(ring).not.toBeNull();
    expect(ring?.querySelectorAll("img").length).toBeGreaterThan(0);
    const scene = container.querySelector(".kuro-glass.z-10");
    expect(scene).not.toBeNull();
    // Audit §3.5 frame: a 16:9 box anchored at --scene-top, not full-bleed.
    expect(scene?.className).toContain("top-(--scene-top)");
    expect(scene?.className).toContain("h-(--s)");
    expect(scene?.className).toContain("w-(--scene-w)");
  });
});
