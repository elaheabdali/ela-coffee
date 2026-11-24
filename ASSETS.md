# ASSETS.md — ela-coffee

Source and licence of every asset used in the rebuild. Status: **Phase 0**.
Nothing here is a redistribution claim — this file records what was supplied,
where it came from, and what still needs licence confirmation.

## Licence status (read first)

- The user (Elahe Abdali) states she holds a valid licence to use the Kuro
  coffee-shop template from Modulify. **No licence file, receipt, or licence
  text was supplied in Phase 0.** Until that evidence is provided, every
  template-derived image/font below is **licence-claimed, not
  licence-verified**. Do not publish the site commercially on the strength
  of this file alone — confirm §9 of `docs/reference-audit.md` first.
- No template source code (JS/TS, components, data) was supplied. Only
  exported assets: compiled CSS, HTML/SVG fragments, images, fonts.
- The rebuild will **not** copy the compiled CSS blob or the template's
  JavaScript. Tokens and animation values are re-implemented from the
  audit; images/fonts are the only template artefacts carried over, and
  only if the licence covers them.

## 1. Images — supplied by the user (`Images.zip`, 44 files, 41 unique, 4.4 MB)

- **Source:** user-supplied export of the Kuro template's images
  (originally served from `https://kuro-coffee-template.modulify.website/images/…`
  via Next.js `/_next/image?url=…&w=3840&q=75`).
- **Licence:** template licence (claimed, unverified — see above).
- **Format on the live site:** JPEG (`.jpg`). **Format supplied:** WebP
  re-exports (except the two `-key.jpg` files). Dimensions were measured
  with Pillow; duplicates confirmed by MD5 (see audit §5.1).
- **Location in this repo (Phase 0 working copy, not final):**
  `assets-original/Images/` — final assets will live in
  `apps/web/public/images/` after dedup + re-encode in Phase 2/3.
- **Duplicates to drop (identical MD5):** `strawberry (1).webp`
  (= `strawberry.webp`), `bean (2).webp` (= `bean (1).webp`),
  `original (4).webp` (= `original (3).webp`).

| Asset group                                | Files                                                                                                               | Licence                    | Notes / replacement plan                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coffee latte scenes (6 flavours × 2 sizes) | `original`, `caramel-latte`, `vanilla-latte`, `hazelnut-latte`, `mocha-latte`, `cinnamon-latte` (+ ` (1)` variants) | Template licence (claimed) | 1200×670 and 1920×1072 WebP. If licence does not cover photography, replace with licensed stock / own photography of the client's drinks.                               |
| Matcha / fruit scenes                      | `blueberry`, `cherry`, `coconut`, `strawberry`, `blackberry` (+ smaller variants)                                   | Template licence (claimed) | 1920×1072 / 1080×603 WebP. Same replacement rule.                                                                                                                       |
| Story bean                                 | `bean.webp`, `bean (1).webp`                                                                                        | Template licence (claimed) | 1080×1430 / 1133×1500.                                                                                                                                                  |
| Process steps                              | `roast`, `rest`, `pull`, `pour` (+ `(1)`/`(2)` variants)                                                            | Template licence (claimed) | 640×~800 and 384×~508 WebP.                                                                                                                                             |
| Ingredient sprite                          | `ingredients.webp` (1080×725)                                                                                       | Template licence (claimed) | Cropped at 390%×260% in the reference to show single ingredients. Check the purple fringe (§8.3 of the audit) before reuse.                                             |
| Ingredient key art                         | `ingredients-key.jpg`, `ingredients-v2-key.jpg` (2528×1696, 1.34 / 1.47 MB)                                         | Template licence (claimed) | Largest files in the set. Difference between the two versions is **unconfirmed** — do not use until the user confirms which is current. Re-encode to AVIF/WebP if kept. |
| Small details                              | `grind.webp`, `shade.webp`, `whisk.webp`, `tea.webp`                                                                | Template licence (claimed) | Matcha process / texture images; mapping unconfirmed.                                                                                                                   |

