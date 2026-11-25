# Resume Bullets — ela-coffee

> Every number below was actually measured — by a test run, a CI log, or a
> live check against the production site. Where a number did **not**
> improve, or was never measured, it says so. No Lighthouse score exists
> for this project (no Chrome in the build sandbox), so none is claimed.
>
> Live site: https://ela-coffee-yi88.vercel.app ·
> Repo: https://github.com/elaheabdali/ela-coffee ·
> Verification dates: 2026-11-24 → 2026-11-25.

## Copy-paste bullets

- Rebuilt a coffee-shop template as a production bilingual (Persian-first,
  RTL / English) Next.js 16 storefront — 12 drinks across two brands,
  flavour wheel, cart, real checkout with live order status, reservations
  and newsletter — deployed to Vercel with green CI on every push.
- Own the full stack: Next.js App Router + strict TypeScript, Tailwind v4
  design tokens, Zustand, TanStack Query, Prisma + Postgres, SSE with a
  polling fallback for live order status, Zod-validated APIs with
  server-side pricing and idempotency keys.
- Drove accessibility from 2 axe violations to **0 in all 8 tested states**
  (fa/en × static page, menu drawer, flavour dialog, bag drawer), with
  computed contrast ratios of **6.00–17.22:1** against the WCAG 2.2 AA bar
  of 4.5:1 — and found and fixed two real contrast bugs the first pass
  missed (menu-card text at 1.05:1, section eyebrows at 1.99:1).
- Cut served image bytes (menu tiles 640w → 384w, **66 KB → 30 KB** per
  brand view) and JS transfer (**247 KB → 234 KB**) by lazy-loading
  dialogs/drawers and fixing `next/image` sizes; re-encoded the two key
  photographs to AVIF at −96.8% / −96.5% (1.34 MB → 42 KB, 1.47 MB → 52 KB,
  PSNR ~46 dB, SSIM ~0.99) — honestly noted as readiness work, since
  neither photograph is on a page yet.
- Built the test safety net from zero to **225 unit tests in 30 files**
  and **58 Playwright E2E tests (48 functional + 10 visual)** green in
  both locales, with **20 visual-regression baselines at 5 widths**
  (360–1920 px) and a CI pipeline (typecheck / lint / test / build /
  `pnpm audit` + E2E) green on `master`.
- Hardened the app end to end: strict security headers verified live on
  production (CSP, HSTS, `X-Frame-Options: DENY`, no `X-Powered-By`),
  same-origin CSRF checks proven live (cross-origin POST → 403,
  same-origin → 200), and the `pnpm audit` gate fixed for real — two
  high vulnerabilities in transitive Prisma dependencies patched via
  pnpm overrides after the first CI run went red on audit alone.
- Shipped SEO as a system, not tags: per-locale metadata, hreflang
  (fa/en + x-default), Open Graph/Twitter cards, JSON-LD
  (`CafeOrCoffeeShop` + 12-drink menu + `BreadcrumbList`) generated from
  the same dataset as the page, plus a real `sitemap.xml` and
  `robots.txt` — all verified live on the production domain.

## The numbers, with sources

| Claim | Source |
|---|---|
| 225 unit tests, 30 files, all passing | `pnpm test`, run 2026-11-25 after the Kuro → Ela rebrand (224 + 1 new persisted-brand migration test) |
| 58 E2E tests (48 functional + 10 visual), green in fa + en | `pnpm --filter web test:e2e` run 2026-11-25 after the rebrand: 58 passed, twice in a row; also green in CI run 45576282908 before the rebrand |
| 20 visual baselines, 5 widths (360/768/1024/1440/1920) | `apps/web/tests/visual/baseline/`, regenerated from the rebranded build 2026-11-25; 2% pixel tolerance, stability proven on repeat runs |
| axe violations 2 → 0 in all 8 states | `docs/qa-report.md` §4 (Playwright + Firefox, axe-core, 2026-11-24) |
| Contrast 6.00–17.22:1; bugs fixed at 1.05:1 and 1.99:1 | `docs/qa-report.md` §4 + §9 (Phase 10) |
| Tiles 640w → 384w (66 → 30 KB); JS 247 → 234 KB | `docs/qa-report.md` §2–§3, measured on the production build |
| AVIF re-encodes 1.34 MB → 42 KB, 1.47 MB → 52 KB | `docs/qa-report.md` §3 (PSNR 46.1/45.9 dB, SSIM 0.991) — **not** page-load savings: neither JPG is referenced by a page yet |
| LCP fa 1,158 ms baseline → 1,888 / 1,498 ms after; CLS 0.0000 | `docs/qa-report.md` §2 — LCP did **not** measurably improve (animation/run variance, reported honestly) |
| 104 dictionary keys per locale, enforced by test | Phase 5; `dictionaries.test.ts` |
| 12 drinks; 7 API routes; forged total 1 → server total 390,000; same Idempotency-Key → same order | Phase 6 live API smoke test, `docs/fa/phase-06-backend.md` |
| CSRF evil origin → 403, same origin → 200; headers live on production | Phase 7 + Phase 11 live checks, `docs/qa-report.md` §10 |
| CI green (check + e2e), `pnpm audit`: "No known vulnerabilities found" | GitHub Actions run 45576282908, 2026-11-25 |
| Production deploys in ~59 s; `/fa` 200, `/api/menu` 12 drinks, sitemap/robots/404 verified live | Vercel deployment `dpl_22oo98WVrFXyBy7bKJLYWzhL4qbG`, `docs/qa-report.md` §10 |

## What is NOT claimed

- **No Lighthouse score.** Lighthouse never ran — no Chrome in the build
  sandbox. The architecture target (≥95 mobile, all four categories) is
  a target, not a result. Run it against the production URL before
  quoting a score anywhere.
- **No real database or payments in production (yet).** The live site
  runs on the seed-JSON/in-memory fallback (orders reset on redeploy)
  and Mock payments until Neon and the Zarinpal sandbox ID are connected
  — see `docs/fa/handover-checklist.md`.
- **No licence evidence (yet).** The client states she holds a licence
  for the template, but no file or receipt has been supplied or verified.
- **Placeholder prices and contact details** are still in the live site,
  and 32 Persian strings still carry a visible `TODO(review)` marker
  awaiting the owner's review.
