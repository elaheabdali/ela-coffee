import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
};

// next-intl plugin, pointed at our request config (src/i18n/request.ts).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