## 2. Fonts — supplied by the user (`fonts.zip`, 3 files, 168 KB)

| File                                                   | Family                                              | Licence                                                 | Notes                                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `54fc36028e2bb174-s.p.0nkps02--w45i.woff2` (120,800 B) | Fraunces 9pt Black (variable 100–900, latin subset) | **SIL Open Font License 1.1** (upstream family licence) | Display/heading. The supplied file is only the latin subset; the rebuild will source the full variable font from the upstream OFL release and self-host via `next/font/local`. |
| `a343f882a40d2cc9-s.p.0kho-wj7-y-w1.woff2` (24,576 B)  | Manrope ExtraLight (variable 200–800, latin subset) | **SIL OFL 1.1**                                         | Sans/body (Latin only in the rebuild; Persian uses Vazirmatn).                                                                                                                 |
| `797e433ab948586e-s.p.08e28id.o-okb.woff2` (23,108 B)  | Geist Mono Regular (variable 100–900, latin subset) | **SIL OFL 1.1**                                         | Mono/labels.                                                                                                                                                                   |
| _(to be added in Phase 2)_                             | Vazirmatn (Persian)                                 | **SIL OFL 1.1**                                         | Self-hosted via `next/font/local`. No Google Fonts CDN, no external font requests — required for use in Iran.                                                                  |

Font files are identified with fontTools from their internal `name` table,
not from their hashed filenames. The full `@font-face` set in the reference
CSS lists ~15 further subsets (Cyrillic, Greek, Vietnamese, latin-ext) that
were **not** supplied and are **not** needed for fa/en.

## 3. Icons

- **Lucide** (`lucide-react` in the rebuild), **ISC licence**.
- Observed in the supplied fragments: `menu`, `pause`, `coffee`, `leaf`,
  `layout-grid`, `info`, `shuffle`, `shopping-bag`, `bean`,
  `arrow-up-right`, `mountain` (inline SVG, stroke-width 2, 24×24).
- The rebuild uses the `lucide-react` package, not copied SVG path data.

## 4. Code / CSS supplied

- `theme.css.txt` — compiled Tailwind v4 output (3,778 lines) from the
  reference site. **Reference only.** It is not copied into the repo as
  source; design tokens and keyframes are re-expressed as Tailwind v4
  `@theme` tokens / CSS variables in Phase 2/3.
- `svg_and_img.txt` — exported HTML/SVG fragments (56 lines). Reference
  only; no markup is copied verbatim into components.

## 5. License-safe replacements (if the template licence does not cover an asset)

| If not covered                             | Replacement                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Latte / fruit / bean / process photography | Own photography of the client's drinks, or licensed stock (e.g. Unsplash/Pexels with licence recorded here). Record the new source + licence per file. |
| Ingredient cut-outs (purple fringe)        | Re-cut from clean source art, or replace with CSS/SVG shapes + the drink photos.                                                                       |
| Fraunces / Manrope / Geist Mono            | Upstream OFL releases (same families, clean source) — no replacement needed, just re-source them.                                                      |
| Persian type                               | Vazirmatn (OFL) — already the plan.                                                                                                                    |
| Icons                                      | Lucide (ISC) — already the plan.                                                                                                                       |
| Map (new feature, not in the reference)    | Neshan or Balad (Iranian providers) — no Google Maps.                                                                                                  |

## 6. What is still missing

- [ ] Modulify licence/receipt confirming image + font reuse in a rebuilt client site.
- [ ] Original `/images/…/*.jpg` files (or confirmation that the WebP re-exports are canonical).
- [ ] Confirmation of `ingredients-key.jpg` vs `ingredients-v2-key.jpg`.
- [ ] Matcha scene/process images not present in the supplied set (see audit §5.1).
- [ ] Toman prices per drink (replaces USD $5.40–$6.60).
