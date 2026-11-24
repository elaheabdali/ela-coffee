"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@ela-coffee/ui";

/**
 * The bag's feedback hook: shows the reference's toast
 * ("<Name> added to your bag.", audit §2) via the design-system
 * `ToastProvider`. Every add-to-bag action (hero pill, menu cards)
 * calls `notifyAdded` — the toast text is built from the `bag.added`
 * dictionary string so fa/en stay correct.
 */
export function useBagToast() {
  const { showToast } = useToast();
  const tBag = useTranslations("bag");

  const notifyAdded = useCallback(
    (drinkName: string) => {
      showToast(`${drinkName} ${tBag("added")}`);
    },
    [showToast, tBag],
  );

  return { notifyAdded };
}
