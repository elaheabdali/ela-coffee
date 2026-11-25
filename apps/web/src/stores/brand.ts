import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRANDS, type Brand } from "@/data/flavours";
import { useFlavour } from "./flavour";
import { jsonStorage } from "./storage";

/** Preload every image of a brand (scenes + cut-outs) into the browser cache. */
function preloadBrandAssets(brand: Brand): void {
  if (typeof window === "undefined" || typeof Image === "undefined") return;
  const data = BRANDS[brand];
  for (const src of [
    ...data.drinks.map((d) => d.image),
    ...data.cutouts.map((c) => c.src),
    data.story.image,
    ...data.process.steps.flatMap((s) => (s.image ? [s.image] : [])),
  ]) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

interface BrandState {
  brand: Brand;
  /** Apply the current brand to <html> without the switch animation. */
  applyBrand: () => void;
  /** Switch brand: .6s colour transition, reset flavour, preload the other brand. */
  setBrand: (next: Brand) => void;
}

/**
 * Coffee / Matcha brand. The whole theme follows from the single
 * `html[data-brand]` attribute (audit §1: brand is client-side state,
 * not a route). Persisted, so a reload keeps the chosen brand.
 *
 * Preloading fixes the reference's black-square bug (audit §8.4): when
 * the user switches brand, the other brand's scenes are already in the
 * browser cache, so no tile ever renders empty.
 */
export const useBrand = create<BrandState>()(
  persist(
    (set, get) => ({
      brand: "ela",
      applyBrand: () => {
        if (typeof document === "undefined") return;
        document.documentElement.setAttribute("data-brand", get().brand);
      },
      setBrand: (next) => {
        if (typeof document === "undefined") return;
        if (get().brand === next) return;
        const root = document.documentElement;
        // .6s colour transition while the attribute is set (audit §3.2/§4).
        root.setAttribute("data-brand-switching", "");
        root.setAttribute("data-brand", next);
        window.setTimeout(() => root.removeAttribute("data-brand-switching"), 600);
        set({ brand: next });
        // A new brand starts at its first flavour.
        useFlavour.getState().setIndex(0);
        // Warm the cache for the brand we just left, so switching back
        // is instant too.
        preloadBrandAssets(next === "ela" ? "midori" : "ela");
      },
    }),
    {
      name: "ela-coffee-brand",
      storage: jsonStorage(),
      partialize: (state) => ({ brand: state.brand }) as BrandState,
      version: 1,
      // Phase 12 rebrand (Kuro → Ela): a browser that persisted the old
      // brand "kuro" before the rebrand would rehydrate to a brand that
      // no longer exists in BRANDS, and every section reads
      // BRANDS[brand] — so map it forward instead of crashing.
      migrate: (persisted) => {
        const state = persisted as { brand?: unknown } | undefined;
        if (state && state.brand === "kuro") return { ...state, brand: "ela" } as BrandState;
        return (persisted ?? {}) as BrandState;
      },
      // After rehydration on the client, sync the persisted brand to
      // <html> (the layout hardcodes data-brand="ela" for SSR).
      onRehydrateStorage: () => (state) => {
        state?.applyBrand();
      },
    },
  ),
);

/** Warm the cache for both brands (called once, e.g. on first idle). */
export function preloadAllBrandAssets(): void {
  preloadBrandAssets("ela");
  preloadBrandAssets("midori");
}
