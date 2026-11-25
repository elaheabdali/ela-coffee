import { defineConfig } from "@playwright/test";

/**
 * Playwright E2E config (Phase 10).
 *
 * - Local browser is **Firefox only**: Playwright 1.65.1 expects the
 *   cached `firefox-1572` build, and Chromium downloads are blocked in
 *   the sandbox this repo is built in. In GitHub Actions Chromium IS
 *   available, so CI sets `E2E_BROWSER=chromium` for the functional
 *   project (see .github/workflows/ci.yml). The visual project is
 *   Firefox on every machine, so the committed baselines in
 *   tests/visual/baseline/ are comparable everywhere.
 * - `workers: 1` is deliberate: the API rate limits are per-IP and the
 *   dev/demo data layer is one in-memory store per server instance, so
 *   parallel tests would trip limits and share state.
 * - The webServer builds the production app and serves it on :3000.
 *   Locally an already-running server on :3000 is reused; in CI the
 *   config always starts its own.
 */
const isCI = Boolean(process.env.CI);
const e2eBrowser = (process.env.E2E_BROWSER ?? "firefox") as "chromium" | "firefox" | "webkit";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm build && pnpm start -p 3000",
    url: "http://localhost:3000/fa",
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "e2e",
      use: { browserName: e2eBrowser, viewport: { width: 1280, height: 720 } },
      testIgnore: "**/visual.spec.ts",
    },
    {
      name: "visual",
      use: { browserName: "firefox" },
      testMatch: "**/visual.spec.ts",
      // Baselines live in tests/visual/baseline/ (no browser/platform
      // suffix — the visual project is always Firefox on Linux).
      snapshotPathTemplate: "{testDir}/../visual/baseline/{arg}{ext}",
    },
  ],
});
