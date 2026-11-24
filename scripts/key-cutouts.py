#!/usr/bin/env python3
"""Chroma-key the blue-screen ingredient key art into transparent cut-outs.

The supplied `ingredients-key.jpg` (coffee) and `ingredients-v2-key.jpg`
(matcha) are 3x2 grids of ingredients photographed on a pure-blue
(0, 0, 255) screen. The reference template keyed this art sloppily, which
is where the purple fringe in its screenshots comes from (audit §8.3).

This script keys each tile properly:
  * alpha from "blueness" (B - max(R, G)): opaque below 40, transparent
    above 120, linear ramp in between — no hard edge, no fringe;
  * despill: edge pixels have their blue channel clamped to max(R, G);
  * alpha is feathered (Gaussian blur, radius 1.2) and each tile is
    trimmed to its non-transparent bounding box.

Outputs transparent WebP cut-outs to apps/web/public/images/cutouts/.

Usage (from the repo root):
    python3 scripts/key-cutouts.py
Requires: Pillow + numpy.
"""

from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "apps", "web", "public", "images")

# Tile names in reading order (row-major, 3 columns x 2 rows).
SOURCES = [
    (
        os.path.join(PUBLIC, "ingredients-key.jpg"),
        "coffee",
        ["beans", "caramel", "vanilla", "hazelnut", "chocolate", "cinnamon"],
    ),
    (
        os.path.join(PUBLIC, "ingredients-v2-key.jpg"),
        "matcha",
        ["matcha", "strawberry", "blueberry", "blackberry", "cherry", "coconut"],
    ),
]

# Blueness thresholds: <= LOW is fully opaque, >= HIGH fully transparent.
LOW, HIGH = 40, 120


def key_tile(tile: Image.Image) -> Image.Image:
    """Return an RGBA image with the blue screen keyed out."""
    rgb = tile.convert("RGB")
    arr = np.asarray(rgb).astype(np.int16)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    blueness = b - np.maximum(r, g)

    # Alpha ramp: 255 (opaque) at blueness <= LOW, 0 at >= HIGH.
    alpha = np.clip((HIGH - blueness) / (HIGH - LOW) * 255, 0, 255).astype(np.uint8)

    # Despill: on semi-transparent edge pixels, clamp blue to max(R, G)
    # so no blue/purple halo survives the feather.
    edge = alpha < 255
    b_despilled = np.minimum(b, np.maximum(r, g))
    out = np.dstack([r, g, np.where(edge, b_despilled, b), alpha]).astype(np.uint8)

    rgba = Image.fromarray(out, "RGBA")
    # Feather the alpha channel only, to soften the cut edge.
    a = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(1.2))
    rgba.putalpha(a)

    # Trim to the non-transparent bounding box (+6 px padding).
    bbox = rgba.getchannel("A").getbbox()
    if bbox is None:
        return rgba
    x0, y0, x1, y1 = bbox
    pad = 6
    return rgba.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(rgba.width, x1 + pad),
            min(rgba.height, y1 + pad),
        )
    )


def main() -> int:
    out_dir = os.path.join(PUBLIC, "cutouts")
    os.makedirs(out_dir, exist_ok=True)
    for src, prefix, names in SOURCES:
        if not os.path.exists(src):
            print(f"missing source: {src}", file=sys.stderr)
            return 1
        sheet = Image.open(src)
        w, h = sheet.size
        cell_w, cell_h = w // 3, h // 2
        for i, name in enumerate(names):
            col, row = i % 3, i // 3
            tile = sheet.crop(
                (col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h)
            )
            cutout = key_tile(tile)
            dest = os.path.join(out_dir, f"{prefix}-{name}.webp")
            cutout.save(dest, "WEBP", quality=90, method=6)
            print(f"{dest}  {cutout.size[0]}x{cutout.size[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
