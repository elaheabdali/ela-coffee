/**
 * useOrderStatus — live order status (architecture §8).
 *
 * Primary transport: Server-Sent Events (EventSource) to
 * /api/orders/[id]/events. Reconnects with exponential backoff
 * (1s → 2s → 4s → 8s → 30s cap). The server sends a `: ping`
 * heartbeat every 25 s; 60 s of silence is treated as a dead
 * stream and the hook falls back to polling GET /api/orders/[id]
 * every 10 s (backoff to 60 s max) until the order reaches a
 * terminal state. The UI shows the same states either way, so the
 * fallback is invisible to the user. Cleanup on unmount.
 */
"use client";

import { useEffect, useState } from "react";
import type { OrderDTO, OrderStatus } from "@/lib/types";

export type OrderStatusState =
  | { status: OrderStatus; order: OrderDTO | null; transport: "sse" | "polling"; error: null }
  | { status: OrderStatus; order: OrderDTO | null; transport: "sse" | "polling"; error: string };

const TERMINAL: OrderStatus[] = ["DONE"];
const SILENCE_LIMIT_MS = 60_000;
const BACKOFF_STEPS_MS = [1000, 2000, 4000, 8000, 16000, 30000];

async function fetchOrder(orderId: string): Promise<OrderDTO | null> {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { order?: OrderDTO };
    return data.order ?? null;
  } catch {
    return null;
  }
}

export function useOrderStatus(orderId: string | null): OrderStatusState {
  const [state, setState] = useState<OrderStatusState>({
    status: "RECEIVED",
    order: null,
    transport: "sse",
    error: null,
  });

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let source: EventSource | null = null;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let polling = false;

    const clearTimers = (): void => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (pollTimer) clearTimeout(pollTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      silenceTimer = pollTimer = reconnectTimer = null;
    };

    const applyOrder = (order: OrderDTO): void => {
      if (cancelled) return;
      setState((prev) => ({ ...prev, status: order.status, order, error: null }));
    };

    const startPolling = (delayMs: number): void => {
      if (cancelled || polling) return;
      polling = true;
      if (source) {
        source.close();
        source = null;
      }
      setState((prev) => ({ ...prev, transport: "polling" }));
      let pollDelay = delayMs;
      const tick = async (): Promise<void> => {
        if (cancelled) return;
        const order = await fetchOrder(orderId);
        if (cancelled) return;
        if (order) {
          applyOrder(order);
          if (TERMINAL.includes(order.status)) return; // terminal: stop polling
        }
        pollDelay = Math.min(pollDelay * 2, 60_000);
        pollTimer = setTimeout(tick, pollDelay);
      };
      pollTimer = setTimeout(tick, delayMs);
    };

    const armSilenceTimer = (): void => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        // 60 s without any event → dead stream → polling fallback.
        startPolling(0);
      }, SILENCE_LIMIT_MS);
    };

    const connect = (): void => {
      if (cancelled || polling) return;
      if (typeof EventSource === "undefined") {
        startPolling(0);
        return;
      }
      source = new EventSource(`/api/orders/${orderId}/events`);
      armSilenceTimer();

      source.onmessage = (event: MessageEvent<string>) => {
        armSilenceTimer();
        attempt = 0;
        try {
          const data = JSON.parse(event.data) as { status?: OrderStatus };
          if (data.status) {
            setState((prev) => ({ ...prev, status: data.status as OrderStatus, error: null }));
            if (TERMINAL.includes(data.status)) {
              source?.close();
            }
          }
        } catch {
          // Ignore malformed events; the heartbeat keeps us honest.
        }
      };

      source.onerror = () => {
        if (cancelled || polling) return;
        source?.close();
        source = null;
        const delayMs = BACKOFF_STEPS_MS[Math.min(attempt, BACKOFF_STEPS_MS.length - 1)] ?? 30_000;
        attempt += 1;
        if (attempt >= BACKOFF_STEPS_MS.length) {
          // Out of reconnect budget → polling fallback.
          startPolling(0);
          return;
        }
        reconnectTimer = setTimeout(connect, delayMs);
      };
    };

    // Prime the UI with a fetch, then open the stream.
    void fetchOrder(orderId).then((order) => {
      if (!cancelled && order) applyOrder(order);
      connect();
    });

    return () => {
      cancelled = true;
      clearTimers();
      source?.close();
    };
  }, [orderId]);

  return state;
}
