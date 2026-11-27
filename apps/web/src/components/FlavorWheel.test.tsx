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
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src}
      alt={props.alt}
      data-priority={props.priority ? "true" : undefined}
      sizes={props.sizes}
      fetchPriority={props.fetchPriority}
      className={props.className}
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
  it("renders the hero heading, current flavour, price pill, counter and 15 tiles", () => {
    const { container } = renderWheel();
    expect(
      screen.getByRole("heading", { level: 1, name: "Choose your coffee" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Ela Original to your bag, 180,000 T/ }),
    ).toBeInTheDocument();
    // Reference counter: padded "01 / 06" (two spans, so match each part).
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("/ 06")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Flavors" })).toBeInTheDocument();
    expect(container.querySelectorAll("button[data-slot]").length).toBe(15);
  });

  it("shows the reference's reachable tiles (±1, ±2) with float delays, not a fan", () => {
    const { container } = renderWheel();
    for (const name of [
      "Choose Brown Sugar Cinnamon",
      "Choose Dark Mocha",
      "Choose Salted Caramel",
      "Choose Vanilla Cream",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    // The current flavour's tile (slot 0) is aria-hidden, not a button role.
    expect(
      screen.queryByRole("button", { name: "Choose Ela Original" }),
    ).not.toBeInTheDocument();
    // Float delay is -1.2s per wrapped drink index (the reference's e0).
    const caramelTile = container.querySelector('button[data-slot="1"] .animate-ela-float');
    expect((caramelTile as HTMLElement)?.style.animationDelay).toBe("-1.2s");
    const cinnamonTile = container.querySelector('button[data-slot="-1"] .animate-ela-float');
    expect((cinnamonTile as HTMLElement)?.style.animationDelay).toBe("-6s");
  });

  it("layers all six scene photos with the active one pouring over the previous", () => {
    const { container } = renderWheel();
    const scene = container.querySelector(".ela-glass.z-10");
    expect(scene).not.toBeNull();
    const images = scene?.querySelectorAll("img") ?? [];
    expect(images.length).toBe(6);
    expect(images[0]?.className).toContain("z-[2]");
    expect(images[0]?.className).toContain("opacity-100");
    expect(images[1]?.className).toContain("z-0");
    expect(images[1]?.className).toContain("opacity-0");
    // After moving to flavour 2 the first photo stays underneath (z-1)
    // and the second pours in (z-2 + pour animation).
    const stage = screen.getByTestId("hero-stage");
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(images[0]?.className).toContain("z-[1]");
    expect(images[1]?.className).toContain("z-[2]");
    expect(images[1]?.className).toContain("animate-ela-pour");
  });

  it("announces the selected flavour in the sr-only live region", () => {
    renderWheel();
    const stage = screen.getByTestId("hero-stage");
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(screen.getByTestId("hero-live-region")).toHaveTextContent(
      "Salted Caramel selected, 195,000 T",
    );
  });

  it("shows the counter bars and the scroll cue", () => {
    const { container } = renderWheel();
    // Active bar w-6 bg-crema, the other five w-2 bg-cream/25.
    expect(container.querySelectorAll(".w-6.bg-crema").length).toBe(1);
    expect(container.querySelectorAll(".w-2.bg-cream\\/25").length).toBe(5);
    expect(screen.getByText("Scroll to taste")).toBeInTheDocument();
  });

  it("ArrowRight goes to the next flavour, ArrowLeft to the previous", () => {
    renderWheel();
    const stage = screen.getByTestId("hero-stage");
    fireEvent.keyDown(stage, { key: "ArrowRight" });
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Salted Caramel to your bag/ }),
    ).toBeInTheDocument();
    fireEvent.keyDown(stage, { key: "ArrowLeft" });
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("clicking a reachable tile jumps directly to that flavour", () => {
    const { container } = renderWheel();
    // Dark Mocha is index 4: the reachable tile at slot -2.
    const tile = container.querySelector('button[data-slot="-2"]');
    expect(tile).not.toBeNull();
    fireEvent.click(tile as HTMLElement);
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Dark Mocha to your bag/ })).toBeInTheDocument();
  });

  it("dragging left goes next, dragging right goes previous", () => {
    renderWheel();
    const stage = screen.getByTestId("hero-stage");
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 200 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 200 });
    expect(screen.getByText("02")).toBeInTheDocument();

    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 200, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 300 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 300 });
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("a short drag does not change the flavour", () => {
    renderWheel();
    const stage = screen.getByTestId("hero-stage");
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 300, button: 0 });
    fireEvent.pointerMove(stage, { pointerId: 1, clientX: 280 });
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 280 });
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("the price pill adds the current drink to the bag", () => {
    renderWheel();
    fireEvent.click(screen.getByRole("button", { name: /Add Ela Original to your bag/ }));
    expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 1 }]);
    // Two status regions announce the add: the toast (with a period)
    // and the hero's sr-only live region (without one).
    expect(screen.getByTestId("hero-live-region")).toHaveTextContent(
      "Ela Original added to your bag",
    );
    expect(
      screen
        .getAllByRole("status")
        .some((el) => el.textContent === "Ela Original added to your bag."),
    ).toBe(true);
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
        vi.advanceTimersByTime(1600);
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
        vi.advanceTimersByTime(1600);
      });
      expect(chip.querySelector(".lucide-shopping-bag")).not.toBeNull();
      fireEvent.click(chip);
      expect(useBag.getState().items).toEqual([{ drinkId: "ela-original", qty: 2 }]);
      expect(chip.querySelector(".lucide-check")).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(1600);
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
      const { container } = renderWheel();
      const chip = screen.getByRole("button", { name: /Add Ela Original to your bag/ });
      fireEvent.click(chip);
      expect(chip.querySelector(".lucide-check")).not.toBeNull();
      // Switch to Dark Mocha via its reachable tile: the check must
      // not leak over.
      const tile = container.querySelector('button[data-slot="-2"]');
      fireEvent.click(tile as HTMLElement);
      const mochaChip = screen.getByRole("button", { name: /Add Dark Mocha to your bag/ });
      expect(mochaChip.querySelector(".lucide-shopping-bag")).not.toBeNull();
      expect(mochaChip.querySelector(".lucide-check")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not capture the pointer on pointerdown — only once a drag starts", () => {
    renderWheel();
    const stage = screen.getByTestId("hero-stage");
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

  it("places the tile wheel above the cup photo (z-20 over the z-10 scene)", () => {
    const { container } = renderWheel();
    // The wheel group sits above the scene frame, like the reference.
    const wheel = container.querySelector('[role="group"][aria-label="Flavors"]');
    expect(wheel).not.toBeNull();
    expect(wheel?.className).toContain("z-20");
    expect(wheel?.querySelectorAll("button[data-slot]").length).toBe(15);
    const scene = container.querySelector(".ela-glass.z-10");
    expect(scene).not.toBeNull();
    // Audit §3.5 frame: a 16:9 box anchored at --scene-top, not full-bleed.
    expect(scene?.className).toContain("top-(--scene-top)");
    expect(scene?.className).toContain("h-(--s)");
    expect(scene?.className).toContain("w-(--scene-w)");
  });

  it("marks the hero scene image priority so it preloads for LCP", () => {
    const { container } = renderWheel();
    const sceneImgs = container.querySelectorAll(".ela-glass.z-10 img");
    expect(sceneImgs.length).toBe(6);
    expect(sceneImgs[0]?.getAttribute("data-priority")).toBe("true");
    // The reference's sizes hint for the scene frame.
    expect(sceneImgs[0]?.getAttribute("sizes")).toContain("180vh");
    expect(sceneImgs[1]?.getAttribute("data-priority")).toBeNull();
  });

  it("sizes the tile images from the transparent cut-outs (hero cutout fix)", () => {
    const { container } = renderWheel();
    const wheel = container.querySelector('[role="group"][aria-label="Flavors"]');
    const tileImgs = wheel?.querySelectorAll("img") ?? [];
    expect(tileImgs.length).toBe(15);
    // The tiles no longer render the sprite sheet (its cream cell
    // showed as a white square on the dark hero); each tile renders
    // its drink's transparent cut-out instead, with the reference's
    // sizes hint kept. 15 slots wrap 6 drinks, so every cut-out
    // appears at least twice.
    const cutouts = new Set(Array.from(tileImgs).map((img) => img.getAttribute("src")));
    expect(cutouts.size).toBe(6);
    for (const img of Array.from(tileImgs)) {
      expect(img.getAttribute("sizes")).toBe("(max-width: 639px) 320px, 800px");
      expect(img.getAttribute("src")).toMatch(/^\/images\/cutouts\/[a-z-]+\.webp$/);
    }
  });

  it("exposes the hero section as the labelled region; the stage itself is not focusable", () => {
    const { container } = renderWheel();
    // The reference's structure: <section aria-labelledby="hero-title">
    // is the region; the stage div carries the pointer handlers and no
    // role/tabindex, and arrows are handled at window level.
    const region = screen.getByRole("region", { name: "Choose your coffee" });
    expect(region.tagName).toBe("SECTION");
    const stage = container.querySelector(".ela-stage");
    expect(stage).not.toBeNull();
    expect(stage?.getAttribute("tabindex")).toBeNull();
    expect(stage?.getAttribute("role")).toBeNull();
  });
});
