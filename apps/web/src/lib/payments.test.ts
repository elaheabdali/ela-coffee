/**
 * PaymentPort tests (Phase 6). Mock mode never makes a network call;
 * Zarinpal mode is only constructed with a merchant id.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { MockPayment, ZarinpalPayment, getPaymentProvider } from "@/lib/payments/port";
import type { OrderDTO } from "@/lib/types";

const order: OrderDTO = {
  id: "order-1",
  status: "RECEIVED",
  items: [{ id: "item-1", drinkId: "kuro-caramel", qty: 2, priceToman: 195_000 }],
  customerName: "Test Taster",
  phone: "09123456789",
  totalToman: 390_000,
  payment: "PENDING",
  paymentAuthority: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("MockPayment", () => {
  it("creates an authority and verifies it (round-trip, no network)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mock = new MockPayment();
    const payment = await mock.createPayment(order);
    expect(payment.authority).toMatch(/^mock_order-1_/);
    expect(payment.url).toContain(payment.authority);

    const result = await mock.verifyPayment(payment.authority, order.totalToman);
    expect(result.verified).toBe(true);
    expect(result.refId).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a foreign authority and a non-positive amount", async () => {
    const mock = new MockPayment();
    expect((await mock.verifyPayment("not-a-mock-authority", 100)).verified).toBe(false);
    const payment = await mock.createPayment(order);
    expect((await mock.verifyPayment(payment.authority, 0)).verified).toBe(false);
  });
});

describe("getPaymentProvider", () => {
  it("defaults to MockPayment", () => {
    delete process.env.PAYMENT_PROVIDER;
    expect(getPaymentProvider()).toBeInstanceOf(MockPayment);
  });

  it("throws for Zarinpal without a merchant id", () => {
    process.env.PAYMENT_PROVIDER = "zarinpal";
    delete process.env.ZARINPAL_MERCHANT_ID;
    expect(() => getPaymentProvider()).toThrow("ZARINPAL_MERCHANT_ID");
  });

  it("constructs ZarinpalPayment with a merchant id (no network call)", () => {
    process.env.PAYMENT_PROVIDER = "zarinpal";
    process.env.ZARINPAL_MERCHANT_ID = "test-merchant";
    expect(getPaymentProvider()).toBeInstanceOf(ZarinpalPayment);
  });

  it("throws for an unknown provider", () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    expect(() => getPaymentProvider()).toThrow("Unknown PAYMENT_PROVIDER");
  });
});
