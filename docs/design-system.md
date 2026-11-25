# Design System — ela-coffee (Phase 3)

- **Status:** Phase 3 — complete, awaiting user confirmation before Phase 4.
- **Source of truth for values:** `docs/reference-audit.md` §3 (tokens) and §4 (animations).
- **Code:** `packages/ui/src/` (React + Tailwind only, no `next/*` imports).
- **Catalogue:** `/fa/design-system` and `/en/design-system` (dev-only, `noindex`,
  not linked from any navigation) — renders every component in all variants,
  with the brand toggle working.
- **Language rule:** code, comments and this document are in English.
  Explanations to the user are in Persian (`docs/fa/phase-03-design-system.md`).

## 1. Tokens

All tokens live in `apps/web/src/app/globals.css`: raw values in `:root`
(ela) and `html[data-brand="midori"]` (midori), exposed to Tailwind through
`@theme inline`. Switching brand is a runtime variable swap — no rebuild.

### 1.1 Colour

| Token                                  | Ela (coffee)                             | Midori (matcha)                           | Role                               |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------- | ---------------------------------- |
| `--background`                         | `#120b08`                                 | `#0e180c`                                 | Page / hero background             |
| `--foreground`                         | `#f6eee3`                                 | `#eef0e1`                                 | Primary text on dark               |
| `--card` / `--popover`                 | `#1b120d`                                 | `#162212`                                 | Card / dialog surface (dark)       |
| `--primary`                            | `#d9a066`                                 | `#a9c46c`                                 | Accent (crema)                     |
| `--primary-foreground`                 | `#1a0f09`                                 | `#0e180c`                                 | Text on accent                     |
| `--secondary`                          | `#2a1c14`                                 | `#1d2c18`                                 | Secondary surface                  |
| `--muted`                              | `#241811`                                 | `#192616`                                 | Muted surface                      |
| `--muted-foreground`                   | `#b9a690`                                 | `#a9b598`                                 | Muted text                         |
| `--accent`                             | `#2e1f16`                                 | `#22331c`                                 | Accent surface                     |
| `--ring`                               | `#d9a066`                                 | `#a9c46c`                                 | Focus ring                         |
| `--destructive`                        | `#e40014`                                 | `#e40014`                                 | Errors                             |
| `--border` / `--input`                 | `#f6eee31f` / `#f6eee329`                 | (same)                                    | Borders / inputs (hex-alpha)       |
| `--ela-cream`                         | `#f3ebe0`                                 | `#eef0e1`                                 | Cream sections / text              |
| `--ela-espresso`                      | `#120b08`                                 | `#0e180c`                                 | Espresso brown-black               |
| `--ela-roast`                         | `#1e130d`                                 | `#172313`                                 | Roast brown                        |
| `--ela-crema`                         | `#d9a066`                                 | `#a9c46c`                                 | Crema gold-tan                     |
| `--ela-stage-glow` / `-mid` / `-edge` | `#2b1a10` / `#180f0a` / `#0e0906`         | `#26361b` / `#142010` / `#0a1108`         | Hero radial-gradient stops         |
| `--chart-1…5`                          | `#d9a066 #b9772f #8b5a3c #5e3324 #3a2216` | `#a9c46c #7f9c48 #5b7334 #3b4d22 #243317` | Chart ramp (unused on the page)    |
| `--sidebar` / `--sidebar-primary`      | `#160e0a` / `#d9a066`                     | (same)                                    | Present in CSS, unused on the page |

Tailwind utilities: `bg-background`, `text-foreground`, `bg-card`,
`bg-primary text-primary-foreground`, `bg-espresso`, `text-cream`,
`bg-roast`, `text-crema`, `ring-ring`, `border-border`, etc.

### 1.2 Typography

| Token                      | Value                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sans (`--font-sans`)       | Manrope (variable 200–800), fallback Arial; **fa: Vazirmatn**                                                                                                  |
| Heading (`--font-display`) | Fraunces (variable 100–900), fallback Times New Roman                                                                                                          |
| Mono (`--font-mono`)       | Geist Mono (variable 100–900), fallback Arial                                                                                                                  |
| Type scale                 | xs `.75rem/1`, sm `.875rem/1.25`, base `1rem/1.5`, lg `1.125rem/1.75`, xl `1.25rem/1.75`, 2xl `1.5rem/2`, 3xl `1.875rem/2.25`, 4xl `2.25rem/2.5`, 5xl `3rem/1` |
| Display clamps (Phase 4)   | `clamp(2.5rem, 8vw, 4.5rem)`, `clamp(2.25rem, 5vw, 3.75rem)`, `clamp(5rem, 18vw, 9rem)`                                                                        |
| Eyebrows                   | Uppercase, `.18em` / `.2em` tracking, `.625rem` / `.6875rem`                                                                                                   |
| Headings                   | Leading `1.02–1.05`, tracking `-.02em` to `-.04em`; body `1.625`                                                                                               |

