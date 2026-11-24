import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_DRINKS } from "@/data/flavours";
import { jsonStorage } from "./storage";

export interface BagItem {
  drinkId: string;
  qty: number;
}

export type BagItems = BagItem[];

interface BagState {
  items: BagItems;
  /** Whether the bag drawer is open (shared by the header button and the drawer). */
  isOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  add: (drinkId: string) => void;
  setQty: (drinkId: string, qty: number) => void;
  remove: (drinkId: string) => void;
  clear: () => void;
}

/** Total number of drinks in the bag. */
export function bagCount(items: BagItems): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

/**
 * Bag subtotal in Toman, computed from the dataset prices — the
 * client-submitted total is never trusted (architecture §9); this is
 * UI-only for now, the server re-validates in Phase 6.
 */
export function bagSubtotal(items: BagItems): number {
  const byId = new Map(ALL_DRINKS.map((d) => [d.id, d.priceToman]));
  return items.reduce((sum, item) => sum + (byId.get(item.drinkId) ?? 0) * item.qty, 0);
}

/**
 * The bag is a local list only — exactly like the reference (audit §2):
 * no checkout, payment or delivery button exists anywhere in v1.
 * Items persist to localStorage; only the items are persisted, the
 * drawer-open flag is session-only.
 */
export const useBag = create<BagState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openBag: () => set({ isOpen: true }),
      closeBag: () => set({ isOpen: false }),
      add: (drinkId) => {
        const items = get().items;
        const existing = items.find((item) => item.drinkId === drinkId);
        set({
          items: existing
            ? items.map((item) =>
                item.drinkId === drinkId ? { ...item, qty: item.qty + 1 } : item,
              )
            : [...items, { drinkId, qty: 1 }],
        });
      },
      setQty: (drinkId, qty) => {
        if (qty <= 0) {
          get().remove(drinkId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.drinkId === drinkId ? { ...item, qty } : item,
          ),
        });
      },
      remove: (drinkId) => {
        set({ items: get().items.filter((item) => item.drinkId !== drinkId) });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "ela-coffee-bag",
      storage: jsonStorage(),
      partialize: (state) => ({ items: state.items }) as BagState,
    },
  ),
);
