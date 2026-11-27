/**
 * OrderStatus bag-clearing tests (bag-clear fix, 2026-11-27).
 *
 * The bag must be cleared on the payment success page once the order
 * is seen as PAID — and nowhere else: a PENDING order (cancelled or
 * abandoned payment) keeps the bag so the customer can retry, and
 * the drawer tracking view (no prop) never clears.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { en } from "@ela-coffee/i18n";
import { OrderStatus } from "@/components/OrderStatus";
import { useBag } from "@/stores/bag";
import type { OrderDTO } from "@/lib/types";

const baseOrder: OrderDTO = {
  id: "order-1",
  status: "RECEIVED",
  items: [{ id: "item-1", drinkId: "ela-original", qty: 1, priceToman: 180_000 }],
  customerName: "Test Taster",
  phone: "09123456789",
  totalToman: 180_000,
  payment: "PAID",
  paymentAuthority: "mock_order-1_x",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const originalFetch = globalThis.fetch;
const originalEventSource = globalThis.EventSource;

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  useBag.setState({ items: [] });
  // jsdom has no EventSource → the hook falls back to polling.
  delete (globalThis as unknown as { EventSource?: unknown }).EventSource;
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = originalFetch;
  globalThis.EventSource = originalEventSource;
  vi.restoreAllMocks();
});

function mockFetchOrder(order: OrderDTO) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ order }),
  }) as unknown as typeof fetch;
}

async function renderAndFlush(ui: React.ReactElement) {
  const result = render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  );
  // Flush the priming fetch + the first polling tick.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  return result;
}

describe("OrderStatus clearBagWhenPaid", () => {
  it("clears the bag once the order is seen as PAID", async () => {
    useBag.getState().add("ela-original");
    expect(useBag.getState().items).toHaveLength(1);
    mockFetchOrder(baseOrder);

    const { unmount } = await renderAndFlush(
      <OrderStatus orderId="order-1" clearBagWhenPaid />,
    );
    expect(useBag.getState().items).toHaveLength(0);
    unmount();
  });

  it("leaves the bag alone while the order is still PENDING", async () => {
    useBag.getState().add("ela-original");
    mockFetchOrder({ ...baseOrder, payment: "PENDING" });

    const { unmount } = await renderAndFlush(
      <OrderStatus orderId="order-1" clearBagWhenPaid />,
    );
    expect(useBag.getState().items).toHaveLength(1);
    unmount();
  });

  it("leaves the bag alone without the prop even when the order is PAID", async () => {
    useBag.getState().add("ela-original");
    mockFetchOrder(baseOrder);

    const { unmount } = await renderAndFlush(<OrderStatus orderId="order-1" />);
    expect(useBag.getState().items).toHaveLength(1);
    unmount();
  });
});
