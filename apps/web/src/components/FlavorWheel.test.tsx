import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ToastProvider } from "@ela-coffee/ui";
import { en } from "@ela-coffee/i18n";
import { FlavorWheel, flavourIndexForProgress, wrappedDelta } from "./FlavorWheel";
import { useBag } from "@/stores/bag";
import { useBrand } from "@/stores/brand";
import { useFlavour } from "@/stores/flavour";

vi.mock("next/image", () => ({
  default: (props: {
    src: string;
    alt: string;
    priority?: boolean;
    sizes?: string;
    fetchPriority?: "high" | "low" | "auto";
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src}
      alt={props.alt}
      data-priority={props.priority ? "true" : undefined}
      sizes={props.sizes}
      fetchPriority={props.fetchPriority}
    />
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
  useBrand.setState({ brand: "ela" });
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
    expect(
      screen.getByRole("heading", { level: 1, name: "Choose your coffee" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Ela Original to your bag, 180,000 T/ }),
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
    expect(screen.getByRole("button", { name: /Add Dark Mocha to your bag/ })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /Add Ela Original to your bag/ }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
    expect(screen.getByRole("status")).toHaveTextContent("Ela Original added to your bag.");
  });

  it("shows the bag icon when the drink is not in the bag", () => {
    renderWheel();
    const chip = screen.getByRole("button", { name: /Add Ela Original to your bag/ });
    expect(chip.querySelector(".lucide-shopping-bag")).not.toBeNull();
    expect(chip.querySelector(".lucide-check")).toBeNull();
  });

  it("shows a brief check after clicking the price pill, then reverts to the bag icon", () => {
    vi.useFakeTimers();
    try {
      renderWheel();
      const chip = screen.getByRole("button", { name: /Add Ela Original to your bag/ });
      fireEvent.click(chip);
      expect(chip.querySelector(".lucide-check")).not.toBeNull();
      expect(chip.querySelector(".lucide-shopping-bag")).toBeNull();
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(chip.querySelector(".lucide-shopping-bag")).not.toBeNull();
      expect(chip.querySelector(".lucide-check")).toBeNull();
      // Only the icon reverts — the drink stays in the bag.
      expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clicking the price pill again adds another and shows the check briefly again", () => {
    vi.useFakeTimers();
    try {
      renderWheel();
      const chip = screen.getByRole("button", { name: /Add Ela Original to your bag/ });
      fireEvent.click(chip);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(chip.querySelector(".lucide-shopping-bag")).not.toBeNull();
      fireEvent.click(chip);
      expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 2 }]);
      expect(chip.querySelector(".lucide-check")).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(chip.querySelector(".lucide-shopping-bag")).not.toBeNull();
      expect(chip.querySelector(".lucide-check")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("switching flavour clears the check immediately", () => {
    vi.useFakeTimers();
    try {
      renderWheel();
      const chip = screen.getByRole("button", { name: /Add Ela Original to your bag/ });
      fireEvent.click(chip);
      expect(chip.querySelector(".lucide-check")).not.toBeNull();
      // Switch to Dark Mocha via its dot: the check must not leak over.
      fireEvent.click(screen.getByRole("button", { name: "Dark Mocha" }));
      const mochaChip = screen.getByRole("button", { name: /Add Dark Mocha to your bag/ });
      expect(mochaChip.querySelector(".lucide-shopping-bag")).not.toBeNull();
      expect(mochaChip.querySelector(".lucide-check")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not capture the pointer on pointerdown — only once a drag starts", () => {
    renderWheel();
    const stage = screen.getByRole("region", { name: "Choose your coffee" });
    const capture = vi.fn();
    (stage as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture =
      capture;
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, button: 0 });
    expect(capture).not.toHaveBeenCalled();
    // A 5px wobble is still a tap: no capture, so the click reaches
    // the button it landed on.
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 305 });
    expect(capture).not.toHaveBeenCalled();
    // Past 10px the drag starts and the pointer is captured, once.
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 320 });
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 340 });
    expect(capture).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 340 });
  });

  it("keeps the tile ring behind the cup photo (z-0 under the z-10 scene)", () => {
    const { container } = renderWheel();
    // The ring wrapper is the aria-hidden layer that holds the tile images.
    const ring = container.querySelector('[aria-hidden="true"].z-0');
    expect(ring).not.toBeNull();
    expect(ring?.querySelectorAll("img").length).toBeGreaterThan(0);
    const scene = container.querySelector(".ela-glass.z-10");
    expect(scene).not.toBeNull();
    // Audit §3.5 frame: a 16:9 box anchored at --scene-top, not full-bleed.
    expect(scene?.className).toContain("top-(--scene-top)");
    expect(scene?.className).toContain("h-(--s)");
    expect(scene?.className).toContain("w-(--scene-w)");
  });

  it("marks the hero scene image priority so it preloads for LCP", () => {
    const { container } = renderWheel();
    const sceneImg = container.querySelector(".ela-glass.z-10 img");
    expect(sceneImg?.getAttribute("data-priority")).toBe("true");
    // The scene frame is ~957 CSS px on mobile (audit §3.5 geometry),
    // so the sizes hint must cover the full viewport width.
    expect(sceneImg?.getAttribute("sizes")).toContain("100vw");
  });

  it("sizes the tile-ring images to their display size (160px, not 200px)", () => {
    const { container } = renderWheel();
    // Tiles display at ≤171 CSS px (--tile ≤ 0.19 × --s); asking for
    // 200px made the browser fetch the 640w variant for every tile.
    const ring = container.querySelector('[aria-hidden="true"].z-0');
    const tileImgs = ring?.querySelectorAll("img") ?? [];
    expect(tileImgs.length).toBeGreaterThan(0);
    for (const img of Array.from(tileImgs)) {
      expect(img.getAttribute("sizes")).toBe("160px");
    }
  });

  it("gives the wheel region a visible focus ring (no outline-none)", () => {
    const { container } = renderWheel();
    const stage = container.querySelector(".ela-stage");
    expect(stage).not.toBeNull();
    expect(stage?.className).not.toContain("outline-none");
    expect(stage?.getAttribute("tabindex")).toBe("0");
  });
});
