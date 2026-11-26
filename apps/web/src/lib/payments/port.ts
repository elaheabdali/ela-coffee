/**
 * PaymentPort — the only interface checkout knows (architecture §9).
 *
 * - MockPayment is the default: simulates authority + verify with a
 *   small delay, no network, no real money.
 * - ZarinpalPayment talks to the REAL Zarinpal gateway behind the
 *   same interface, sandbox-first: enabled with
 *   PAYMENT_PROVIDER=zarinpal + ZARINPAL_MERCHANT_ID, and
 *   ZARINPAL_SANDBOX=false switches it to production (config-only).
 *   The sandbox accepts any UUID as merchant ID and moves no real
 *   money — see docs/zarinpal-setup.md.
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
 * Zarinpal provider (real gateway, sandbox-first).
 *
 * Zarinpal amounts are in RIAL, while the app works in Toman:
 * amountRial = amountToman * 10. Endpoints (paths are identical in
 * both environments; only the host changes):
 * - request: POST {base}/pg/v4/payment/request.json
 * - verify:  POST {base}/pg/v4/payment/verify.json
 * - pay page: {startPayBase}/pg/StartPay/{authority}
 *
 * Which host is used comes from env, in this order:
 * 1. ZARINPAL_BASE_URL, when set, wins outright (escape hatch).
 * 2. ZARINPAL_SANDBOX — "false" selects production, anything else
 *    (including unset) selects the sandbox. Sandbox-first is
 *    deliberate: a missing flag can never silently point at live
 *    payments.
 *    - sandbox:    https://sandbox.zarinpal.com (API + StartPay)
 *    - production: https://payment.zarinpal.com (API) and
 *      https://www.zarinpal.com (StartPay)
 *
 * The sandbox accepts ANY UUID as the merchant ID and moves no real
 * money — the configured test UUID in .env.example is a placeholder,
 * not a credential. Switching to live later is config-only: put the
 * real merchant ID from the Zarinpal panel in ZARINPAL_MERCHANT_ID
 * and set ZARINPAL_SANDBOX=false. No code change. See
 * docs/zarinpal-setup.md.
 */
const ZARINPAL_SANDBOX_HOST = "https://sandbox.zarinpal.com";
const ZARINPAL_PRODUCTION_HOST = "https://payment.zarinpal.com";

/** Sandbox unless explicitly switched off. */
function isZarinpalSandbox(): boolean {
  return process.env.ZARINPAL_SANDBOX !== "false";
}

function zarinpalBaseUrl(): string {
  if (process.env.ZARINPAL_BASE_URL) return process.env.ZARINPAL_BASE_URL;
  return isZarinpalSandbox() ? ZARINPAL_SANDBOX_HOST : ZARINPAL_PRODUCTION_HOST;
}

/**
 * StartPay host: the sandbox serves API and StartPay from the same
 * host, but in production the payment page lives on www.zarinpal.com
 * while the API lives on payment.zarinpal.com (Zarinpal docs).
 */
function zarinpalStartPayBaseUrl(): string {
  return zarinpalBaseUrl() === ZARINPAL_PRODUCTION_HOST
    ? "https://www.zarinpal.com"
    : zarinpalBaseUrl();
}

export class ZarinpalPayment implements PaymentPort {
  private readonly merchantId: string;

  constructor(merchantId: string) {
    if (!merchantId) {
      throw new Error("ZARINPAL_MERCHANT_ID is required for the Zarinpal provider.");
    }
    this.merchantId = merchantId;
  }

  async createPayment(order: OrderDTO): Promise<PaymentResult> {
    const baseUrl = zarinpalBaseUrl();
    const response = await fetch(`${baseUrl}/pg/v4/payment/request.json`, {
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
    return { authority, url: `${zarinpalStartPayBaseUrl()}/pg/StartPay/${authority}` };
  }

  async verifyPayment(authority: string, amountToman: number): Promise<VerifyResult> {
    const response = await fetch(`${zarinpalBaseUrl()}/pg/v4/payment/verify.json`, {
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
