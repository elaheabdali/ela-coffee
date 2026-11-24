/**
 * GET /api/menu — both brands, served from the data layer
 * (architecture §6). The page and the API read the same dataset, so
 * the menu and the page can never disagree on prices.
 *
 * Cache Components note: this project enables `cacheComponents`, so
 * the old `export const revalidate = 300` segment config is not
 * allowed. The 300 s intent is kept in the `Cache-Control` header
 * below (CDN), and `connection()` opts the handler out of build-time
 * prerendering so the menu is read live at request time (DB prices
 * win). The try/catch is only for unit tests: outside a Next request
 * there is no request store and `connection()` throws — in production
 * it resolves on a real request and stalls the build prerender (which
 * is exactly what marks the route dynamic).
 */
import { connection, NextResponse } from "next/server";
import { getDrinks } from "@/lib/store";

export async function GET(): Promise<NextResponse> {
  try {
    await connection();
  } catch {
    // Not inside a Next request (e.g. Vitest) — continue anyway.
  }
  const drinks = await getDrinks();
  return NextResponse.json(
    { drinks },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } },
  );
}
