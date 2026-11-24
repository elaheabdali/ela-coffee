import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Security headers (SECURITY.md).
 *
 * CSP decision, documented honestly: the strict nonce-based CSP from
 * the Next.js docs is NOT used here, because the bundled docs state
 * that nonces require dynamic rendering and that "Partial
 * Prerendering (PPR) is incompatible with nonce-based CSP" — and this
 * project enables cacheComponents + partialPrefetching for
 * performance. So the CSP is static, set in headers():
 * - script-src 'self' 'unsafe-inline': Next.js emits inline
 *   bootstrap scripts that cannot carry a nonce on statically
 *   rendered pages. 'unsafe-eval' is added in dev only (React uses
 *   eval for dev error stacks, per the Next docs) and never in prod.
 * - style-src 'self' 'unsafe-inline': the flavour wheel drives
 *   --rot/--pour through React inline `style` attributes, which CSP
 *   treats as inline styles; a nonce cannot be attached to a style
 *   attribute at all. 'unsafe-inline' for styles is the only way the
 *   wheel works, and styles cannot execute code.
 * Everything else is locked down: no objects, no framing, no
 * third-party sources of any kind (no Google Fonts/CDN by design).
 * If a stricter policy is ever required, the trade is to give up PPR
 * and move to nonce CSP via proxy.ts.
 */
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS: only enforced by browsers over HTTPS (Vercel). The preload
  // flag only matters once the real domain is submitted to the
  // preload list; it is harmless before that.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Defence in depth next to CSP frame-ancestors 'none'.
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Do not advertise the framework version (fingerprinting).
  poweredByHeader: false,
  experimental: {
    // Branded 404 for unmatched routes (src/app/global-not-found.tsx).
    globalNotFound: true,
  },
  partialPrefetching: true,
  // Workspace packages ship TypeScript source; Next transpiles them.
  transpilePackages: ["@ela-coffee/ui", "@ela-coffee/i18n"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

// next-intl plugin, pointed at our request config (src/i18n/request.ts).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
