# ela-coffee

Bilingual (fa default, en) rebuild of the Ela coffee-shop template as a
production Next.js app — a real client deliverable and flagship portfolio
piece. One single page, two brands (coffee `ela` / matcha `midori`)
switched client-side, plus the features the reference does not have: cart,
checkout/reservation with live order status, and Iranian contact channels.

**Live:** [ela-coffee-yi88.vercel.app](https://ela-coffee-yi88.vercel.app)
· **Repo:** [github.com/elaheabdali/ela-coffee](https://github.com/elaheabdali/ela-coffee)
· **CI:** GitHub Actions — `check` (typecheck / lint / test / build /
`pnpm audit`) + `e2e` (Playwright) — green on `master`.

- **Source of truth for fidelity:** `docs/reference-audit.md` (+ visual
  baseline in `docs/reference-baseline/`)
- **Architecture & decisions:** `docs/architecture.md`
- **Phase reports (Persian tutorials):** `docs/fa/phase-01-architecture.md`
  through `docs/fa/phase-11-deploy.md`, plus the handover checklist in
  `docs/fa/handover-checklist.md`
- **Assets:** `ASSETS.md` (licence status: claimed by the client, not yet
  verified — see `docs/reference-audit.md` §9)
- **Quality report:** `docs/qa-report.md` (measured performance &
  accessibility numbers — no Lighthouse score; see below)
- **Resume bullets:** `docs/resume-bullets.md` (measured numbers only)

## Features

- **Flavour wheel** — the reference's signature interaction, rebuilt 1:1:
  drag/swipe, scroll-linked cycling in a 300vh sticky hero, keyboard
  navigation (mirrored in RTL), dots, featured flavours, Surprise me.
  Exact reference geometry and keyframes (`ela-wheel-in` 1.6s,
  `ela-pour` 1.2s, float 7s, marquee 48s, word stagger 65ms).
- **Two brands, one page** — coffee `ela` / matcha `midori` switched
  client-side (`html[data-brand]`); the whole theme follows.
- **Menu, story, process, origins, join** — 12 drinks (6 iced lattes +
  6 iced matchas), tasting-notes dialogs, reservation + newsletter +
  contact forms.
- **Bag → real checkout** — cart with live order status (SSE + polling
  fallback), server-side pricing (a forged client total is ignored),
  idempotency keys, PaymentPort abstraction (Mock by default, Zarinpal
  sandbox ready — no callback in v1, Zarinpal payments stay PENDING).
- **Bilingual, Persian-first** — `/fa` (default, full RTL, Vazirmatn,
  Jalali dates, Persian digits, Toman prices, Iranian phone validation)
  and `/en`; 104 dictionary keys per locale, enforced by test.
- **SEO** — per-locale metadata, hreflang (fa/en + x-default), Open
  Graph/Twitter cards, JSON-LD (`CafeOrCoffeeShop` + 12-drink menu +
  `BreadcrumbList`), real `sitemap.xml` + `robots.txt`, branded 404/500.
- **Security** — strict headers (CSP, HSTS, `X-Frame-Options: DENY`),
  same-origin CSRF checks on mutating routes, Zod validation, honeypot +
  rate limits; see `SECURITY.md`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict, no `any`) ·
Tailwind CSS v4 · next-intl (`/fa`, `/en`) · Zustand · TanStack Query ·
React Hook Form + Zod · Prisma + Postgres (Neon — not connected yet;
the app runs on a seed-JSON/in-memory fallback until then) · Vitest +
Playwright · pnpm workspaces.

Motion is hand-rolled CSS + IntersectionObserver (no animation library),
reproducing the reference's keyframes 1:1 — see `apps/web/src/app/globals.css`.

## Scripts

```bash
pnpm install            # install (frozen lockfile)
pnpm dev                # dev server → http://localhost:3000/fa
pnpm typecheck          # tsc --noEmit in every package
pnpm lint               # ESLint across the repo
pnpm test               # Vitest (run once) — 225 tests in 30 files
pnpm test:watch         # Vitest in watch mode
pnpm build              # production build
pnpm format             # Prettier --write
```

E2E lives in the web app: `pnpm --filter web test:e2e` (Playwright —
58 tests: 48 functional + 10 visual, both locales; 20 visual baselines
at 5 widths in `apps/web/tests/visual/baseline/`).

## Structure

```
apps/web/            # the only app in v1
packages/ui/         # design system (React + Tailwind only)
packages/i18n/       # fa/en dictionaries + formatters (Jalali, Toman, fa digits)
packages/config/     # shared TypeScript / ESLint / Prettier presets
docs/                # audit, architecture, per-phase reports, QA report
assets-original/     # supplied template assets — never modified
```

## Deploy

Vercel project `ela-coffee-yi88`, Root Directory `apps/web`, Build
`pnpm --filter web build`. Every push to `master` auto-deploys to
production; other branches/PRs get Preview deployments. Environment
variables live in the Vercel dashboard (never in git): see
`.env.example` and `docs/fa/handover-checklist.md` §4.

> **Until Neon is connected**, production runs on the seed-JSON /
> in-memory fallback: orders and reservations reset on every redeploy.
> See `docs/fa/phase-11-deploy.md` §7 and the handover checklist.

## Status

- Phase 0 (audit) — done, confirmed.
- Phase 1 (architecture) — done, confirmed.
- Phase 2 (monorepo scaffold & tooling) — done, confirmed.
- Phase 3 (design system, 10 components) — done, confirmed.
- Phase 4 (pages & animations) — done, confirmed.
- Phase 5 (i18n/RTL) — done, confirmed.
- Phase 6 (backend, data & real-time) — done, confirmed.
- Phase 7 (security hardening) — done, confirmed.
- Phase 8 (SEO) — done, confirmed.
- Phase 9 (performance & accessibility) — done, confirmed.
- Phase 10 (testing & debugging) — done, confirmed.
- Phase 11 (CI/CD, GitHub, Vercel) — done, confirmed. CI green
  (run 45576282908); production live at
  https://ela-coffee-yi88.vercel.app.
- Phase 12 (docs & handover) — this phase. Includes the Kuro → Ela
  rebrand of the coffee brand (matcha `midori` unchanged); see
  `docs/fa/handover-checklist.md` §6.

## Licence note

The template this site rebuilds was supplied by the client, who states
she holds a valid licence for it — **but no licence file or receipt has
been supplied or verified yet** (open since Phase 0; see
`docs/reference-audit.md` §9 and `ASSETS.md`). Do not treat this repo
as licence-cleared until that evidence lands.

## Known gaps (honest, not hidden)

- **No Lighthouse score.** Lighthouse has never run on this project —
  there is no Chrome in the build sandbox. The architecture target is
  ≥95 mobile in all four categories; run it against the production URL
  and add the scores to `docs/qa-report.md` §2. Measured proxies (LCP,
  CLS, axe) are in that report.
- **No real database yet** (Neon + `DATABASE_URL` still open) and
  **no real payments yet** (Zarinpal sandbox merchant ID still open).
- **32 Persian translations** still carry a `TODO(review)` marker that
  is visible to visitors on the fa site — see the handover checklist §1.4.
- **Placeholder Toman prices** and **placeholder contact details** in
  the footer; two matcha images are `tea.webp` stand-ins.
