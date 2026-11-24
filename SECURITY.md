# Security — ela-coffee

> Status: Phase 7 (security hardening), 2026-11-24. This document is the
> security record for the project: what is protected, how, and what is
> still open. It is updated whenever a protection changes.

## 1. Threat model

### Assets (what an attacker would want)

| Asset                                   | Sensitivity                                                                             | Where it lives                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Customer names, phones, emails          | PII — Iranian mobile numbers are the login-free identity of an order                    | Postgres (Neon) in production; in-memory only in the dev fallback          |
| Orders, reservations, contact messages  | Business data + PII                                                                     | Same as above                                                              |
| Payment authority + verification result | Money-adjacent — an authority alone cannot move money, but it proves a payment happened | Same as above; card data **never** touches the app                         |
| Menu / prices                           | Public, but integrity matters (a forged price = lost money)                             | DB/seed; prices are re-read server-side on every order                     |
| Source code, env vars                   | Secrets (`DATABASE_URL`, `ZARINPAL_MERCHANT_ID`)                                        | Git (never), `.env.local` (never committed), Vercel env vars in production |

### Actors

- **Anonymous visitor** — reads the menu, adds to the bag. Untrusted input starts here.
- **Bot / scraper** — mass-submits newsletter/reservation/contact forms, hammers the API.
- **Malicious customer** — forges prices, replays requests, injects HTML/JS into name/message fields, tries cross-site requests from another origin.
- **Network attacker** — only relevant off-HTTPS; Vercel serves HTTPS only in production, HSTS enforces it.

### Trust boundaries

```
Browser (untrusted) ──HTTPS──> Next.js server (validates everything)
        │                              │ Prisma (parameterised queries)
        │                              ├─> Postgres / Neon (TLS)
        │                              └─> Zarinpal (redirect + verify; no card data)
        └─> localStorage bag (client-only, never trusted by the server)
```

Nothing the browser sends is trusted: totals are recomputed, ids are
validated, text is stripped of angle brackets, and every mutation must
prove it came from our own origin.

## 2. OWASP Top 10 (2021) mapping

| #   | Risk                        | Status in this app                                                                                                                                                                                                                                                                                                                                               | Where                                                                                              |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| A01 | Broken Access Control       | ✅ No auth in v1, so there is nothing to bypass — but also nothing protected by auth. Order/reservation lookup by id is **unguessable** (UUID) and returns no PII beyond what the holder already supplied. Auth is a later phase if an admin panel is added.                                                                                                     | `src/lib/memory-store.ts` (`createId` = `crypto.randomUUID()`); `src/app/api/orders/[id]/route.ts` |
| A02 | Cryptographic Failures      | ✅ TLS everywhere in production (Vercel HTTPS + HSTS). No passwords stored, no custom crypto. `DATABASE_URL` is a TLS Postgres string. Secrets live in env vars, never in Git (§6).                                                                                                                                                                              | `next.config.ts` (HSTS), `.env.example`                                                            |
| A03 | Injection                   | ✅ All DB access goes through Prisma (parameterised queries — no SQL strings anywhere). User text is validated by Zod and stripped of `<`/`>` at the schema boundary. React escapes on render; there is **one** sanctioned `dangerouslySetInnerHTML` — the JSON-LD script in `[locale]/layout.tsx` (documented Next.js way to emit JSON-LD; payload is server-built from the trusted `flavours.ts` dataset with `<` escaped to `\u003c`, no user input). | `src/lib/schemas.ts`, `src/lib/store.ts`, `prisma/schema.prisma`                                   |
| A04 | Insecure Design             | ✅ Server-side pricing (client total ignored), idempotency keys, rate limits, honeypots, CSRF — see §4. Threat model is this document.                                                                                                                                                                                                                           | `src/app/api/orders/route.ts`, `src/lib/rate-limit.ts`, `src/lib/csrf.ts`                          |
| A05 | Security Misconfiguration   | ✅ Strict headers (CSP, HSTS, nosniff, frame-ancestors, Permissions-Policy) verified live (§3). No stack traces or Prisma errors in responses — errors are stable `{code, message}` JSON. Debug info is not shipped.                                                                                                                                             | `next.config.ts`, `src/lib/api-errors.ts`                                                          |
| A06 | Vulnerable Components       | ⚠️ **Partially verified.** `pnpm audit` cannot run in the sandbox used to build this repo — the managed registry policy blocks the audit endpoint (403 `policy_denied`). The audit runs in CI instead (`pnpm audit --audit-level high`, fails on high/critical). Lockfile is pinned (`--frozen-lockfile` in CI). First real audit result comes from CI — see §6. | `.github/workflows/ci.yml`, `package.json` (`pnpm audit`)                                          |
| A07 | Auth Failures               | ✅ N/A in v1 — there is no login, no session, no auth cookie. Documented as a residual risk only if auth is added later (§7).                                                                                                                                                                                                                                    | —                                                                                                  |
| A08 | Software/Data Integrity     | ✅ Pinned lockfile, `--frozen-lockfile` installs, no third-party scripts/CDN/fonts (nothing external can be swapped in). `pnpm audit` in CI.                                                                                                                                                                                                                     | `pnpm-lock.yaml`, `next.config.ts` (CSP `default-src 'self'`)                                      |
| A09 | Logging/Monitoring Failures | ⚠️ Minimal: Next.js server logs exist on Vercel; there is no alerting, no audit log of admin actions (no admin exists), and rate-limit rejections are not shipped to a SIEM. Acceptable for v1; revisit if the shop grows.                                                                                                                                       | —                                                                                                  |
| A10 | SSRF                        | ✅ The server makes outbound requests only to Zarinpal (fixed URL, sandbox) and Neon (fixed `DATABASE_URL`). No user-controlled URLs are ever fetched.                                                                                                                                                                                                           | `src/lib/payments/port.ts`                                                                         |

