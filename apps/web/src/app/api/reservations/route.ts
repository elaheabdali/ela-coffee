/**
 * /api/reservations — POST creates a reservation, GET ?id=… reads it
 * (architecture §6). Zod validation: name, Iranian phone
 * (09xx / +98), future date, 1–12 guests. Honeypot + in-memory
 * rate limit (10/min per IP).
 */
import { NextResponse } from "next/server";
import { jsonError, parseBodyError, validationError } from "@/lib/api-errors";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { assertSameOrigin, corsHeaders, handleOptions } from "@/lib/csrf";
import { canonicalPhone, isValidRecordId, reservationSchema } from "@/lib/schemas";
import { createReservation, getReservation } from "@/lib/store";

/** CORS preflight — ACAO only for our own origin (see lib/csrf.ts). */
export function OPTIONS(request: Request): NextResponse {
  return handleOptions(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  // CSRF first: cross-origin requests are rejected before any other work.
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const limit = rateLimit(`reservations:${clientIp(request)}`, 10, 60);
  if (!limit.allowed) {
    return jsonError(
      429,
      "RATE_LIMITED",
      "Too many requests. Try again shortly.",
      rateLimitHeaders(limit),
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return parseBodyError();
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(
      parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "reservation"),
        message: issue.message,
      })),
    );
  }

  // Honeypot filled → bot. Answer like a success, create nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { headers: corsHeaders(request) });
  }

  const reservation = await createReservation({
    name: parsed.data.name.trim(),
    phone: canonicalPhone(parsed.data.phone),
    date: new Date(parsed.data.date),
    guests: parsed.data.guests,
  });
  return NextResponse.json({ reservation }, { status: 201, headers: corsHeaders(request) });
}

export async function GET(request: Request): Promise<NextResponse> {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return jsonError(400, "MISSING_ID", "Query parameter id is required.");
  }
  if (!isValidRecordId(id)) {
    return jsonError(400, "INVALID_ID", "Reservation id is not well-formed.");
  }
  const reservation = await getReservation(id);
  if (!reservation) {
    return jsonError(404, "RESERVATION_NOT_FOUND", "No reservation with this id.");
  }
  return NextResponse.json({ reservation });
}
