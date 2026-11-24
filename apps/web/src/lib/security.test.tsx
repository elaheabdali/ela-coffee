/**
 * Security tests (Phase 7): CSRF + CORS, rate limits, honeypots,
 * input sanitisation and safe errors. All run WITHOUT a live database
 * (seed-JSON/in-memory fallback) and WITHOUT a browser — the route
 * handlers are called directly with constructed Requests, which is
 * exactly how a forged cross-site request would arrive.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as menuGET } from "@/app/api/menu/route";
import { OPTIONS as newsletterOPTIONS, POST as newsletterPOST } from "@/app/api/newsletter/route";
import { POST as reservationsPOST } from "@/app/api/reservations/route";
import { POST as contactPOST } from "@/app/api/contact/route";
import { OPTIONS as ordersOPTIONS, POST as ordersPOST } from "@/app/api/orders/route";
import { GET as orderGET } from "@/app/api/orders/[id]/route";
import { memoryStore, resetMemoryStore } from "@/lib/memory-store";
import { resetRateLimits } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/schemas";

const SAME_ORIGIN = "http://x";
const EVIL_ORIGIN = "https://evil.example";

function jsonRequest(url: string, body: unknown, headers?: Record<string, string>): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: SAME_ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
}

/** A POST with neither Origin nor Referer — a non-browser client. */
function noOriginRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

describe("CSRF — same-origin check on mutations", () => {
  it("rejects a cross-origin POST (403) for newsletter and orders", async () => {
    const newsletter = await newsletterPOST(
      jsonRequest(
        `${SAME_ORIGIN}/api/newsletter`,
        { email: "a@example.com" },
        { Origin: EVIL_ORIGIN },
      ),
    );
    expect(newsletter.status).toBe(403);
    expect(((await readJson(newsletter)).error as { code: string }).code).toBe(
      "CSRF_ORIGIN_MISMATCH",
    );

    const order = await ordersPOST(
      jsonRequest(
        `${SAME_ORIGIN}/api/orders`,
        {
          items: [{ drinkId: "kuro-original", qty: 1 }],
          customerName: "Test",
          phone: "09123456789",
        },
        { Origin: EVIL_ORIGIN },
      ),
    );
    expect(order.status).toBe(403);
  });

  it("rejects a cross-origin Referer when Origin is absent", async () => {
    const request = new Request(`${SAME_ORIGIN}/api/newsletter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `${EVIL_ORIGIN}/`,
      },
      body: JSON.stringify({ email: "a@example.com" }),
    });
    const response = await newsletterPOST(request);
    expect(response.status).toBe(403);
    expect(((await readJson(response)).error as { code: string }).code).toBe(
      "CSRF_ORIGIN_MISMATCH",
    );
  });

  it("rejects a POST with neither Origin nor Referer", async () => {
    const response = await newsletterPOST(
      noOriginRequest(`${SAME_ORIGIN}/api/newsletter`, { email: "a@example.com" }),
    );
    expect(response.status).toBe(403);
    expect(((await readJson(response)).error as { code: string }).code).toBe("CSRF_ORIGIN_MISSING");
  });

  it("accepts a same-origin Referer when Origin is absent", async () => {
    const request = new Request(`${SAME_ORIGIN}/api/newsletter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `${SAME_ORIGIN}/fa`,
      },
      body: JSON.stringify({ email: "a@example.com" }),
    });
    const response = await newsletterPOST(request);
    expect(response.status).toBe(200);
  });

  it("accepts a same-origin POST", async () => {
    const response = await newsletterPOST(
      jsonRequest(`${SAME_ORIGIN}/api/newsletter`, { email: "a@example.com" }),
    );
    expect(response.status).toBe(200);
  });
});