## 3. Security headers (verified live)

Set in `apps/web/next.config.ts` via `headers()` for every route
(pages and API). Verified with `curl -I` against the production
build — see `docs/fa/phase-07-security.md` for the exact output.

| Header                      | Value                                                                                                                                                                                                                                                                                         | Why                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`   | `default-src 'self'; script-src 'self' 'unsafe-inline' (+ 'unsafe-eval' in dev only); style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` | No third-party sources of any kind. The two `unsafe-inline` values are deliberate and documented below. |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                                                                                                                                                                                                                                                | HTTPS-only. `preload` only matters once the real domain is submitted to the preload list.               |
| `X-Content-Type-Options`    | `nosniff`                                                                                                                                                                                                                                                                                     | No MIME sniffing.                                                                                       |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                                                                                                                                                                                                                             | No full URLs leak to other origins.                                                                     |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), payment=()`                                                                                                                                                                                                                                        | The shop needs none of these.                                                                           |
| `X-Frame-Options`           | `DENY`                                                                                                                                                                                                                                                                                        | Defence in depth next to `frame-ancestors 'none'`.                                                      |

### Why CSP keeps `'unsafe-inline'` (honest trade-off)

The strict nonce-based CSP from the Next.js docs was considered and
**not** used, for a documented reason: the bundled Next.js docs state
that nonces require dynamic rendering and that "Partial Prerendering
(PPR) is incompatible with nonce-based CSP" — and this project enables
`cacheComponents` + `partialPrefetching` for performance (architecture
§12, Lighthouse ≥ 95 target). So:

- `script-src 'unsafe-inline'` — Next.js emits inline bootstrap
  scripts that cannot carry a nonce on statically rendered pages.
  `'unsafe-eval'` is added in development only (React uses `eval` for
  dev error stacks, per the Next docs) and never in production.
- `style-src 'unsafe-inline'` — the flavour wheel drives `--rot` /
  `--pour` through React inline `style` attributes, which CSP treats
  as inline styles. A nonce cannot be attached to a style attribute
  at all, so this is the only way the wheel works. Inline styles
  cannot execute code.

Mitigations that keep this acceptable: `default-src 'self'` (nothing
external loads at all), `object-src 'none'`, `base-uri 'self'`, plus
the CSRF + escaping layers in §4. If a stricter policy is ever
required, the trade is to give up PPR and move to nonce CSP via
`proxy.ts`.

**Zod + CSP note:** Zod v4 probes JIT support with `Function("")`
when the first object schema is created. Under this CSP that probe
throws (caught by Zod, validation falls back to interpreted mode),
but it still logs a CSP violation in the console. So the app runs
Zod in jitless mode — `z.config({ jitless: true })` in
`src/lib/schemas.ts` and in the two components that build schemas at
render time (`JoinList.tsx`, `BagDrawer.tsx`). Verified live with
Playwright/Firefox against the production build: the page hydrates
(brand toggle flips `data-brand`), and the console has zero CSP
violations. Cost: none that matters — the schemas are small form/API
shapes.

