/**
 * GET /api/orders/[id] — one order with items and status
 * (architecture §6).
 */
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-errors";
import { getOrder } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return jsonError(404, "ORDER_NOT_FOUND", "No order with this id.");
  }
  return NextResponse.json({ order });
}