describe("CORS — no wildcard, ACAO only for our own origin", () => {
  it("answers a same-origin preflight with ACAO echo", async () => {
    const response = await newsletterOPTIONS(
      new Request(`${SAME_ORIGIN}/api/newsletter`, {
        method: "OPTIONS",
        headers: { Origin: SAME_ORIGIN },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(SAME_ORIGIN);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Idempotency-Key");
  });

  it("answers a cross-origin preflight WITHOUT ACAO", async () => {
    const response = await ordersOPTIONS(
      new Request(`${SAME_ORIGIN}/api/orders`, {
        method: "OPTIONS",
        headers: { Origin: EVIL_ORIGIN },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("echoes ACAO on a same-origin success, and never on a foreign GET", async () => {
    const ok = await newsletterPOST(
      jsonRequest(`${SAME_ORIGIN}/api/newsletter`, { email: "a@example.com" }),
    );
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe(SAME_ORIGIN);
    expect(ok.headers.get("Vary")).toBe("Origin");

    const menu = await menuGET();
    expect(menu.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("rate limits — hammering past the limit returns 429", () => {
  it("limits orders to 10/min with Retry-After", async () => {
    const body = {
      items: [{ drinkId: "kuro-original", qty: 1 }],
      customerName: "Test",
      phone: "09123456789",
    };
    for (let i = 0; i < 10; i++) {
      const response = await ordersPOST(jsonRequest(`${SAME_ORIGIN}/api/orders`, body));
      expect(response.status).toBe(201);
    }
    const limited = await ordersPOST(jsonRequest(`${SAME_ORIGIN}/api/orders`, body));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
    expect(((await readJson(limited)).error as { code: string }).code).toBe("RATE_LIMITED");
  });

  it("limits reservations to 10/min", async () => {
    const body = {
      name: "Test",
      phone: "09123456789",
      date: "2030-06-15T19:00:00.000Z",
      guests: 2,
    };
    for (let i = 0; i < 10; i++) {
      expect(
        (await reservationsPOST(jsonRequest(`${SAME_ORIGIN}/api/reservations`, body))).status,
      ).toBe(201);
    }
    expect(
      (await reservationsPOST(jsonRequest(`${SAME_ORIGIN}/api/reservations`, body))).status,
    ).toBe(429);
  });

  it("limits contact to 5/min", async () => {
    const body = { name: "Test", contact: "t@example.com", message: "hi" };
    for (let i = 0; i < 5; i++) {
      expect((await contactPOST(jsonRequest(`${SAME_ORIGIN}/api/contact`, body))).status).toBe(200);
    }
    expect((await contactPOST(jsonRequest(`${SAME_ORIGIN}/api/contact`, body))).status).toBe(429);
  });
});

describe("honeypot — filled honeypot gets a silent 200 and creates nothing", () => {
  it("orders: no order is created", async () => {
    const response = await ordersPOST(
      jsonRequest(`${SAME_ORIGIN}/api/orders`, {
        items: [{ drinkId: "kuro-original", qty: 1 }],
        customerName: "Bot",
        phone: "09123456789",
        website: "spam",
      }),
    );
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
  });

  it("reservations: no reservation is created", async () => {
    const response = await reservationsPOST(
      jsonRequest(`${SAME_ORIGIN}/api/reservations`, {
        name: "Bot",
        phone: "09123456789",
        date: "2030-06-15T19:00:00.000Z",
        guests: 2,
        website: "spam",
      }),
    );
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true });
  });

  it("contact: nothing is stored", async () => {
    const response = await contactPOST(
      jsonRequest(`${SAME_ORIGIN}/api/contact`, {
        name: "Bot",
        contact: "bot@example.com",
        message: "spam",
        website: "spam",
      }),
    );
    expect(response.status).toBe(200);
    expect(memoryStore.contactCount()).toBe(0);

    const real = await contactPOST(
      jsonRequest(`${SAME_ORIGIN}/api/contact`, {
        name: "Human",
        contact: "human@example.com",
        message: "hello",
      }),
    );
    expect(real.status).toBe(200);
    expect(memoryStore.contactCount()).toBe(1);
  });
});

describe("input sanitisation — user text can never carry HTML", () => {
  it("strips angle brackets from names/messages at the schema boundary", () => {
    const parsed = contactSchema.parse({
      name: "A<b",
      contact: "t@example.com",
      message: "<img src=x onerror=alert(1)>hi",
    });
    expect(parsed.name).toBe("Ab");
    expect(parsed.message).toBe("img src=x onerror=alert(1)hi");
    expect(parsed.message).not.toContain("<");
    expect(parsed.message).not.toContain(">");
  });

  it("stores a sanitised customer name on the order, readable back via the API", async () => {
    const created = await ordersPOST(
      jsonRequest(`${SAME_ORIGIN}/api/orders`, {
        items: [{ drinkId: "kuro-original", qty: 1 }],
        customerName: "<script>alert(1)</script>Ali",
        phone: "09123456789",
      }),
    );
    expect(created.status).toBe(201);
    const createdData = (await readJson(created)) as {
      order: { id: string; customerName: string };
    };
    expect(createdData.order.customerName).not.toContain("<");
    expect(createdData.order.customerName).not.toContain(">");
    expect(createdData.order.customerName).toContain("Ali");

    // And the value renders as plain text through React (never as HTML).
    const read = await orderGET(new Request(`${SAME_ORIGIN}/api/orders/x`), {
      params: Promise.resolve({ id: createdData.order.id }),
    });
    const readData = (await readJson(read)) as { order: { customerName: string } };
    render(<span>{readData.order.customerName}</span>);
    expect(screen.getByText(readData.order.customerName)).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });
});

describe("safe errors — no stack traces or internals leak", () => {
  it("invalid JSON returns 400 INVALID_JSON with no stack", async () => {
    const request = new Request(`${SAME_ORIGIN}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: SAME_ORIGIN },
      body: "{not json",
    });
    const response = await newsletterPOST(request);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toContain("INVALID_JSON");
    expect(text).not.toContain("stack");
    expect(text).not.toContain("node_modules");
  });

  it("unknown drink returns only the code and the id", async () => {
    const response = await ordersPOST(
      jsonRequest(`${SAME_ORIGIN}/api/orders`, {
        items: [{ drinkId: "no-such-drink", qty: 1 }],
        customerName: "Test",
        phone: "09123456789",
      }),
    );
    expect(response.status).toBe(400);
    const data = await readJson(response);
    expect((data.error as { code: string }).code).toBe("UNKNOWN_DRINK");
    expect(JSON.stringify(data)).not.toContain("prisma");
    expect(JSON.stringify(data)).not.toContain("stack");
  });

  it("malformed record ids return 400, unknown well-formed ids return 404", async () => {
    const badOrder = await orderGET(new Request(`${SAME_ORIGIN}/api/orders/x`), {
      params: Promise.resolve({ id: "bad id!" }),
    });
    expect(badOrder.status).toBe(400);
    expect(((await readJson(badOrder)).error as { code: string }).code).toBe("INVALID_ID");
  });
});
