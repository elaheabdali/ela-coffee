/**
 * PaymentPort — the only interface checkout knows (architecture §9).
 *
 * - MockPayment is the default: simulates authority + verify with a
 *   small delay, no network, no real money.
 * - ZarinpalPayment talks to the Zarinpal sandbox REST API behind the
 *   same interface, enabled only with PAYMENT_PROVIDER=zarinpal +
 *   ZARINPAL_MERCHANT_ID.
 *
 * NEVER store card data: the app never sees a card number. The user
 * pays on Zarinpal's page and returns with an authority code; the app
 * only stores the authority, the amount and the verification result.
 * Amounts are Toman integers, validated server-side against the data
 * layer — the client-submitted total is never trusted.
 */
import type { OrderDTO } from "../types";

export interface PaymentResult {
  authority: string;
  /** URL the customer is redirected to in order to pay. */
  url: string;
}

export interface VerifyResult {
  authority: string;
  /** Zarinpal ref id (or the mock equivalent). */
  refId: string;
  verified: boolean;
}

export interface PaymentPort {
  createPayment(order: OrderDTO): Promise<PaymentResult>;
  verifyPayment(authority: string, amountToman: number): Promise<VerifyResult>;
}

/** Small delay helper for the mock (simulates gateway latency). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock provider (default). The authority encodes the order id so
 * verify can resolve it without any stored state:
 * `mock_<orderId>_<random>`.
 */
export class MockPayment implements PaymentPort {
  async createPayment(order: OrderDTO): Promise<PaymentResult> {
    await delay(150);
    const authority = `mock_${order.id}_${Math.random().toString(36).slice(2, 10)}`;
    return { authority, url: `/payment/mock?authority=${authority}` };
  }

  async verifyPayment(authority: string, amountToman: number): Promise<VerifyResult> {
    await delay(150);
    if (!authority.startsWith("mock_") || amountToman <= 0) {
      return { authority, refId: "", verified: false };
    }
    return { authority, refId: `mock-ref-${authority.slice(5, 13)}`, verified: true };
  }
}

/**
 * Zarinpal sandbox provider.
 *
 * Zarinpal amounts are in RIAL, while the app works in Toman:
 * amountRial = amountToman * 10. Sandbox endpoints:
 * - request: POST https://sandbox.zarinpal.com/pg/v4/payment/request.json
 * - verify:  POST https://sandbox.zarinpal.com/pg/v4/payment/verify.json
 * - pay page: https://sandbox.zarinpal.com/pg/StartPay/{authority}
 */
const ZARINPAL_SANDBOX = "https://sandbox.zarinpal.com";

export class ZarinpalPayment implements PaymentPort {
  private readonly merchantId: string;

  constructor(merchantId: string) {
    if (!merchantId) {
      throw new Error("ZARINPAL_MERCHANT_ID is required for the Zarinpal provider.");
    }
    this.merchantId = merchantId;
  }

  async createPayment(order: OrderDTO): Promise<PaymentResult> {
    const response = await fetch(`${ZARINPAL_SANDBOX}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: order.totalToman * 10, // Toman → Rial
        description: `Ela Coffee order ${order.id}`,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/payments/callback`,
        metadata: { order_id: order.id, mobile: order.phone },
      }),
    });
    const data = (await response.json()) as {
      data?: { code?: number; authority?: string; message?: string };
      errors?: { code?: number; message?: string };
    };
    const authority = data.data?.authority;
    if (!response.ok || data.data?.code !== 100 || !authority) {
      throw new Error(
        `Zarinpal request failed: ${data.data?.message ?? data.errors?.message ?? response.status}`,
      );
    }
    return { authority, url: `${ZARINPAL_SANDBOX}/pg/StartPay/${authority}` };
  }

  async verifyPayment(authority: string, amountToman: number): Promise<VerifyResult> {
    const response = await fetch(`${ZARINPAL_SANDBOX}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: amountToman * 10, // Toman → Rial
        authority,
      }),
    });
    const data = (await response.json()) as {
      data?: { code?: number; ref_id?: number; message?: string };
      errors?: { code?: number; message?: string };
    };
    const verified = response.ok && (data.data?.code === 100 || data.data?.code === 101);
    return {
      authority,
      refId: verified && data.data?.ref_id ? String(data.data.ref_id) : "",
      verified,
    };
  }
}

/** Factory — reads env once per call so tests can switch providers. */
export function getPaymentProvider(): PaymentPort {
  const provider = process.env.PAYMENT_PROVIDER ?? "mock";
  if (provider === "zarinpal") {
    return new ZarinpalPayment(process.env.ZARINPAL_MERCHANT_ID ?? "");
  }
  if (provider !== "mock") {
    throw new Error(`Unknown PAYMENT_PROVIDER: ${provider} (expected "mock" or "zarinpal").`);
  }
  return new MockPayment();
}
