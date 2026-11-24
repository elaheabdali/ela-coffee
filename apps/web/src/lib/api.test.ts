/**
 * Route-handler tests (Phase 6). All run WITHOUT a live database —
 * the seed-JSON/in-memory fallback is active (no DATABASE_URL in
 * this environment). Rate limits and the memory store are reset
 * between tests.
 */
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as menuGET } from "@/app/api/menu/route";
import { POST as newsletterPOST } from "@/app/api/newsletter/route";
import { GET as reservationsGET, POST as reservationsPOST } from "@/app/api/reservations/route";
import { POST as contactPOST } from "@/app/api/contact/route";
import { POST as ordersPOST } from "@/app/api/orders/route";
import { GET as orderGET } from "@/app/api/orders/[id]/route";
import { GET as eventsGET } from "@/app/api/orders/[id]/events/route";
import { resetMemoryStore } from "@/lib/memory-store";
import { resetRateLimits } from "@/lib/rate-limit";
import { updateOrderStatus } from "@/lib/store";

function jsonRequest(url: string, body: unknown, headers?: Record<string, string>): Request {
  // A browser always sends Origin on a fetch POST; the CSRF check
  // (lib/csrf.ts) requires it, so the helper sends the same-origin
  // value by default. Tests that need a foreign/missing origin pass
  // their own headers explicitly (see security.test.ts).
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://x", ...headers },
    body: JSON.stringify(body),
  });
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(() => {
  resetMemoryStore();
  resetRateLimits();
});

describe("GET /api/menu", () => {
  it("returns all 12 drinks from both brands", async () => {
    const response = await menuGET();
    expect(response.status).toBe(200);
    const data = (await readJson(response)) as { drinks: { id: string; brand: string }[] };
    expect(data.drinks).toHaveLength(12);
    expect(data.drinks.filter((d) => d.brand === "kuro")).toHaveLength(6);
    expect(data.drinks.filter((d) => d.brand === "midori")).toHaveLength(6);
    expect(data.drinks.find((d) => d.id === "kuro-original")?.brand).toBe("kuro");
  });
});