### 1.3 Spacing, radii, shadows, breakpoints

- **Spacing unit:** `--spacing: .25rem` (Tailwind v4 default, made explicit).
- **Radii:** base `--radius` is `.75rem` (= `--radius-lg`); md `.6rem`
  (`calc(.75rem * .8)`), lg `.75rem`, xl `1.05rem`, 2xl `1.35rem`.
- **Shadows:** `shadow-ela-soft` `0 12px 32px -14px rgb(0 0 0/.7)`,
  `shadow-ela-card` `0 16px 30px -12px rgb(0 0 0/.8)`,
  `shadow-ela-lift` `0 20px 44px -16px rgb(0 0 0/.85)`,
  `shadow-ela-wide` `0 30px 50px -24px rgb(0 0 0/.45)`,
  `shadow-ela-hero` `0 40px 90px -30px rgb(0 0 0/.9)`.
- **Blur:** `blur-md 12px`, `blur-xl 24px` (glass pills: `bg-espresso/45 backdrop-blur-md`, border `cream/10`).
- **Breakpoints:** sm `40rem`, md `48rem`, lg `64rem`, xl `80rem`, 2xl `96rem`
  (Tailwind defaults, made explicit as `--breakpoint-*`).
- **Layout:** logical properties everywhere (`ms-/me-/ps-/pe-`, `start-/end-`) so
  RTL mirrors without a second stylesheet.

### 1.4 Motion (unchanged from Phase 2 — see `globals.css`)

All 12 keyframes from audit §4 with exact durations/easings
(`ela-wheel-in` 1.6s, `ela-pour` 1.2s, `ela-float` 7s, `ela-scroll-cue`
1.8s, `ela-marquee` 48s, `ela-bump` .48s, reveal family, `ela-word-up`
.95s + 65 ms/word stagger, `ela-word-soft` 1.1s). Phase 3 adds two
dialog-only keyframes (`ela-dialog-in` / `ela-dialog-overlay-in`, .2s
ease-out — audit §4: dialogs open with fade/scale-in, default .15s ease)
and one rule: `[dir="rtl"] .animate-ela-marquee { animation-direction: reverse; }`
so the ticker flips direction in RTL while staying seamless.
`prefers-reduced-motion` disables all of them; `html[data-motion=paused]`
pauses float / marquee / scroll cue.

## 2. Components

All in `packages/ui/src/components/`, exported from `packages/ui/src/index.ts`.
Class merging via `cn()` (`clsx` + `tailwind-merge`, `packages/ui/src/cn.ts`).
Strict TypeScript, no `any`.

| Component                              | Props (main)                                                                                               | Variants / notes                                                                                                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                               | `variant`, `size`, `loading`, `disabled`, all native button props                                          | `primary` (accent), `secondary`, `ghost`, `outline`; `sm` / `md` / `lg`; loading shows a CSS spinner + `aria-busy` + disabled; hover `scale-105` / active `scale-95` (audit §4)     |
| `Pill`                                 | `variant`, `children`                                                                                      | `glass` (default: `bg-espresso/45 backdrop-blur-md ring-cream/10` — header/hero pill), `label` (small uppercase tag)                                                                |
| `Eyebrow`                              | `size`, `children`                                                                                         | `sm` `.625rem/.2em`, `md` `.6875rem/.18em`; uppercase, semibold, muted                                                                                                              |
| `Price`                                | `amountToman`, `originalPriceToman?`, `locale`, `size`                                                     | Toman via `packages/i18n` `formatToman`; `sm` / `md` / `lg`; optional struck-through original price                                                                                 |
| `Stepper`                              | `value`, `onChange`, `min` (1), `max?`, `decreaseLabel`, `increaseLabel`, `valueLabel`                     | Minus/plus; disabled at bounds; value in `<output aria-live="polite">`                                                                                                              |
| `Dialog`                               | `open`, `onClose`, `title`, `description?`, `children`, `closeLabel?`                                      | `role="dialog"`, `aria-modal`, labelled by title; focus trap; Esc / overlay / X close; focus returns to trigger; body scroll locked; portal to `document.body`; enter fade+scale    |
| `Toast` / `ToastProvider` / `useToast` | `Toast`: `message`, `open`, `onClose?`, `durationMs` (4000), `bumpKey?`; `showToast(message, durationMs?)` | Bottom-centre dark pill, `role="status"` + `aria-live="polite"`, auto-dismiss; `bumpKey` change re-triggers `ela-bump`                                                             |
| `Reveal`                               | `variant`, `delayMs`, `children`                                                                           | `fade-up` / `fade` / `image`; IntersectionObserver adds `data-revealed`; `--reveal-delay`; **no-JS fallback: content never stuck hidden** (audit defect §8.7)                       |
| `WordReveal`                           | `text`, `as` (`h1`/`h2`/`h3`/`p`/`span`), `variant`, `delayMs`                                             | Word-by-word `.ela-word` / `.ela-word-inner`, 65 ms stagger via `--i`; `soft` variant (blur 10px, 1.1s); `aria-label` carries the full text so screen readers hear it with spaces |
| `Marquee`                              | `items: string[]`, `separator` (`bean` / `leaf`), `ariaLabel?`                                             | 48s linear infinite, four identical lists, `translate -50%`; copies 2–4 `aria-hidden`; bean (coffee) or leaf (matcha) separator icon; direction reverses in RTL                     |

