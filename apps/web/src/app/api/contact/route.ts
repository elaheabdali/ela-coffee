/**
 * POST /api/contact — { name, contact, message } (architecture §6).
 * Zod validation (contact = valid email or Iranian mobile), honeypot,
 * in-memory rate limit (5/min per IP). Messages are stored via the
 * data layer; there is no email sending in v1 (Resend-compatible
 * mail is a later step — architecture §2).
 */
import { NextResponse } from "next/server";
import { jsonError, parseBodyError, validationError } from "@/lib/api-errors";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/schemas";
import { createContactMessage } from "@/lib/store";

export async function POST(request: Request): Promise<NextResponse> {
  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 60);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", "Too many requests. Try again shortly.", rateLimitHeaders(limit));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return parseBodyError();
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(
      parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "contact"),
        message: issue.message,
      })),
    );
  }

  // Honeypot filled → bot. Answer like a success, store nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  await createContactMessage({
    name: parsed.data.name.trim(),
    contact: parsed.data.contact.trim(),
    message: parsed.data.message.trim(),
  });
  return NextResponse.json({ ok: true });
}
