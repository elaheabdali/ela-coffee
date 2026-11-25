# ela-coffee

Bilingual (fa default, en) rebuild of the Ela coffee-shop template as a
production Next.js app — a real client deliverable and flagship portfolio
piece. One single page, two brands (coffee `ela` / matcha `midori`)
switched client-side, plus the features the reference does not have: cart,
checkout/reservation with live order status, and Iranian contact channels.

- **Source of truth for fidelity:** `docs/reference-audit.md` (+ visual
  baseline in `docs/reference-baseline/`)
- **Architecture & decisions:** `docs/architecture.md`
- **Phase reports (Persian tutorials):** `docs/fa/phase-01-architecture.md`,
  `docs/fa/phase-02-scaffold.md`
- **Assets:** `ASSETS.md` (licence status: claimed by the client, not yet
  verified — see `docs/reference-audit.md` §9)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict, no `any`) ·
Tailwind CSS v4 · next-intl (`/fa`, `/en`) · Zustand · TanStack Query ·
React Hook Form + Zod · Prisma + Postgres (Phase 6) · Vitest + Playwright ·
pnpm workspaces.

Motion is hand-rolled CSS + IntersectionObserver (no animation library),
reproducing the reference's keyframes 1:1 — see `apps/web/src/app/globals.css`.

## Scripts

```bash
pnpm install            # install (frozen lockfile)
pnpm dev                # dev server → http://localhost:3000/fa
pnpm typecheck          # tsc --noEmit in every package
pnpm lint               # ESLint across the repo
pnpm test               # Vitest (run once)
pnpm test:watch         # Vitest in watch mode
pnpm build              # production build
pnpm format             # Prettier --write
```

## Structure

```
apps/web/            # the only app in v1
packages/ui/         # design system (React + Tailwind only)
packages/i18n/       # fa/en dictionaries + formatters (Jalali, Toman, fa digits)
packages/config/     # shared TypeScript / ESLint / Prettier presets
docs/                # audit, architecture, per-phase reports
assets-original/     # supplied template assets — never modified
```

## Status

- Phase 0 (audit) — done, confirmed.
- Phase 1 (architecture) — done, confirmed.
- Phase 2 (monorepo scaffold & tooling) — done; see
  `docs/fa/phase-02-scaffold.md`. Placeholder page only; the full wheel and
  sections land in Phase 4.
