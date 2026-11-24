import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { useBag, bagCount, bagSubtotal } from "./bag";
import { useBrand } from "./brand";
import { useFlavour } from "./flavour";
import { useMotion } from "./motion";

function resetStores() {
  window.localStorage.clear();
  useBrand.setState({ brand: "kuro" });
  useMotion.setState({ paused: false });
  useBag.setState({ items: [], isOpen: false });
  useFlavour.setState({ index: 0 });
  const root = document.documentElement;
  root.removeAttribute("data-brand");
  root.removeAttribute("data-brand-switching");
  root.removeAttribute("data-motion");
}

beforeEach(() => {
  resetStores();
});

describe("useBrand", () => {
  it("switches html[data-brand] with the .6s switching attribute, then clears it", async () => {
    act(() => {
      useBrand.getState().setBrand("midori");
    });
    expect(document.documentElement.getAttribute("data-brand")).toBe("midori");
    expect(document.documentElement.hasAttribute("data-brand-switching")).toBe(true);
    expect(useBrand.getState().brand).toBe("midori");

    await new Promise((resolve) => setTimeout(resolve, 650));
    expect(document.documentElement.hasAttribute("data-brand-switching")).toBe(false);
  });

  it("resets the flavour index on brand switch", () => {
    act(() => {
      useFlavour.getState().setIndex(4);
      useBrand.getState().setBrand("midori");
    });
    expect(useFlavour.getState().index).toBe(0);
  });

  it("applyBrand writes the current brand to <html>", () => {
    act(() => {
      useBrand.setState({ brand: "midori" });
      useBrand.getState().applyBrand();
    });
    expect(document.documentElement.getAttribute("data-brand")).toBe("midori");
  });
});

describe("useMotion", () => {
  it("toggles html[data-motion=paused]", () => {
    act(() => {
      useMotion.getState().toggle();
    });
    expect(document.documentElement.getAttribute("data-motion")).toBe("paused");
    expect(useMotion.getState().paused).toBe(true);
    act(() => {
      useMotion.getState().toggle();
    });
    expect(document.documentElement.hasAttribute("data-motion")).toBe(false);
  });
});

describe("useBag", () => {
  it("adds drinks, increments quantity, and counts items", () => {
    act(() => {
      useBag.getState().add("kuro-original");
      useBag.getState().add("kuro-original");
      useBag.getState().add("kuro-caramel");
    });
    expect(useBag.getState().items).toEqual([
      { drinkId: "kuro-original", qty: 2 },
      { drinkId: "kuro-caramel", qty: 1 },
    ]);
    expect(bagCount(useBag.getState().items)).toBe(3);
  });

  it("computes the subtotal from dataset prices, never a client total", () => {
    // Kuro Original 180,000 + Salted Caramel 195,000 x2.
    act(() => {
      useBag.getState().add("kuro-original");
      useBag.getState().add("kuro-caramel");
      useBag.getState().add("kuro-caramel");
    });
    expect(bagSubtotal(useBag.getState().items)).toBe(180_000 + 195_000 * 2);
    expect(bagSubtotal([])).toBe(0);
  });

  it("setQty to 0 removes the line, and clear empties the bag", () => {
    act(() => {
      useBag.getState().add("kuro-original");
      useBag.getState().add("kuro-mocha");
      useBag.getState().setQty("kuro-original", 0);
    });
    expect(useBag.getState().items).toEqual([{ drinkId: "kuro-mocha", qty: 1 }]);
    act(() => {
      useBag.getState().clear();
    });
    expect(useBag.getState().items).toEqual([]);
  });

  it("opens and closes the drawer flag", () => {
    act(() => {
      useBag.getState().openBag();
    });
    expect(useBag.getState().isOpen).toBe(true);
    act(() => {
      useBag.getState().closeBag();
    });
    expect(useBag.getState().isOpen).toBe(false);
  });
});

describe("useFlavour", () => {
  it("wraps next/prev around the 6 flavours (the wheel loops)", () => {
    act(() => {
      useFlavour.getState().setIndex(5);
      useFlavour.getState().next();
    });
    expect(useFlavour.getState().index).toBe(0);
    act(() => {
      useFlavour.getState().prev();
    });
    expect(useFlavour.getState().index).toBe(5);
  });

  it("normalises out-of-range indices", () => {
    act(() => {
      useFlavour.getState().setIndex(8);
    });
    expect(useFlavour.getState().index).toBe(2);
    act(() => {
      useFlavour.getState().setIndex(-1);
    });
    expect(useFlavour.getState().index).toBe(5);
  });

  it("surprise always lands on a different flavour", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    act(() => {
      useFlavour.getState().setIndex(0);
      useFlavour.getState().surprise();
    });
    expect(useFlavour.getState().index).toBe(5);
    vi.restoreAllMocks();
  });
});
