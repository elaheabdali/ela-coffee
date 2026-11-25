# QA Report — Performance & Accessibility (Phase 9)

- **Date:** 2026-11-24
- **Scope:** `apps/web` (`/fa` and `/en`), production build, before vs after the Phase 9 changes.
- **Status:** axe violations **2 → 0** in all 8 tested states; measured image bytes down; JS transfer down. Lighthouse **could not run in this sandbox** (see §1) — no Lighthouse score in this report, by design, not by omission.

## 1. How everything was measured (method + environment)

| Item      | Value                                                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App       | `pnpm build` + `pnpm start --port 3105` (production, `NODE_ENV=production`)                                                                                                                                                    |
| Browser   | Playwright **1.57.0** + cached Firefox (`firefox-1572`), headless                                                                                                                                                              |
| Viewport  | **390×844, DPR 2**, mobile user-agent (Firefox has no `isMobile` emulation)                                                                                                                                                    |
| Network   | localhost, **no throttling** — numbers are best-case; real 4G will be slower                                                                                                                                                   |
| Metrics   | `PerformanceObserver` injected before load: `largest-contentful-paint`, `layout-shift` (excluding `hadRecentInput`), `event` entries (INP proxy), `longtask`; `performance.getEntriesByType("resource")` for transferred bytes |
| Procedure | Load → wait 2.5 s → scroll through the whole page in 400 px steps (triggers lazy images + reveals + scroll-linked flavour cycling) → wait 2 s → click a featured flavour button → click the brand toggle (desktop check, §5)   |
| Runs      | Baseline ×1, After ×2 (LCP varies run to run — see §2 note)                                                                                                                                                                    |
| Scripts   | `/tmp/perf/measure.mjs`, `axe.mjs`, `probe-incomplete.mjs`, `wheel-check.mjs` (scratch, not in the repo)                                                                                                                       |

### Lighthouse — could not run (honest gap)

Lighthouse **13.6.0** installs and prints its version, but a run fails because there is no Chrome/Chromium on this machine:

```
$ npx -y lighthouse http://localhost:3105/fa --only-categories=performance \
    --output=json --output-path=/tmp/perf/lh-fa.json \
    --chrome-flags="--headless --no-sandbox"
Runtime error encountered: The CHROME_PATH environment variable must be set
to a Chrome/Chromium executable no older than Chrome stable.
```

`which google-chrome chromium chromium-browser` returns nothing, and system Chromium is blocked by the Hatch WebGL policy. **What to do instead:** after the Phase 11 deploy, run the same command against the production URL (or Chrome DevTools → Lighthouse, mobile, simulated throttling) and paste the scores here. The architecture target is Lighthouse ≥ 95 mobile in all four categories; nothing in this report claims it.

## 2. Core Web Vitals + transfer, before vs after

LCP is animation-dependent on this page (the hero scene pours in over 1.2 s and the wheel over 1.6 s), so it moves between runs. All three measured runs are reported; no cherry-picking.

| Metric (390×844, localhost, no throttling)            | Baseline (run 1)    | After (run 1)       | After (run 2)       |
| ----------------------------------------------------- | ------------------- | ------------------- | ------------------- |
| **LCP `/fa`**                                         | 1,158 ms            | 1,888 ms            | 1,498 ms            |
| **LCP `/en`**                                         | 1,102 ms            | 869 ms              | 768 ms              |
| **CLS `/fa` / `/en`**                                 | 0.0000 / 0.0000     | 0.0000 / 0.0000     | 0.0000 / 0.0000     |
| **Max interaction-event duration (`/fa` / `/en`)**¹   | 88 ms / 48 ms       | 56 ms / 64 ms       | 64 ms / 72 ms       |
| **DOMContentLoaded `/fa` / `/en`**                    | 754 ms / 560 ms     | 1,197 ms / 585 ms   | 898 ms / 460 ms     |
| **Total transferred `/fa` / `/en`**                   | 1,146 KB / 1,064 KB | 1,105 KB / 1,094 KB | 1,173 KB / 1,094 KB |
| **JS transferred**                                    | 247 KB              | 234 KB              | 234 KB              |
| **Images transferred (`img` initiator)**              | 300 KB              | 264 KB              | 264 KB              |
| **Preloads (`link` initiator)**²                      | 348 KB / 347 KB     | 357 KB / 425 KB     | 425 KB / 425 KB     |
| **Fonts + other (`other` initiator)**                 | 250 KB / 169 KB     | 248 KB / 169 KB     | 248 KB / 169 KB     |
| **Console errors / failed requests / CSP violations** | 0 / 0 / 0           | 0 / 0 / 0           | 0 / 0 / 0           |
| **JSON-LD present on `/fa`**                          | yes                 | yes                 | yes                 |