describe("POST /api/newsletter", () => {
  it("rejects an invalid email", async () => {
    const response = await newsletterPOST(
      jsonRequest("http://x/api/newsletter", { email: "nope" }),
    );
    expect(response.status).toBe(400);
    const data = await readJson(response);
    expect((data.error as { code: string }).code).toBe("VALIDATION_ERROR");
  });

  it("subscribes a valid email and answers duplicates identically", async () => {
    const first = await newsletterPOST(
      jsonRequest("http://x/api/newsletter", { email: "taster@example.com" }),
    );
    expect(first.status).toBe(200);
    expect(await readJson(first)).toEqual({ ok: true });

    const second = await newsletterPOST(
      jsonRequest("http://x/api/newsletter", { email: "taster@example.com" }),
    );
    expect(second.status).toBe(200);
    expect(await readJson(second)).toEqual({ ok: true });
  });

  it("ignores a filled honeypot without subscribing", async () => {
    const response = await newsletterPOST(
      jsonRequest("http://x/api/newsletter", { email: "bot@example.com", website: "spam" }),
    );
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
    // The honeypot address must not be subscribed: subscribing it
    // for real now still counts as a first subscription.
    const { subscribeNewsletter } = await import("@/lib/store");
    expect((await subscribeNewsletter("bot@example.com", "en")).created).toBe(true);
  });

  it("rate-limits after 5 requests per minute", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await newsletterPOST(
        jsonRequest("http://x/api/newsletter", { email: `user${i}@example.com` }),
      );
      expect(response.status).toBe(200);
    }
    const limited = await newsletterPOST(
      jsonRequest("http://x/api/newsletter", { email: "sixth@example.com" }),
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("POST /api/reservations", () => {
  const valid = {
    name: "Test Taster",
    phone: "09123456789",
    date: "2030-06-15T19:00:00.000Z",
    guests: 4,
  };

  it("rejects an invalid Iranian phone", async () => {
    const response = await reservationsPOST(
      jsonRequest("http://x/api/reservations", { ...valid, phone: "123" }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects a past date", async () => {
    const response = await reservationsPOST(
      jsonRequest("http://x/api/reservations", { ...valid, date: "2020-01-01T19:00:00.000Z" }),
    );
    expect(response.status).toBe(400);
  });

  it("creates a reservation and reads it back", async () => {
    const created = await reservationsPOST(jsonRequest("http://x/api/reservations", valid));
    expect(created.status).toBe(201);
    const data = (await readJson(created)) as {
      reservation: { id: string; status: string; guests: number };
    };
    expect(data.reservation.status).toBe("PENDING");
    expect(data.reservation.guests).toBe(4);

    const read = await reservationsGET(
      new Request(`http://x/api/reservations?id=${data.reservation.id}`),
    );
    expect(read.status).toBe(200);
    const readData = (await readJson(read)) as { reservation: { id: string } };
    expect(readData.reservation.id).toBe(data.reservation.id);
  });

  it("returns 404 for an unknown reservation id", async () => {
    const read = await reservationsGET(new Request("http://x/api/reservations?id=nope"));
    expect(read.status).toBe(404);
  });
});

describe("POST /api/contact", () => {
  it("rejects a contact that is neither email nor Iranian phone", async () => {
    const response = await contactPOST(
      jsonRequest("http://x/api/contact", {
        name: "Test",
        contact: "not-a-contact",
        message: "Hello",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("accepts a message with an email contact", async () => {
    const response = await contactPOST(
      jsonRequest("http://x/api/contact", {
        name: "Test",
        contact: "taster@example.com",
        message: "Hello, great coffee!",
      }),
    );
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
  });
});

describe("POST /api/orders", () => {
  const validOrder = {
    items: [{ drinkId: "kuro-caramel", qty: 2 }],
    customerName: "Test Taster",
    phone: "09123456789",
  };

  it("computes the total server-side and ignores a forged client total", async () => {
    const response = await ordersPOST(
      jsonRequest("http://x/api/orders", { ...validOrder, totalToman: 1 }),
    );
    expect(response.status).toBe(201);
    const data = (await readJson(response)) as {
      order: { totalToman: number; status: string; payment: string };
      payment: { verified: boolean };
    };
    // 2 × 195,000 — the forged total of 1 is ignored.
    expect(data.order.totalToman).toBe(390_000);
    expect(data.order.status).toBe("RECEIVED");
    expect(data.order.payment).toBe("PAID");
    expect(data.payment.verified).toBe(true);
  });

  it("rejects an unknown drink id", async () => {
    const response = await ordersPOST(
      jsonRequest("http://x/api/orders", {
        ...validOrder,
        items: [{ drinkId: "no-such-drink", qty: 1 }],
      }),
    );
    expect(response.status).toBe(400);
    const data = await readJson(response);
    expect((data.error as { code: string }).code).toBe("UNKNOWN_DRINK");
  });

  it("rejects an invalid phone", async () => {
    const response = await ordersPOST(
      jsonRequest("http://x/api/orders", { ...validOrder, phone: "123" }),
    );
    expect(response.status).toBe(400);
  });

  it("returns the same order for the same Idempotency-Key", async () => {
    const headers = { "Idempotency-Key": "key-123" };
    const first = await ordersPOST(jsonRequest("http://x/api/orders", validOrder, headers));
    expect(first.status).toBe(201);
    const firstData = (await readJson(first)) as { order: { id: string } };

    const second = await ordersPOST(jsonRequest("http://x/api/orders", validOrder, headers));
    expect(second.status).toBe(200);
    const secondData = (await readJson(second)) as { order: { id: string }; idempotent: boolean };
    expect(secondData.order.id).toBe(firstData.order.id);
    expect(secondData.idempotent).toBe(true);
  });

  it("reads an order back by id and 404s for unknown ids", async () => {
    const created = await ordersPOST(jsonRequest("http://x/api/orders", validOrder));
    const createdData = (await readJson(created)) as { order: { id: string } };

    const read = await orderGET(new Request("http://x/api/orders/x"), {
      params: Promise.resolve({ id: createdData.order.id }),
    });
    expect(read.status).toBe(200);
    const readData = (await readJson(read)) as { order: { id: string; totalToman: number } };
    expect(readData.order.totalToman).toBe(390_000);

    const missing = await orderGET(new Request("http://x/api/orders/x"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(missing.status).toBe(404);
  });
});

describe("GET /api/orders/[id]/events", () => {
  it("streams text/event-stream with the current status first", async () => {
    const created = await ordersPOST(
      jsonRequest("http://x/api/orders", {
        items: [{ drinkId: "kuro-original", qty: 1 }],
        customerName: "Test Taster",
        phone: "09123456789",
      }),
    );
    const createdData = (await readJson(created)) as { order: { id: string } };
    const orderId = createdData.order.id;

    const response = await eventsGET(new Request("http://x/api/orders/x/events"), {
      params: Promise.resolve({ id: orderId }),
    });
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const { value } = await reader!.read();
    const text = new TextDecoder().decode(value);
    expect(text).toContain('data: {"status":"RECEIVED"}');
    await reader!.cancel();
  });

  it("emits a new event when the status changes", async () => {
    const created = await ordersPOST(
      jsonRequest("http://x/api/orders", {
        items: [{ drinkId: "kuro-original", qty: 1 }],
        customerName: "Test Taster",
        phone: "09123456789",
      }),
    );
    const createdData = (await readJson(created)) as { order: { id: string } };
    const orderId = createdData.order.id;

    const response = await eventsGET(new Request("http://x/api/orders/x/events"), {
      params: Promise.resolve({ id: orderId }),
    });
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    // First chunk: current status.
    await reader!.read();
    // Change the status; the 5 s poll inside the stream must emit it.
    await updateOrderStatus(orderId, "PREPARING");
    const second = await reader!.read();
    const text = new TextDecoder().decode(second.value);
    expect(text).toContain('data: {"status":"PREPARING"}');
    await reader!.cancel();
  }, 15_000);

  it("returns 404 for an unknown order", async () => {
    const response = await eventsGET(new Request("http://x/api/orders/x/events"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(response.status).toBe(404);
  });
});
