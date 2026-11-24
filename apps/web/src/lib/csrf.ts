/**
 * Same-origin (CSRF) protection + CORS policy for the API
 * (SECURITY.md, OWASP A01/A05).
 *
 * The API is same-origin only: it is consumed exclusively by our own
 * pages (fetch from /fa and /en). There is no public cross-origin
 * API, so the rules are deliberately strict:
 *
 * - Every mutating route (POST) must pass assertSameOrigin() FIRST,
 *   before rate limiting or validation. A request whose Origin (or,
 *   when Origin is absent, Referer) does not match the request's own
 *   origin is rejected with 403. A request with NEITHER header is
 *   also rejected: a browser always sends Origin on a POST, so a
 *   missing Origin means a non-browser client, and non-browser
 *   clients are not a supported caller of this API.
 * - CORS: no wildcard anywhere. corsHeaders() echoes
 *   Access-Control-Allow-Origin only when the request Origin matches
 *   our own origin (and always sends Vary: Origin); a cross-origin
 *   preflight gets no ACAO header, so the browser blocks it.
 *   Same-origin fetch does not need CORS at all — the headers exist
 *   so the policy is explicit, not accidental.
 */
import { NextResponse } from "next/server";
import { jsonError } from "./api-errors";

/** The origin this request was sent to (protocol + host). */
function ownOrigin(request: Request): string {
  return new URL(request.url).origin;
}

/** Parse an Origin/Referer header value to its origin, or null when malformed. */
function headerOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Returns a 403 response when the request is not same-origin, or null
 * when it may proceed. Mutating routes call this before anything else.
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const expected = ownOrigin(request);
  const origin = request.headers.get("origin");
  if (origin !== null) {
    if (headerOrigin(origin) !== expected) {
      return jsonError(403, "CSRF_ORIGIN_MISMATCH", "Cross-origin requests are not allowed.");
    }
    return null;
  }
  const referer = request.headers.get("referer");
  if (referer !== null) {
    if (headerOrigin(referer) !== expected) {
      return jsonError(403, "CSRF_ORIGIN_MISMATCH", "Cross-origin requests are not allowed.");
    }
    return null;
  }
  return jsonError(403, "CSRF_ORIGIN_MISSING", "Origin header is required.");
}

/**
 * CORS headers for a response. Access-Control-Allow-Origin is echoed
 * ONLY when the request Origin is our own origin — never `*`, never
 * a foreign origin. Same-origin responses do not need the header,
 * but sending it explicitly documents the policy.
 */
export function corsHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = { Vary: "Origin" };
  const origin = request.headers.get("origin");
  if (origin !== null && headerOrigin(origin) === ownOrigin(request)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** Answer a CORS preflight (OPTIONS): 204, ACAO only for our own origin. */
export function handleOptions(request: Request): NextResponse {
  const headers = corsHeaders(request);
  headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  headers["Access-Control-Allow-Headers"] = "Content-Type, Idempotency-Key";
  headers["Access-Control-Max-Age"] = "600";
  return new NextResponse(null, { status: 204, headers });
}
