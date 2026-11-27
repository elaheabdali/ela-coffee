/**
 * handlePaymentCallback tests (batch 9, item 6). No network, no HTTP:
 * the handler is driven with a fake in-memory order map and a fake
 * provider, so every branch — including the Zarinpal verify codes —
 * is covered without credentials.
 */
import { describe, expect, it, vi } from "vitest";
import { handlePaymentCallback } from "@/lib/payments/callback";
import type { PaymentPort, VerifyResult } from "@/lib/payments/port";
import type { OrderDTO, PaymentStatus } from "@/lib/types";

function makeOrder(overrides: Partial<OrderDTO> = {}): OrderDTO {
  return {
    id: "order-1",
    status: "RECEIVED",
    items: [{ id: "item-1", drinkId: "ela-original", qty: 1, priceToman: 180_000 }],
    customerName: "Test Taster",
    phone: "09123456789",
    totalToman: 180_000,
    payment: "PENDING",
    paymentAuthority: "S000000000000000000000000000000111111",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

interface FakeStore {
  orders: Map<string, OrderDTO>;
  updates: { id: string; payment: PaymentStatus }[];
}

function makeStore(order: OrderDTO | null): FakeStore {
  const orders = new Map<string, OrderDTO>();
  if (order?.paymentAuthority) orders.set(order.paymentAuthority, order);
  return { orders, updates: [] };
}

function makeProvider(
  verifyResult: VerifyResult,
): PaymentPort & { calls: { authority: string; amount: number }[] } {
  const calls: { authority: string; amount: number }[] = [];
  return {
    calls,
    createPayment: async () => ({ authority: "unused", url: "https://example.invalid/pay" }),
    verifyPayment: vi.fn(async (authority: string, amountToman: number) => {
      calls.push({ authority, amount: amountToman });
      return verifyResult;
    }),
  };
}

function makeDeps(store: FakeStore, provider: PaymentPort) {
  return {
    findOrderByAuthority: async (authority: string) => store.orders.get(authority) ?? null,
    updatePayment: async (id: string, payment: PaymentStatus, authority: string | null) => {
      store.updates.push({ id, payment });
      const order = [...store.orders.values()].find((o) => o.id === id);
      if (!order) return null;
      const updated = { ...order, payment, paymentAuthority: authority };
      store.orders.set(authority ?? order.paymentAuthority ?? "", updated);
      return updated;
    },
    provider,
  };
}

describe("handlePaymentCallback", () => {
  it("verifies Status=OK with the gateway and marks the order PAID", async () => {
    const order = makeOrder();
    const store = makeStore(order);
    const provider = makeProvider({
      authority: order.paymentAuthority ?? "",
      refId: "123456789",
      verified: true,
    });
    const result = await handlePaymentCallback(
      { authority: order.paymentAuthority, status: "OK" },
      makeDeps(store, provider),
    );
    expect(result).toEqual({ outcome: "paid", orderId: "order-1", refId: "123456789" });
    expect(store.updates).toEqual([{ id: "order-1", payment: "PAID" }]);
  });

  it("verifies with the SERVER-side order total, never a client value", async () => {
    const order = makeOrder({ totalToman: 390_000 });
    const store = makeStore(order);
    const provider = makeProvider({
      authority: order.paymentAuthority ?? "",
      refId: "1",
      verified: true,
    });
    await handlePaymentCallback(
      { authority: order.paymentAuthority, status: "OK" },
      makeDeps(store, provider),
    );
    // The amount sent to the gateway is the stored order total
    // (390,000 Toman → the port converts to Rial); no amount arrives
    // in the callback query at all, so nothing client-supplied can
    // leak in.
    expect(provider.calls).toEqual([{ authority: order.paymentAuthority, amount: 390_000 }]);
  });

  it("marks the order FAILED when the gateway rejects the verify", async () => {
    const order = makeOrder();
    const store = makeStore(order);
    const provider = makeProvider({
      authority: order.paymentAuthority ?? "",
      refId: "",
      verified: false,
    });
    const result = await handlePaymentCallback(
      { authority: order.paymentAuthority, status: "OK" },
      makeDeps(store, provider),
    );
    expect(result).toEqual({ outcome: "failed", orderId: "order-1", refId: null });
    expect(store.updates).toEqual([{ id: "order-1", payment: "FAILED" }]);
  });

  it("marks the order FAILED on Status=NOK without calling verify", async () => {
    const order = makeOrder();
    const store = makeStore(order);
    const provider = makeProvider({
      authority: order.paymentAuthority ?? "",
      refId: "1",
      verified: true,
    });
    const result = await handlePaymentCallback(
      { authority: order.paymentAuthority, status: "NOK" },
      makeDeps(store, provider),
    );
    expect(result).toEqual({ outcome: "failed", orderId: "order-1", refId: null });
    expect(store.updates).toEqual([{ id: "order-1", payment: "FAILED" }]);
    expect(provider.calls).toEqual([]);
  });

  it("returns paid without a second verify for an already-PAID order (idempotent replay)", async () => {
    const order = makeOrder({ payment: "PAID" });
    const store = makeStore(order);
    const provider = makeProvider({
      authority: order.paymentAuthority ?? "",
      refId: "1",
      verified: true,
    });
    const result = await handlePaymentCallback(
      { authority: order.paymentAuthority, status: "OK" },
      makeDeps(store, provider),
    );
    expect(result).toEqual({ outcome: "paid", orderId: "order-1", refId: null });
    expect(store.updates).toEqual([]);
    expect(provider.calls).toEqual([]);
  });

  it("returns not-found for an unknown authority and updates nothing", async () => {
    const store = makeStore(makeOrder());
    const provider = makeProvider({
      authority: "unknown",
      refId: "",
      verified: false,
    });
    const result = await handlePaymentCallback(
      { authority: "S000000000000000000000000000000999999", status: "OK" },
      makeDeps(store, provider),
    );
    expect(result).toEqual({ outcome: "not-found", orderId: null, refId: null });
    expect(store.updates).toEqual([]);
    expect(provider.calls).toEqual([]);
  });

  it("returns failed for a missing authority and updates nothing", async () => {
    const store = makeStore(makeOrder());
    const provider = makeProvider({
      authority: "",
      refId: "",
      verified: false,
    });
    const result = await handlePaymentCallback(
      { authority: null, status: "OK" },
      makeDeps(store, provider),
    );
    expect(result).toEqual({ outcome: "failed", orderId: null, refId: null });
    expect(store.updates).toEqual([]);
    expect(provider.calls).toEqual([]);
  });

  it("also fails a missing Status (no verify call)", async () => {
    const order = makeOrder();
    const store = makeStore(order);
    const provider = makeProvider({
      authority: order.paymentAuthority ?? "",
      refId: "1",
      verified: true,
    });
    const result = await handlePaymentCallback(
      { authority: order.paymentAuthority, status: null },
      makeDeps(store, provider),
    );
    expect(result).toEqual({ outcome: "failed", orderId: "order-1", refId: null });
    expect(store.updates).toEqual([{ id: "order-1", payment: "FAILED" }]);
    expect(provider.calls).toEqual([]);
  });
});
