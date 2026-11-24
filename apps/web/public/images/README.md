# Images — approved assets

Source of truth: `assets-original/Images/` (never modified). These files are
copies, deduplicated by MD5 and renamed to clean kebab-case. The user
confirmed the photos are approved for use (2026-11-24).

## Mapping (source file → public path → role)

| Source (`assets-original/Images/`) | Public path | Role |
|---|---|---|
| `original.webp` (1920×1072) | `scenes/original.webp` | Coffee hero / menu scene — Kuro Original |
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

## TODO (Phase 9)

- Re-encode `ingredients-key.jpg` and `ingredients-v2-key.jpg` (1.3–1.5 MB
  each) to AVIF/WebP, and confirm whether `ingredients-v2-key.jpg` is the
  matcha ingredient sprite before using it on the page.
- Confirm the roles marked "unconfirmed" above against the live reference
  when the full pages are built (Phase 4).
