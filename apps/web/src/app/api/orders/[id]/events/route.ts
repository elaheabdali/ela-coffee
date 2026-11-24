/**
 * GET /api/orders/[id]/events — Server-Sent Events for live order
 * status (architecture §8).
 *
 * - Sends the current status immediately as `data: {"status": ...}`.
 * - Re-reads the order every 5 s and emits an event only when the
 *   status changed.
 * - Sends a `: ping` heartbeat every 25 s; the client treats 60 s of
 *   silence as dead and falls back to polling (see useOrderStatus).
 * - The stream stays open until the client disconnects; on Vercel a
 *   serverless function is short-lived, so the client must not
 *   assume the stream lives forever — the polling fallback covers it.
 */
import { getOrder } from "@/lib/store";
import { jsonError } from "@/lib/api-errors";
import type { OrderStatus } from "@/lib/types";

const HEARTBEAT_MS = 25_000;
const POLL_MS = 5_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return jsonError(404, "ORDER_NOT_FOUND", "No order with this id.");
  }

  let lastStatus: OrderStatus = order.status;
  const timers: NodeJS.Timeout[] = [];

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (status: OrderStatus): void => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status })}\n\n`));
      };
      const heartbeat = (): void => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      };

      send(lastStatus);

      const poll = setInterval(async () => {
        try {
          const current = await getOrder(id);
          if (!current) return;
          if (current.status !== lastStatus) {
            lastStatus = current.status;
            send(lastStatus);
          }
        } catch {
          // A transient read failure must not kill the stream.
        }
      }, POLL_MS);
      const heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);

      timers.push(poll, heartbeatTimer);
    },
    cancel() {
      timers.forEach((timer) => clearInterval(timer));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