### Usage examples

```tsx
import { Button, Dialog, Marquee, Price, Stepper, WordReveal } from "@ela-coffee/ui";

// Price with a discount, Persian digits in fa
<Price amountToman={180000} originalPriceToman={210000} locale="fa" size="lg" />

// Word-by-word heading
<WordReveal as="h1" text="Choose your coffee" className="font-display text-5xl font-black" />

// Accessible dialog
const [open, setOpen] = useState(false);
<Button onClick={() => setOpen(true)}>Tasting notes</Button>
<Dialog open={open} onClose={() => setOpen(false)} title="Ela Original">
  <p>Dark cocoa, toasted almond, brown sugar.</p>
</Dialog>

// Ticker (direction flips automatically in RTL)
<Marquee items={["Ela Original", "Salted Caramel", "Vanilla Cream"]} />

// Toast (wrap the app — or a section — once in ToastProvider)
const { showToast } = useToast();
showToast("Salted Caramel added to your bag.");
```

## 3. Accessibility notes

- **Focus is always visible.** Global `:focus-visible` ring (`2px solid var(--ring)`,
  audit defect §8.6) plus every component is a real button / real control.
- **Dialog:** focus trap, Esc, overlay click, focus return, `aria-modal` +
  `aria-labelledby`/`aria-describedby`. Verified with an axe-core test
  (`jest-axe`, `Dialog.test.tsx`) — zero violations.
- **Toast:** `role="status"` + `aria-live="polite"` — announced, never interrupting.
- **Stepper:** value in `<output aria-live="polite">`, buttons disabled at bounds.
- **WordReveal:** `aria-label` with the full text (separate word spans would
  otherwise collapse to e.g. "Sixicedlattes" for screen readers).
- **Marquee:** copies 2–4 are `aria-hidden`, so each item is announced once.
- **Reveal:** no-JS / observer-failure fallback — content stays visible.
- **Reduced motion:** all animations disabled under `prefers-reduced-motion: reduce`;
  `data-motion="paused"` pauses float / marquee / scroll cue.

## 4. What Phase 4 will consume

- `Eyebrow` + `WordReveal` for every section heading (Story, Menu, Process, Origins, Join).
- `Marquee` for the flavour ticker between hero and story.
- `Price` + `Button` + `Stepper` for menu cards and the bag.
- `Dialog` for All-flavours and Tasting-notes; `Toast` for add-to-bag feedback.
- `Reveal` for every section's scroll entrance (delays 300 / 450 / 600 ms).
- `Pill` (glass) for the hero / header pill.
- Tokens + keyframes are frozen: Phase 4 adds the wheel geometry (`.ela-stage`,
  audit §3.5) and the sections, but does not change token values.

## 5. Tests

57 tests in 12 files (`pnpm test`): one test file per component plus the
i18n formatters and the placeholder page render test. Coverage: render,
variants, interaction (click / Esc / stepper / toast dismiss), keyboard
access, aria attributes, plus one axe-core test for Dialog.

## 6. Verification (Phase 3, 2026-11-24)

| Check                            | Result                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | ✅ pass                                                                       |
| `pnpm typecheck`                 | ✅ pass                                                                       |
| `pnpm lint`                      | ✅ pass                                                                       |
| `pnpm test`                      | ✅ pass — 57 tests, 12 files                                                  |
| `pnpm build`                     | ✅ pass — Next 16.4.6; `/fa`, `/en`, `/fa/design-system`, `/en/design-system` |
| Live dev-server smoke test       | ✅ `/fa/design-system` and `/en/design-system` render; brand toggle works     |

Run it: `cd ~/workspace/ela-coffee && pnpm install && pnpm dev` →
`http://localhost:3000/fa/design-system`
