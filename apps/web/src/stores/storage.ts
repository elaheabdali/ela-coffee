import { createJSONStorage, type StateStorage } from "zustand/middleware";

/**
 * localStorage wrapper that is a no-op on the server: the stores are
 * created during SSR (client components render on the server too), and
 * touching `window.localStorage` there would throw. On the client it is
 * plain localStorage, so the bag / brand / motion survive reloads.
 */
export const ssrSafeStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

/** Persist helper shared by the stores: JSON over the SSR-safe storage. */
export const jsonStorage = () => createJSONStorage(() => ssrSafeStorage);