## 4. API security

### Validation — every route, every input

- All 7 routes validate with Zod schemas shared with the client
  forms (`src/lib/schemas.ts`): newsletter, reservation, order,
  contact. GET routes validate record ids
  (`isValidRecordId`: 1–64 chars, `[A-Za-z0-9_-]`) — malformed ids
  get 400, unknown well-formed ids get 404.
- Errors are stable JSON `{ error: { code, message } }` — no stack
  traces, no Prisma errors, no `node_modules` paths
  (`src/lib/api-errors.ts`). The orders route converts unexpected
  failures to a generic 500 `INTERNAL_ERROR`.
- Length limits on all text fields (name ≤ 100, message ≤ 2000,
  guests 1–12, qty 1–10, max 20 order items).

### CSRF + CORS (`src/lib/csrf.ts`)

- Every POST calls `assertSameOrigin()` first, before rate limiting
  or validation. The `Origin` header (or `Referer` when `Origin` is
  absent) must match the request's own origin; a request with
  neither header is rejected — a browser always sends `Origin` on a
  POST, so a missing header means a non-browser client, which is not
  a supported caller.
- CORS: no wildcard anywhere. `Access-Control-Allow-Origin` is
  echoed only when the request `Origin` is our own origin (plus
  `Vary: Origin`); a cross-origin preflight gets no ACAO header, so
  the browser blocks it. There is no public cross-origin API.
- Tests: `src/lib/security.test.tsx` — cross-origin POST → 403,
  missing Origin → 403, foreign Referer → 403, same-origin → 200,
  preflight behaviour for both origins.

### Rate limits (`src/lib/rate-limit.ts`)

In-memory token bucket, per IP, per route. Verified by tests that
hammer past the limit and assert 429 + `Retry-After`.

| Endpoint               | Limit    |
| ---------------------- | -------- |
| POST /api/newsletter   | 5 / min  |
| POST /api/contact      | 5 / min  |
| POST /api/orders       | 10 / min |
| POST /api/reservations | 10 / min |

**Honest limitation:** the buckets live in one server instance. On
Vercel each serverless instance has its own buckets, so this is a
basic abuse guard, not a distributed limiter. A hosted store (e.g.
Upstash — deliberately not a blocked service in Iran) is the later
step if abuse appears.

### Honeypot

Every form has an invisible `website` field. A filled honeypot gets
a silent 200 and creates/subscribes nothing (tested for all four
mutating endpoints). The schema deliberately _accepts_ a filled
honeypot — validating it away would turn the silent ignore into a
400 and tell the bot it was caught.

### Idempotency + server-side pricing

- `POST /api/orders` honours `Idempotency-Key`: the same key returns
  the original order (`idempotent: true`), so a double-submit or a
  retry can never double-charge or duplicate an order.
- The total is computed server-side from data-layer prices on every
  order. A client-sent total is stripped by Zod and ignored — proven
  by a test that sends `totalToman: 1` and gets the real total back,
  and by the live check in the Phase 6 report.

### Input sanitisation

Names and messages are stripped of `<` and `>` at the Zod boundary
(`noAngleBrackets` in `src/lib/schemas.ts`). React escapes on render
anyway, and there is no `dangerouslySetInnerHTML` anywhere except one
sanctioned use — the JSON-LD script in `[locale]/layout.tsx`, whose
payload is server-built from the trusted `flavours.ts` dataset with
`<` escaped to `\u003c` and no user input — so a
stored `<script>alert(1)</script>` can never execute. Proven by a
test that posts a script payload, reads the order back, and renders
the stored name through React (it appears as text, no `<script>`
element exists).

## 5. Payment security

- Card data **never** touches the app. The customer pays on
  Zarinpal's page and returns with an authority code; the app stores
  only the authority, the amount and the verification result.
- `PaymentPort` (`src/lib/payments/port.ts`): `MockPayment` is the
  default (no network, no real money). `ZarinpalPayment` implements
  the same interface against the Zarinpal sandbox and is only enabled
  with `PAYMENT_PROVIDER=zarinpal` + `ZARINPAL_MERCHANT_ID`.
- Amounts are integers in Toman, re-validated server-side against DB
  prices. Zarinpal converts Toman → Rial (×10).
