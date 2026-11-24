/**
 * POST /api/newsletter — { email } (architecture §6).
 * Zod email validation, honeypot field, in-memory rate limit
 * (5/min per IP). A duplicate email returns the identical 200
 * response as a new subscription — existence is never leaked.
 */
import { NextResponse } from "next/server";
import { jsonError, parseBodyError, validationError } from "@/lib/api-errors";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/schemas";
import { subscribeNewsletter } from "@/lib/store";

export async function POST(request: Request): Promise<NextResponse> {
  const limit = rateLimit(`newsletter:${clientIp(request)}`, 5, 60);
  if (!limit.allowed) {
    return jsonError(429, "RATE_LIMITED", "Too many requests. Try again shortly.", rateLimitHeaders(limit));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return parseBodyError();
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(
      parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "email"),
        message: issue.message,
      })),
    );
  }

  // Honeypot filled → bot. Answer like a success, subscribe nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  await subscribeNewsletter(parsed.data.email.toLowerCase(), parsed.data.locale ?? "fa");
  return NextResponse.json({ ok: true });
}
