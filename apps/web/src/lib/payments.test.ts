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
  items: [{ id: "item-1", drinkId: "ela-caramel", qty: 2, priceToman: 195_000 }],
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

describe("ZarinpalPayment (mocked fetch — no network, no credentials)", () => {
  function mockFetchResponse(body: unknown, ok = true): void {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok,
      json: async () => body,
    } as Response);
  }

  it("requests in Rial (Toman x10) and returns the sandbox StartPay URL on code 100", async () => {
    mockFetchResponse({
      data: { code: 100, authority: "S000000000000000000000000000000111111", message: "Success" },
    });
    const provider = new ZarinpalPayment("test-merchant-id");
    const payment = await provider.createPayment(order);

    expect(payment.authority).toBe("S000000000000000000000000000000111111");
    expect(payment.url).toBe(
      "https://sandbox.zarinpal.com/pg/StartPay/S000000000000000000000000000000111111",
    );
    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, { body: string }];
    expect(url).toBe("https://sandbox.zarinpal.com/pg/v4/payment/request.json");
    const body = JSON.parse(init.body) as { amount: number; merchant_id: string };
    // 390,000 Toman → 3,900,000 Rial: Zarinpal wants Rial.
    expect(body.amount).toBe(3_900_000);
    expect(body.merchant_id).toBe("test-merchant-id");
  });

  it("throws when the request is rejected (code != 100)", async () => {
    mockFetchResponse({
      data: { code: -9, message: "Validation error" },
      errors: { code: -9, message: "Validation error" },
    });
    const provider = new ZarinpalPayment("test-merchant-id");
    await expect(provider.createPayment(order)).rejects.toThrow("Zarinpal request failed");
  });

  it("verifies code 100 and 101 as paid, with the ref id", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = new ZarinpalPayment("test-merchant-id");
    for (const code of [100, 101]) {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { code, ref_id: 987654321, message: "Success" } }),
      } as Response);
      const result = await provider.verifyPayment("S000000000000000000000000000000111111", 390_000);
      expect(result.verified).toBe(true);
      expect(result.refId).toBe("987654321");
      const calls = fetchSpy.mock.calls;
      const [, init] = calls[calls.length - 1] as [string, { body: string }];
      // Verify also sends Rial, from the same server-side total.
      expect((JSON.parse(init.body) as { amount: number }).amount).toBe(3_900_000);
    }
  });

  it("reports a failed verify code as not verified", async () => {
    mockFetchResponse({ data: { code: -51, message: "Transaction not found" } }, false);
    const provider = new ZarinpalPayment("test-merchant-id");
    const result = await provider.verifyPayment("S000000000000000000000000000000111111", 390_000);
    expect(result.verified).toBe(false);
    expect(result.refId).toBe("");
  });

  it("honours ZARINPAL_BASE_URL for the production host (config, not code)", async () => {
    process.env.ZARINPAL_BASE_URL = "https://payment.zarinpal.com";
    mockFetchResponse({
      data: { code: 100, authority: "A000000000000000000000000000000111111" },
    });
    const provider = new ZarinpalPayment("test-merchant-id");
    const payment = await provider.createPayment(order);
    // Production API host, but the payment page is www.zarinpal.com.
    expect(payment.url).toBe(
      "https://www.zarinpal.com/pg/StartPay/A000000000000000000000000000000111111",
    );
  });

  it("selects production hosts with ZARINPAL_SANDBOX=false (the live switch)", async () => {
    process.env.ZARINPAL_SANDBOX = "false";
    mockFetchResponse({
      data: { code: 100, authority: "A000000000000000000000000000000111111" },
    });
    const provider = new ZarinpalPayment("test-merchant-id");
    const payment = await provider.createPayment(order);
    const [url] = vi.mocked(globalThis.fetch).mock.calls[0] as [string];
    expect(url).toBe("https://payment.zarinpal.com/pg/v4/payment/request.json");
    expect(payment.url).toBe(
      "https://www.zarinpal.com/pg/StartPay/A000000000000000000000000000000111111",
    );
  });

  it("stays on the sandbox when ZARINPAL_SANDBOX is unset or 'true'", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const provider = new ZarinpalPayment("test-merchant-id");
    for (const value of [undefined, "true"]) {
      if (value === undefined) delete process.env.ZARINPAL_SANDBOX;
      else process.env.ZARINPAL_SANDBOX = value;
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { code: 100, authority: "S000000000000000000000000000000111111" },
        }),
      } as Response);
      const payment = await provider.createPayment(order);
      expect(payment.url).toBe(
        "https://sandbox.zarinpal.com/pg/StartPay/S000000000000000000000000000000111111",
      );
    }
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
