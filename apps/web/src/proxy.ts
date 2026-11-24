import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing for Next.js 16.
 *
 * NOTE — Next 16 renamed the `middleware.ts` convention to `proxy.ts`
 * (see the bundled Next docs: `01-app/02-guides/upgrading/version-16.md`,
 * "`middleware` to `proxy`"). The file must be `src/proxy.ts` and export
 * the function as `proxy` (default export also works). The next-intl
 * factory itself is unchanged: `createMiddleware(routing)` handles
 * `/` → `/fa` redirects and validates the `fa` | `en` prefix.
 */
export const proxy = createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