¹ **INP proxy, not a lab INP score:** the largest `PerformanceObserver` `event` entry (click/scroll/keydown handlers) after load and interaction. INP "good" is < 200 ms; every run is well inside that. A real INP needs field data or a Lighthouse run.

² Preload bytes vary because the scroll-linked hero cycles flavours while the script scrolls: each new flavour mounts a priority scene image preloaded at 1920w (~70 KB). Baseline cycled 4 flavours, the after-runs 5. That is the design (audit §3.5 geometry — the scene frame is 957 CSS px wide on mobile, so 1920w at DPR 2 is the correct choice, not a bug), not a regression.

**Reading the table honestly:** CLS is 0 in every run (no layout shift from fonts or images). Image bytes fell 300 → 264 KB (−36 KB, the tile `sizes` fix, §3). JS fell 247 → 234 KB (−13 KB, the on-demand dialog/drawer chunks, §3). Total transfer is dominated by run-to-run flavour-cycling variance, so it is roughly flat. LCP did not improve measurably — it was already ~1.1 s on localhost and is dominated by the pour/wheel-in animations, which are the user's top priority and were deliberately kept.

## 3. What changed (and what did not)

### Images

| File (2528×1696 source)  | Before      | AVIF (SVT-AV1 CRF 32, preset 6) | WebP (q 75)       | PSNR AVIF / WebP | SSIM AVIF / WebP |
| ------------------------ | ----------- | ------------------------------- | ----------------- | ---------------- | ---------------- |
| `ingredients-key.jpg`    | 1,338,050 B | 42,312 B (−96.8%)               | 71,474 B (−94.7%) | 46.1 / 44.8 dB   | 0.991 / 0.990    |
| `ingredients-v2-key.jpg` | 1,474,669 B | 51,670 B (−96.5%)               | 76,974 B (−94.8%) | 45.9 / 43.8 dB   | 0.991 / 0.989    |

Visual check at 1440 px (side-by-side JPG/AVIF/WebP contact sheets): no visible difference. PSNR > 40 dB and SSIM ≥ 0.989 confirm it objectively.

**Important scope note:** neither JPG is referenced by any page (verified by grep over `apps/web/src` — they are the keying source for `scripts/key-cutouts.py`, which reads them from `public/images/`). The re-encode therefore changes **no page-load bytes today**; it is readiness for the day they are used on a page. The real served-image wins are below.

**Served images (the ones users actually download):**

