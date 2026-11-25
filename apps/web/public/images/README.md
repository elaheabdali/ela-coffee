# Images — approved assets

Source of truth: `assets-original/Images/` (never modified). These files are
copies, deduplicated by MD5 and renamed to clean kebab-case. The user
confirmed the photos are approved for use (2026-11-24).

## Mapping (source file → public path → role)

| Source (`assets-original/Images/`) | Public path | Role |
|---|---|---|
| `original.webp` (1920×1072) | `scenes/original.webp` | Coffee hero / menu scene — Ela Original |
| `caramel-latte (1).webp` (1920×1072) | `scenes/caramel-latte.webp` | Salted Caramel scene |
| `vanilla-latte (1).webp` (1920×1072) | `scenes/vanilla-latte.webp` | Vanilla Cream scene |
| `hazelnut-latte (1).webp` (1920×1072) | `scenes/hazelnut-latte.webp` | Toasted Hazelnut scene |
| `mocha-latte (1).webp` (1920×1072) | `scenes/mocha-latte.webp` | Dark Mocha scene |
| `cinnamon-latte (1).webp` (1920×1072) | `scenes/cinnamon-latte.webp` | Brown Sugar Cinnamon scene |
| `blueberry.webp` (1920×1072) | `scenes/blueberry.webp` | Wild Blueberry scene / ingredient |
| `cherry.webp` (1920×1072) | `scenes/cherry.webp` | Dark Cherry scene / ingredient |
| `coconut.webp` (1920×1072) | `scenes/coconut.webp` | Coconut Cream scene / ingredient |
| `strawberry.webp` (1920×1072) | `scenes/strawberry.webp` | Strawberry Cloud scene / ingredient |
| `blackberry.webp` (1080×603) | `scenes/blackberry.webp` | Blackberry Bramble ingredient |
| `bean (1).webp` (1133×1500) | `story/bean.webp` | Story — single roasted bean |
| `roast.webp` (640×847) | `process/roast.webp` | Process 01 — Roast |
| `rest.webp` (640×847) | `process/rest.webp` | Process 02 — Rest |
| `pull.webp` (640×847) | `process/pull.webp` | Process 03 — Pull |
| `pour.webp` (640×800) | `process/pour.webp` | Process 04 — Pour |
| `ingredients.webp` (1080×725) | `ingredients.webp` | Floating ingredient cut-outs sprite |
| `ingredients-key.jpg` (2528×1696, 1.34 MB) | `ingredients-key.jpg` | Full ingredient key art (unconfirmed role) |
| `ingredients-v2-key.jpg` (2528×1696, 1.47 MB) | `ingredients-v2-key.jpg` | Key art v2 — possibly the matcha version |
| `grind.webp` (384×215) | `grind.webp` | Ground-coffee mound texture (hero, unconfirmed) |
| `shade.webp` (384×477) | `shade.webp` | Matcha process 01 — Shade (unconfirmed) |
| `whisk.webp` (384×477) | `whisk.webp` | Matcha process 03 — Whisk (unconfirmed) |
| `tea.webp` (640×795) | `tea.webp` | Matcha story image (unconfirmed) |

## Dedupe rules applied

- MD5 duplicates dropped (kept one copy each): `strawberry.webp` =
  `strawberry (1).webp`; `bean (1).webp` = `bean (2).webp`;
  `original (3).webp` = `original (4).webp`.
- Where `(1)`/`(2)` variants exist at different resolutions, the **larger**
  one is canonical: latte scenes use the 1920×1072 `(1)` files; `bean`
  uses `bean (1).webp` (1133×1500) over `bean.webp` (1080×1430); process
  images use the 640 px originals over the 384 px `(1)` files; `pour`
  uses `pour.webp` (640×800) over `pour (1).webp` / `pour (2).webp`.
- `original.webp` (1920×1072, canonical name) is kept for the hero;
  `original (2).webp` is an alternate 1920×1072 export of the same scene
  and is **not** copied. `original (1).webp` (1200×670) and the
  `original (3)/(4).webp` duplicates (1080×603) are also not copied.

## Phase 9 — re-encode (2026-11-24)

`ingredients-key.jpg` and `ingredients-v2-key.jpg` are **not referenced by
any page** (verified by grep over `apps/web/src`): they are the keying
source for `scripts/key-cutouts.py` (which reads them from this folder),
so the re-encode below changes no page-load bytes — it is readiness for
the day they are used on a page, and it keeps the derivatives next to
their source. The real page-load image wins in Phase 9 are the
`next/image` optimisation (sharp, now an explicit dependency) and the
corrected tile `sizes` in `FlavorWheel.tsx`.

Re-encoded with ffmpeg (SVT-AV1 CRF 32 preset 6; WebP quality 75),
2528×1696 kept, originals kept as source/fallback:

| File | JPG | AVIF | WebP | PSNR (AVIF / WebP) | SSIM (AVIF / WebP) |
|---|---|---|---|---|---|
| `ingredients-key` | 1,338,050 B | 42,312 B (−96.8%) | 71,474 B (−94.7%) | 46.1 / 44.8 dB | 0.991 / 0.990 |
| `ingredients-v2-key` | 1,474,669 B | 51,670 B (−96.5%) | 76,974 B (−94.8%) | 45.9 / 43.8 dB | 0.991 / 0.989 |

Visual check at 1440 px (side-by-side JPG/AVIF/WebP): no visible
difference — blue key background, beans, caramel, vanilla, hazelnut,
chocolate and cinnamon are identical in all three.

## TODO

- Confirm whether `ingredients-v2-key.jpg` is the matcha ingredient
  sprite before using it (or its AVIF/WebP) on the page.
- Confirm the roles marked "unconfirmed" above against the live reference
  when the full pages are built (Phase 4).
