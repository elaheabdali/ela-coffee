# Zarinpal setup — real payments (batch 9, item 6)

> **Status: the gateway is the REAL Zarinpal sandbox, and the sandbox
> API round-trip has been verified live from this environment (see
> [Live sandbox probe](#live-sandbox-probe)). No real money can move:
> the sandbox charges nothing and the merchant ID is a test UUID, not
> a credential. What is still NOT verified: completing a payment on
> the sandbox StartPay page in a browser and landing on the success
> page with the order PAID — that step needs a browser, and the
> coordinator runs it during final verification. Live (real-money)
> payment needs a registered Zarinpal account and its real merchant
> ID; no account has been created, and none is needed for the sandbox.**

## How the flow works

```
Customer checks out
  → POST /api/orders (total computed server-side; the client total is ignored)
  → PaymentPort.createPayment(order)          [Zarinpal sandbox]
  → browser is redirected to the gateway URL  [sandbox StartPay]
Customer pays (or cancels) on the sandbox gateway
  → gateway redirects to GET /api/payments/callback?Authority=…&Status=OK|NOK
  → handlePaymentCallback (src/lib/payments/callback.ts):
      Status ≠ OK            → order FAILED, gateway is never called
      order already PAID     → "paid", no second verify (idempotent replay)
      Status = OK            → verifyPayment(authority, order.totalToman)
                              → verified → order PAID, else FAILED
  → redirect to /{locale}/payment/success or /{locale}/payment/failed
```

Rules the code enforces:

- **Amounts are Rial on the wire, Toman in the app.** Zarinpal wants
  Rial, so the port sends `amountToman * 10` on both the request and
  the verify call.
- **The amount is always the server-side order total.** The callback
  query carries no amount at all (Zarinpal sends only `Authority` +
  `Status`), and the verify call uses `order.totalToman` read from the
  store — a forged client total can never reach the gateway.
- **The merchant ID never leaves the server.** It is read from env at
  request time and only ever sent to Zarinpal's API. It is never a
  `NEXT_PUBLIC_` variable.
- **No card data is stored.** The app never sees a card number; it
  stores only the authority, the amount and the verification result.
- **Idempotency, twice over.** `POST /api/orders` honours an
  `Idempotency-Key` header (same key → same order, no double charge),
  and the callback is safe to deliver twice (an already-PAID order is
  returned as paid without a second verify call — Zarinpal answers a
  repeat verify with code `101`, "already verified").
- **Verify codes:** `100` = verified first time, `101` = already
  verified. Both count as paid. Anything else = failed.

## Environment variables

| Variable               | Required             | Value                                                                                                                                                                                                                                                    |
| ---------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PAYMENT_PROVIDER`     | yes                  | `zarinpal` — the real gateway. `mock` (the code default when unset) is the offline stand-in only: no network, checkout redirects to the mock gateway page and completes via the callback, exactly like the real flow |
| `ZARINPAL_SANDBOX`     | no                   | `"true"` (default) = the real sandbox at `sandbox.zarinpal.com`. `"false"` = production at `payment.zarinpal.com`. Sandbox-first is deliberate: a missing flag can never silently point at live payments                                                 |
| `ZARINPAL_MERCHANT_ID` | only when `zarinpal` | Test UUID for the sandbox (see below); the real 36-character merchant ID for production                                                                                                                                                                  |
| `ZARINPAL_BASE_URL`    | no                   | Escape hatch that overrides the host the flag selects. Leave unset in normal use                                                                                                                                                                         |
| `NEXT_PUBLIC_SITE_URL` | yes, in production   | Public base URL, e.g. `https://ela-coffee-yi88.vercel.app`. The payment request builds its `callback_url` from it (`{site}/api/payments/callback`), so it must be the real public domain — a `localhost` callback URL cannot receive Zarinpal's redirect |

## The sandbox merchant ID — no account needed

The sandbox accepts **any UUID** as the merchant ID and moves no real
money, so no Zarinpal account, bank Sheba, or tax/enamad step is
needed to test. The configured value is a randomly generated test
UUID, committed in `.env.example` as a clearly-marked placeholder —
**not a credential, not a real merchant ID**:

```
ZARINPAL_MERCHANT_ID="e559409c-3172-4d73-aa25-86b761191865"
```

Sandbox authorities start with `S` (production ones with `A`), and
sandbox test payments use Zarinpal's test card flow on the sandbox
StartPay page. If a real Zarinpal account is ever created, its
merchant ID simply replaces this placeholder — nothing else changes.

## Setting the variables in Vercel

Vercel dashboard → project `ela-coffee-yi88` → Settings →
Environment Variables. Add for the **Production** environment (and
Preview, if the sandbox should be testable on preview deploys):

- `PAYMENT_PROVIDER` = `zarinpal`
- `ZARINPAL_SANDBOX` = `true`
- `ZARINPAL_MERCHANT_ID` = `e559409c-3172-4d73-aa25-86b761191865`
  (the test UUID — no real money, no account)
- `NEXT_PUBLIC_SITE_URL` = `https://ela-coffee-yi88.vercel.app`
  (already set — verify it, because the callback URL is built from it)

Then **Redeploy** (a plain redeploy picks up env changes; no code
change is needed). For local development, copy `.env.example` to
`apps/web/.env.local` — it already carries the sandbox configuration.

Note: the E2E suite assumes the Mock provider (its checkout tests
assert the mock gateway URL and the PAID state after the callback), so run
`pnpm test:e2e` with `PAYMENT_PROVIDER` unset or `mock` in the test
environment. The sandbox leg is covered by the live probe below and
by the mocked unit tests, not by the browser suite.

## Live sandbox probe

Run from this VM on 2026-11-26 against the real sandbox, with the
test UUID above and amount 10,000 Rial. No real money moved (the
sandbox cannot move any).

1. **Payment request** — `POST
https://sandbox.zarinpal.com/pg/v4/payment/request.json` →
   HTTP 200:
   ```json
   {
     "data": {
       "authority": "S000000000000000000000000000000q1zyq",
       "fee": 1000,
       "fee_type": "Merchant",
       "code": 100,
       "message": "Success"
     },
     "errors": []
   }
   ```
   Code `100` with a sandbox (`S…`) authority: the sandbox accepted
   the test merchant ID and the request shape (Rial amount,
   callback URL, metadata).
2. **Verify of the unpaid session** — `POST
https://sandbox.zarinpal.com/pg/v4/payment/verify.json` with the
   same authority and amount → HTTP 401:
   ```json
   {
     "data": {},
     "errors": {
       "message": "Session is not valid, session is not active paid try.",
       "code": -51,
       "validations": []
     }
   }
   ```
   Code `-51` is the expected answer for an unpaid session, and it is
   exactly the shape `verifyPayment` treats as "not verified".

(One earlier request attempt timed out after 30 s with 0 bytes; the
retry 60 s later answered in 1.8 s. The sandbox itself is reachable —
its root answered 301 in 1.6 s — so the first timeout was a transient
stall, not a block. If a request ever stalls in production, the
checkout surfaces the order error; it never marks an order paid
without a successful verify.)

## How to test (sandbox)

1. Deploy with the variables above (or run locally for the mock leg).
2. On the live site, add a drink to the bag, check out with a name and
   an Iranian mobile — the browser must leave the site for the
   sandbox StartPay page (`sandbox.zarinpal.com/pg/StartPay/…`).
3. Complete the test payment on the sandbox page. Zarinpal redirects
   to `{site}/api/payments/callback?Authority=…&Status=OK`, which
   verifies with the sandbox API and redirects to
   `/{locale}/payment/success` with the order number. The order row
   must read `PAID`.
4. Cancel a second payment on the gateway (`Status=NOK`): the site
   must land on `/{locale}/payment/failed` and the order must read
   `FAILED` — and the gateway must never have been called to verify.
5. Refresh the success page / re-visit the same callback URL: the
   order must stay PAID (idempotent replay, no double verify).

Steps 3–5 need a browser and are the part still to be verified (the
coordinator runs them during final verification). The API legs behind
them are already proven by the probe above and by the unit tests with
mocked Zarinpal responses (`apps/web/src/lib/payments.test.ts`,
`callback.test.ts`). Without credentials, the same loop is also
testable locally with the Mock provider — see
`apps/web/tests/e2e/payment.spec.ts`, which follows the mock gateway
URL from the order response, "pays" on the mock gateway page
(`/payment/mock`), and asserts the success page.

## Switching to production (later, separate step)

Production is a **configuration + credentials** change, not a code
change — but it must not be done casually:

1. **Create a real Zarinpal account** (the shop's or the client's —
   that choice is still open) and complete its identity verification,
   bank Sheba, and tax/enamad steps. No account has been created for
   this project, and creating one requires the account holder — it
   cannot be done by this agent.
2. Get the real 36-character merchant ID from the **production**
   Zarinpal panel (`https://www.zarinpal.com`) and send it in chat —
   never in code, git, or a file. A sandbox/test merchant ID does not
   work in production.
3. Set `ZARINPAL_SANDBOX=false` and `ZARINPAL_MERCHANT_ID=<real ID>`
   in Vercel. The API host becomes `payment.zarinpal.com` and the
   StartPay page becomes `www.zarinpal.com/pg/StartPay/…`
   automatically (see `zarinpalStartPayBaseUrl` in
   `src/lib/payments/port.ts`).
4. Register the production callback URL in the Zarinpal panel — the
   callback URL must match the registered domain, or Zarinpal rejects
   the payment request (error `-14`).
5. Run one small real transaction end-to-end and confirm the order
   flips to PAID before announcing payments as live.

## What is still NOT verified

- **Completing a sandbox payment in a browser** (steps 3–5 above):
  the request and verify legs are proven live, but nobody has yet
  paid on the sandbox StartPay page and watched the callback mark an
  order PAID. That is the one remaining sandbox check, and it needs a
  browser.
- **Live payment**: needs a registered account and its real merchant
  ID (see above). Until then, treat real-money payment as
  **not set up** — the sandbox is real, the money is not.
