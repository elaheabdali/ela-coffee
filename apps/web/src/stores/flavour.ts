import { create } from "zustand";

export const FLAVOUR_COUNT = 6;

interface FlavourState {
  /** Index of the current flavour within the active brand (0–5). */
  index: number;
  setIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
  /** Jump to a random flavour that is not the current one. */
  surprise: () => void;
}

/** Normalise any integer into the 0–5 flavour range (the wheel loops). */
function wrap(index: number): number {
  return ((index % FLAVOUR_COUNT) + FLAVOUR_COUNT) % FLAVOUR_COUNT;
}

/**
 * The wheel's flavour index. There is exactly one index (audit §6:
 * "flavour index derived from scroll/drag, not duplicated in two
 * stores") — the wheel, the flavour buttons, the dialogs and the
 * scroll-linked progression all read and write this store.
 */
export const useFlavour = create<FlavourState>()((set, get) => ({
  index: 0,
  setIndex: (index) => set({ index: wrap(index) }),
  next: () => set({ index: wrap(get().index + 1) }),
  prev: () => set({ index: wrap(get().index - 1) }),
  surprise: () => {
    const current = get().index;
    let next = current;
    while (next === current) {
      next = Math.floor(Math.random() * FLAVOUR_COUNT);
    }
    set({ index: next });
  },
}));
