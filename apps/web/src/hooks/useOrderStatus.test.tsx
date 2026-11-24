/**
 * useOrderStatus tests (Phase 6).
 * - Polling fallback: with no EventSource (jsdom), the hook polls
 *   GET /api/orders/[id] and updates the status, stopping at DONE.
 * - SSE path: with a fake EventSource, messages update the status
 *   and the transport stays "sse".
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOrderStatus } from "@/hooks/useOrderStatus";
import type { OrderDTO } from "@/lib/types";

const baseOrder: OrderDTO = {
  id: "order-1",
  status: "RECEIVED",
  items: [{ id: "item-1", drinkId: "kuro-caramel", qty: 1, priceToman: 195_000 }],
  customerName: "Test Taster",
  phone: "09123456789",
  totalToman: 195_000,
  payment: "PAID",
  paymentAuthority: "mock_order-1_x",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const originalFetch = globalThis.fetch;
const originalEventSource = globalThis.EventSource;

function mockFetchOrder(statusOrder: OrderDTO) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ order: statusOrder }),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = originalFetch;
  globalThis.EventSource = originalEventSource;
  vi.restoreAllMocks();
});

describe("useOrderStatus polling fallback", () => {
  it("polls the order and updates the status, stopping at DONE", async () => {
    // jsdom has no EventSource → the hook must fall back to polling.
    delete (globalThis as unknown as { EventSource?: unknown }).EventSource;
    const fetchMock = mockFetchOrder(baseOrder);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result, unmount } = renderHook(() => useOrderStatus("order-1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status).toBe("RECEIVED");
    expect(result.current.transport).toBe("polling");
    expect(fetchMock).toHaveBeenCalledWith("/api/orders/order-1");

    // The order moves to PREPARING; the next poll must pick it up.
    const callsBefore = fetchMock.mock.calls.length;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ order: { ...baseOrder, status: "PREPARING" } }),
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(result.current.status).toBe("PREPARING");

    // DONE is terminal: polling must stop.
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ order: { ...baseOrder, status: "DONE" } }),
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(result.current.status).toBe("DONE");
    const callsAtDone = fetchMock.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });
    expect(fetchMock.mock.calls.length).toBe(callsAtDone);

    unmount();
  });
});

describe("useOrderStatus SSE path", () => {
  class FakeEventSource {
    static instances: FakeEventSource[] = [];
    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    onerror: (() => void) | null = null;
    closed = false;
    constructor(public url: string) {
      FakeEventSource.instances.push(this);
    }
    close(): void {
      this.closed = true;
    }
    emit(status: string): void {
      this.onmessage?.({ data: JSON.stringify({ status }) } as MessageEvent<string>);
    }
  }

  it("updates the status from stream messages", async () => {
    globalThis.fetch = mockFetchOrder(baseOrder) as unknown as typeof fetch;
    globalThis.EventSource = FakeEventSource as unknown as typeof EventSource;

    const { result, unmount } = renderHook(() => useOrderStatus("order-1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0]?.url).toBe("/api/orders/order-1/events");
    expect(result.current.transport).toBe("sse");

    await act(async () => {
      FakeEventSource.instances[0]?.emit("PREPARING");
    });
    expect(result.current.status).toBe("PREPARING");

    unmount();
    expect(FakeEventSource.instances[0]?.closed).toBe(true);
  });
});