- **Not built in v1:** the Zarinpal callback. In Zarinpal mode a
  payment stays `PENDING` until the callback verifies it.

## 6. Secrets, dependencies, cookies

- **Secrets:** only `.env.example` is tracked, and it contains
  placeholders only (`DATABASE_URL="postgresql://user:password@…"`
  is a shape, not a credential). No `.env*.local` file exists in the
  repo; `.env*` is git-ignored. Grep-verified: no private keys, AWS
  keys, or tokens in tracked files or in `git log --all -p`.
- **Dependencies:** `pnpm audit --audit-level high` runs in CI and
  fails on high/critical advisories; installs use
  `--frozen-lockfile`. The audit could **not** run in the build
  sandbox (registry policy blocks the audit endpoint — 403
  `policy_denied`), so the first real audit result comes from CI.
  There is no `package-lock.json` (pnpm workspace) — `npm audit` is
  not applicable.
- **Cookies/sessions:** the app has no auth and no session, but it
  sets **one** cookie: `NEXT_LOCALE` (value `fa` or `en`), set by
  next-intl's locale middleware/client navigation. It holds only the
  locale preference — the locale also lives in the URL path, so the
  cookie is a hint, not a token. Attributes: `SameSite=Lax`,
  `Path=/`, `Secure` in production only
  (`localeCookie: { secure: NODE_ENV === "production" }` in
  `src/i18n/routing.ts` — a Secure cookie is dropped over plain HTTP
  and would break locale sync in local dev). It is **not** `HttpOnly`
  on purpose: next-intl's client navigation writes it via
  `document.cookie` on locale switches, and JavaScript cannot write
  an HttpOnly cookie. If a real session cookie is ever added, it must
  be `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`).
- **Bag:** the bag persists in `localStorage` only. Implication: any
  XSS would be able to read the bag — which is why the CSP (§3) and
  the escaping in §4 are the mitigation, and why there is no
  `dangerouslySetInnerHTML`.

## 7. Residual risks (not covered — be honest about them)

1. **No authentication.** Anyone who knows (or guesses) an order id
   can read that order's status. Ids are UUIDs, so guessing is not
   practical, but there is no per-user ownership check. Acceptable
   for v1 (guest checkout by design); an admin panel needs auth.
2. **Per-instance rate limiting** (§4) — a distributed attack across
   many Vercel instances is not stopped by the in-memory buckets.
3. **CSP keeps `unsafe-inline`** for scripts and styles (§3) — the
   documented PPR trade-off. The policy still blocks all external
   sources, objects and framing.
4. **No WAF / DDoS protection** beyond Vercel's platform defaults
   and the rate limits. No alerting on abuse (see OWASP A09).
5. **Zarinpal callback not built** — Zarinpal-mode payments stay
   `PENDING` until it exists (Phase 6 doc).
6. **Dev fallback store** — without `DATABASE_URL` the app keeps
   data in memory that resets on restart. It is never production
   behaviour, but a misconfigured deploy (missing `DATABASE_URL`)
   would silently lose orders. The deploy checklist must include
   verifying `DATABASE_URL` is set.
7. **Dependency audit not yet run** — first result comes from CI
   (§6). If it goes red, fix or document the advisory before
   merging.

## 8. How to verify (for the next developer)

```bash
cd ~/workspace/ela-coffee
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test && pnpm build
pnpm audit --audit-level high   # needs a registry that allows audits

# Headers, against the production build:
pnpm --filter web start --port 3100 &
curl -sI http://localhost:3100/fa | grep -iE "content-security-policy|strict-transport| x-"
curl -sI http://localhost:3100/api/menu | grep -iE "strict-transport| x-"
# The only cookie must be NEXT_LOCALE (locale only), SameSite=Lax,
# Secure in production, and X-Powered-By must be absent:
curl -sI http://localhost:3100/fa | grep -iE "set-cookie|x-powered-by"

# CSRF: a cross-origin POST must be 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3100/api/newsletter \
  -H "Origin: https://evil.example" -H "Content-Type: application/json" \
  -d '{"email":"a@example.com"}'   # expect 403

# Secrets hygiene:
git ls-files | grep -i env          # only .env.example
git log --all -p | grep -iE "BEGIN .*PRIVATE KEY|AKIA[0-9A-Z]{16}"  # no output
```
