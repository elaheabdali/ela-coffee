import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jsonStorage } from "./storage";

interface MotionState {
  /** True while the user paused floating motion. */
  paused: boolean;
  applyPaused: () => void;
  setPaused: (paused: boolean) => void;
  toggle: () => void;
}

/**
 * Motion pause. Mirrors the reference's `html[data-motion=paused]`
 * (audit §4): it pauses `ela-float`, `ela-marquee` and
 * `ela-scroll-cue` in globals.css. Persisted with the brand.
 */
export const useMotion = create<MotionState>()(
  persist(
    (set, get) => ({
      paused: false,
      applyPaused: () => {
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        if (get().paused) {
          root.setAttribute("data-motion", "paused");
        } else {
          root.removeAttribute("data-motion");
        }
      },
      setPaused: (paused) => {
        set({ paused });
        get().applyPaused();
      },
      toggle: () => {
        get().setPaused(!get().paused);
      },
    }),
    {
      name: "ela-coffee-motion",
      storage: jsonStorage(),
      partialize: (state) => ({ paused: state.paused }) as MotionState,
      onRehydrateStorage: () => (state) => {
        state?.applyPaused();
      },
    },
  ),
);