- `next/image` optimisation is active and verified live: `/_next/image?url=/images/scenes/original.webp&w=640` returns a **640×357 WebP, 11.4 KB** (from a 77 KB 1920 px source) with Firefox's `Accept: image/avif,image/webp,…`. With `Accept: image/avif` only it returns JPEG — Next does not convert WebP sources to AVIF, so AVIF is not served for the `.webp` scenes; WebP at these sizes is already efficient.
- `sharp` was only a **transitive** dependency (Next's own optional dependency in the pnpm store). It is now an **explicit dependency of `apps/web`** (`"sharp": "^0.35.5"` in `apps/web/package.json` + lockfile), so image optimisation cannot silently disappear from a future install. (Note: `pnpm add sharp` failed with the known overlay-FS `EPERM` on lockfile rewrite; the lockfile was regenerated with `rm pnpm-lock.yaml && pnpm install` — the resulting diff is only the `sharp` importer entry plus `@img/colour` losing `optional: true`.)
- **Tile ring `sizes` fixed** (`FlavorWheel.tsx`): `200px` → `160px`. Tiles display at ≤ 171 CSS px (`--tile ≤ 0.19 × --s`); at DPR 2 the browser was fetching the 640w variant (10–11 KB per tile). Now it fetches 384w (**5 KB per tile**). Measured: 6 coffee tiles 66 KB → 30 KB per brand view; page `img` transfer 300 → 264 KB.
- **Hero `sizes` deliberately unchanged:** `(max-width: 640px) 900px, 100vw` looks wrong on a 390 px phone, but the scene frame is 957 CSS px wide (audit §3.5 geometry: `--s: min(100cqh, 137cqw)`, `--scene-w: 1.7917 × --s`), centre-cropped by `overflow: hidden`. Only the middle ~41% is visible, so 1920w at DPR 2 is the correct choice for a sharp visible crop. Changing it would blur the hero.
- **No other image > 300 KB exists** in `public/images/` besides the two JPGs above. Scenes are ≤ 96 KB source and served optimised; cutouts ≤ 57 KB (untouched — re-keyed in Phase 4). No image was deleted.
- Hero scene keeps `priority` (preload for LCP); below-the-fold images keep `next/image` default lazy loading (verified: menu/process images load at `w=828` on scroll, not on initial load).

### JavaScript — dialogs/drawers now load on demand

Architecture §12 promised "dialogs lazy" but it was never implemented — everything was statically imported. Now, per the bundled Next.js 16 lazy-loading guide (`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`):

- `SiteHeader`: `BagDrawer` + `MenuDrawer` via `next/dynamic`, mounted only while open (`{bagOpen ? <BagDrawer /> : null}`). Both return `null` when closed, so conditional mounting is behaviour-identical (no exit animation exists to lose).
- `FlavorControls`: `AllFlavorsDialog` + `TastingNotesDialog` via `next/dynamic` (they were already mounted only while open).
- The flavour wheel itself is **not** lazy — it is the LCP-critical hero.
- Measured JS transfer: **247 KB → 234 KB** (−13 KB on first load). The dialog/drawer chunks (react-hook-form + zod + OrderStatus in the bag drawer) now load on first open instead. Tests that open dialogs were updated to `findBy*` (async) — see §6.

### Fonts

Self-hosted, unchanged, verified: `next/font/local` with `display: "swap"` for Fraunces/Manrope/Geist Mono; Vazirmatn via `@fontsource-variable/vazirmatn` (CSS import, `unicode-range` subsets — the browser downloads only the subsets it needs: arabic 46 KB + latin 34 KB on `/fa`). Largest single font is Fraunces Black, 118 KB transfer (latin-subset woff2, single weight) — already subset; no further win available without re-subsetting the supplied file. No render-blocking font request: `font-display: swap` + Next's automatic fallback metrics.

## 4. Accessibility — axe-core

Tool: `axe-core` 4.10.3 (the repo's existing dependency, injected into the live page in Firefox), run on the full page in **8 states**: `/fa` + `/en` × {static page, MenuDrawer open, flavour dialog open, BagDrawer open}.

|                | Before (2026-11-24)  | After (2026-11-24)                        |
| -------------- | -------------------- | ----------------------------------------- |
| **Violations** | **2** in every state | **0 in all 8 states**                     |
| **Incomplete** | 3 per state          | 1 per state (`color-contrast`, see below) |

### Violations fixed

1. **`definition-list` + `dlitem` (serious)** — `Story.tsx`: the stats `<dl>` had `<dt>`/`<dd>` nested two `<div>`s deep (`<dl>` → `<Reveal>` div → `<div class="flex flex-col">` → `dt`/`dd`). axe requires `dt`/`dd` to sit directly in the `<dl>` or in a `<div>` that is itself a direct child of the `<dl>`. Fix: the `Reveal` wrapper now carries the flex classes itself, so the `dt`/`dd` pair sits directly in it. Covered by a new test in `sections.test.tsx`.
2. **`aria-prohibited-attr`** — `WordReveal` put `aria-label` on a `<p>` (the flavour name). Fix: `aria-label` is now set only for headings (`h1`/`h2`/`h3`); for multi-word `<p>`/`<span>` the words are `aria-hidden` and the full text is provided once in a visually-hidden span (single words need no duplication — there is no boundary to lose). Covered by a new test in `WordReveal.test.tsx`.

### Incomplete items — reviewed, not violations

- **`color-contrast` (fa ×5, en ×8)** — axe _could not determine_ the contrast because the text sits on a background gradient, a photograph, or a partially-obscured element. Every such pair was verified manually from the theme tokens (computed ratios below). **All pass WCAG 2.2 AA (4.5:1 normal, 3:1 large) with margin.**
- **`label-content-name-mismatch`** (was present before) — fixed: the `Stepper` "−"/"+" buttons had `aria-label="Decrease quantity"` while the visible label is the symbol. Now the symbol stays in the accessible name (`"− Decrease quantity"`, `"+ Increase quantity"`) with the spoken label in a visually-hidden span. Covered by updated `Stepper` tests.

### Contrast ratios (computed from the theme tokens in `globals.css`)

| Pair                                     | kuro  | midori | AA bar         |
| ---------------------------------------- | ----- | ------ | -------------- |
| H1 foreground on lightest stage gradient | 14.51 | 11.19  | 3:1 (large) ✅ |
| H1 foreground on darkest stage           | 17.22 | 16.58  | 3:1 ✅         |
| Muted foreground on page background      | 8.28  | 8.44   | 4.5:1 ✅       |
| Muted foreground on lightest gradient    | 7.09  | 6.00   | 4.5:1 ✅       |
| Primary button text on primary           | 8.22  | 9.35   | 4.5:1 ✅       |
| Foreground on accent (hover)             | 13.79 | 11.67  | 4.5:1 ✅       |
| Story stat label (espresso 70% on cream) | 6.88  | 6.31   | 4.5:1 ✅       |
| Story body (espresso 80% on cream)       | 9.74  | 8.90   | 4.5:1 ✅       |
| Footer muted on roast                    | 7.73  | 7.58   | 4.5:1 ✅       |
| Footer cream on roast                    | 15.40 | —      | 4.5:1 ✅       |

The two pairs axe could not evaluate over photography (flavour counter "1 / 6" and "Scroll to taste" over the scene photo) use cream/muted text on a dark coffee photo; they were checked visually at 1440 px and 390 px — the text sits on the darkest part of the image.

### Keyboard navigation

25 Tab stops from the top of `/fa` and `/en`, all **visible and in logical order** (menu → wheel region → add-to-bag → featured flavours → scroll links → menu cards → newsletter → reservation). Focus outline: solid 2–3 px in the brand ring colour on every stop.

**One real bug found and fixed:** the wheel region (`div[tabindex="0"].kuro-stage`) had Tailwind's `outline-none` class, which beat the global `:focus-visible` rule (utility layer wins over the base layer), so keyboard users tabbing to the wheel saw **no focus ring at all**. The class is removed; the stage now shows the global `2px solid var(--ring)` ring on `:focus-visible` (verified live: `solid 2px rgb(217, 160, 102)`, offset 2 px, after a real Tab/keyboard focus — programmatic `.focus()` alone does not trigger `:focus-visible`, by design).

### Reduced motion

With `prefers-reduced-motion: reduce` emulated: `matchMedia` matches, float/word animations compute to `animation: none`, hidden reveals render at opacity 1, `scroll-behavior` is `auto`. The CSS in `globals.css` §6 already handled this correctly — verified live, no change needed. The motion-pause toggle (`data-motion="paused"`) still works independently of the media query.

### Screen-reader labels

Wheel region has `role="region"` + `aria-label` (hero title); dots are buttons with the flavour name; featured buttons, add-to-bag (with price), dialogs (`role="dialog"` + title), drawers, stepper (now with the symbol in the name), and form fields are all labelled. No new unlabeled control was found.

## 5. Motion still works (the user's top priority)

Verified live on the production build after all changes (desktop 1280×800 — the header brand toggle is `max-sm:hidden`, so the mobile check uses the MenuDrawer copy):

- Brand toggle flips `html[data-brand]` **kuro → midori → kuro** in both locales (Playwright click and DOM click).
- Wheel keyboard: `ArrowRight` on the focused stage moves the counter **1 / 6 → 2 / 6** and the flavour name changes (Original → Caramel).
- Pour (1.2 s), wheel-in (1.6 s), float (7 s), marquee, word stagger (65 ms) all intact — confirmed visually at 1440 px in both locales (screenshots in `/tmp/perf/after1440-*-hero.png`, scratch).
- **One measurement quirk, not a product bug:** at the 390 px mobile viewport the header toggle is hidden by design, so the first toggle probes targeted a `max-sm:hidden` element (0×0 box) and timed out. The toggle itself was never broken.

## 6. Tests + verification

| Check                            | Result                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | ✅ pass                                                                                                                                   |
| `pnpm typecheck`                 | ✅ pass (i18n, ui, web)                                                                                                                   |
| `pnpm lint`                      | ✅ pass — 0 errors, 1 pre-existing warning (React Compiler `watch` note in ReservationForm, from Phase 6)                                 |
| `pnpm test`                      | ✅ pass — **224 tests, 30 files** (was 219/30; +5 new: hero priority, tile sizes, wheel focus, Story dl structure, WordReveal `<p>` case) |
| `pnpm build`                     | ✅ pass — routes `/fa`, `/en`, design-system, all 7 API routes, `/robots.txt`, `/sitemap.xml`                                             |

Test changes (all in the spirit of the production change, not to make tests pass by weakening them):

- `FlavorWheel.test.tsx`: `next/image` mock now forwards `priority`/`sizes`/`fetchPriority`; new tests for hero priority + `sizes` containing `100vw`, tile `sizes="160px"`, and the wheel stage having no `outline-none` + `tabindex="0"`.
- `sections.test.tsx`: new test that every stats `dt`/`dd` is a child of the `<dl>` or of a `<div>` directly under it.
- `WordReveal.test.tsx`: new test that `as="p"` renders no `aria-label` and provides the full text in a visually-hidden span.
- `Stepper.test.tsx`: accessible names updated to `"− Decrease quantity"` / `"+ Increase quantity"` (the fix's whole point).
- `bag.test.tsx`: same name update for the two stepper queries.
- `controls.test.tsx` + `header.test.tsx`: dialog/drawer assertions that open a dynamic chunk now use `findBy*` (async) — the chunk loads after the click.

## 7. Known TODOs / blockers

- **Lighthouse ≥ 95 mobile is unverified in this sandbox** (no Chrome). Run Lighthouse against the production URL after the Phase 11 deploy and add the scores to §2. The measured CWV proxies (LCP ~0.8–1.5 s unthrottled localhost, CLS 0, interaction events < 90 ms) are consistent with a good score, but that is not a Lighthouse result.
- **LCP variance:** fa LCP measured 1,158 / 1,888 / 1,498 ms across three runs (en: 1,102 / 869 / 768 ms). The spread comes from the pour/wheel-in animations and first-run image-optimisation warm-up. A throttled 4G Lighthouse run will give the comparable number.
- The two re-encoded key images are **not on any page yet** — confirm whether `ingredients-v2-key` is the matcha sprite before using the AVIF/WebP on a page.
- Still open from earlier phases (unchanged): Neon + `DATABASE_URL`, Zarinpal sandbox merchant ID, real contact details, 32 TODO(review) translations, licence evidence, placeholder Toman prices.

## 8. Commands to re-run this

```bash
cd ~/workspace/ela-coffee
pnpm install --frozen-lockfile
pnpm dev                 # http://localhost:3000/fa
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# Production measurement (after Phase 11, replace the URL):
pnpm build && pnpm start --port 3105
npx -y lighthouse http://localhost:3105/fa --only-categories=performance,accessibility,best-practices,seo \
  --output=html --output-path=/tmp/lh-fa.html \
  --chrome-flags="--headless --no-sandbox"
```

## 9. Phase 10 — E2E + visual regression (2026-11-24)

Playwright 1.65.1, Firefox (cached `firefox-1572`) locally, Chromium for
the functional project in CI (`E2E_BROWSER=chromium`).

| Suite | Result |
| --- | --- |
| Unit (Vitest) | **224 tests, 30 files** — unchanged from Phase 9 |
| E2E functional (`--project=e2e`) | **48 tests** — hero, bag + checkout, forms, SEO/error, axe — all green in both locales |
| Visual (`--project=visual`) | **10 tests** — hero + full page at 360/768/1024/1440/1920 px × fa/en, 2% pixel tolerance, baselines in `apps/web/tests/visual/baseline/` (20 PNGs, 37 MB). **Baselines were deleted and regenerated from the fixed build** (the old ones showed the pre-fix dark-on-dark menu cards — `--update-snapshots` alone had not rewritten them because the diff stayed under the 2% tolerance; see `docs/fa/phase-10-testing.md` §3). Run twice back-to-back after regeneration: 10/10 both times, no false diffs. |
| Axe (in E2E) | 0 violations on the static page, menu drawer open, and tasting-notes dialog open, per locale — **after the two contrast fixes below**. The a11y static test now scrolls through the page before running axe (Phase 9 method: measure the page as the user sees it). |

Bugs found & fixed (full list in `docs/fa/phase-10-testing.md` §6):
- **REAL APP BUG — menu-card contrast 1.05:1:** drink names and prices were dark text (`text-espresso`) inherited from the light `bg-cream` section on the dark `bg-card` card — nearly invisible. Fixed by adding `text-foreground` to the `MenuCard` article (`MenuCard.tsx`). MenuCard was the only `bg-card` without `text-foreground` in the codebase.
- **REAL APP BUG — section-eyebrow contrast 1.99:1:** the Story/Menu/Origins eyebrows used `--muted-foreground` (`#b9a690`, designed for dark backgrounds: 8.28:1 on espresso) on cream. Fixed with `text-espresso/70` (6.88:1) at the three call sites. The Phase 9 contrast table had no cream-background row for this token, which is how it was missed.
- **Why Phase 9 missed them is unexplained:** both contrasts are deterministic, not timing-dependent; Phase 9 reported axe 0 violations in all 8 states with color-contrast "incomplete". Phase 10's E2E run is what surfaced them — recorded honestly, without re-litigating Phase 9's result.
- **Test-side fix — Firefox lazy loading:** a fast scroll-through (600 px / 60 ms) jumps past Firefox's lazy-load trigger, so the 2nd menu row never started loading and the visual test timed out at 1440/1920 px. Fixed with a slow scroll (300 px / 250 ms) + a wait for all images to complete (60 s timeout). Not an app bug — the browser picks the correct 640w variant per `sizes`, and a warm cache loads in seconds.
- **Baseline-regeneration lesson:** `--update-snapshots` only rewrites snapshots whose test failed; the contrast fix changed fewer than 2% of pixels by pixelmatch's measure (dark-on-dark differences count as similar), so the stale baselines kept passing. The 20 baselines were deleted and regenerated from the fixed build, then visually spot-checked (en-1440 menu, fa-360 hero).
- **axe-core 4.14.1 crashes Firefox** when the tasting-notes dialog is open (`Page crashed` inside `AxeBuilder.analyze`); axe-core 4.10.2 analyses the same state cleanly. `@axe-core/playwright` is pinned to **4.10.2** — re-test before upgrading.
- Other test-side fixes (not app bugs): Mock payment marks orders PAID immediately; the reservation Stepper's `<output>` has implicit `role=status`; API clients must send a same-origin `Origin` (CSRF); Playwright's role-name matching is substring-based.
- **Not a bug:** unmatched routes render `global-not-found.tsx`, which is fa-first by design — `/en/does-not-exist` shows the Persian 404 with the English paragraph inline.

CI: `.github/workflows/ci.yml` gained a real `e2e` job (install → `playwright install --with-deps chromium firefox` → `pnpm --filter web test:e2e`). It has not run yet — the first real run happens on push in Phase 11.
