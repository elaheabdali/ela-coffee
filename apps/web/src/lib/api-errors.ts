/**
 * JSON error helpers for Route Handlers.
 * Errors never leak stack traces — only a stable code and a short
 * message (architecture §12).
 */
import { NextResponse } from "next/server";

export function jsonError(
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export interface ValidationDetail {
  field: string;
  message: string;
}

export function validationError(details: ValidationDetail[]): NextResponse {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "Validation failed", details } },
    { status: 400 },
  );
}

export function parseBodyError(): NextResponse {
  return jsonError(400, "INVALID_JSON", "Request body is not valid JSON.");
}
