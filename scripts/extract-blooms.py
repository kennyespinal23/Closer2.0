#!/usr/bin/env python3
"""
extract-blooms.py

Sample a two-stop bloom palette from each book cover. Writes a
TypeScript-ready snippet to stdout so you can paste the result
directly into the COVER_MAP entries in constants/bookCovers.ts.

Heuristic per cover:
  1. Downsample to 256×256 for speed; ignore alpha.
  2. Quantize to a 12-color palette via Pillow's median-cut
     quantizer — same algorithm used by .gif export, gives a
     stable set of dominant colors.
  3. Rank by pixel count.
  4. Pick `outer` = the most-common color whose value (HSV V) is
     in the lower half — this is almost always the painting's
     background atmosphere, which is exactly what we want bleeding
     out to the page bg.
  5. Pick `inner` = the most-saturated color in the top half of
     the palette (by pixel count), nudged brighter so the inner
     stop of the radial gradient reads as a halo, not a stain.

Run from the repo root:

    python3 scripts/extract-blooms.py > scripts/blooms.out.txt

then hand-paste / scripted-merge into constants/bookCovers.ts.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from colorsys import rgb_to_hsv, hsv_to_rgb

from PIL import Image

COVERS_DIR = Path("assets/book-covers")

# Sample size — small enough that quantize is instant on a
# laptop, large enough that the palette is representative of the
# whole painting (not just one corner).
SAMPLE = 256

# Number of palette buckets to consider per image. Higher = more
# nuance but slower; 12 captures plenty for a two-stop bloom.
PALETTE_K = 12


def hex_color(rgb: tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)


def boost_brightness(rgb: tuple[int, int, int], by: float = 0.15) -> tuple[int, int, int]:
    """Lift the value (HSV V) of an RGB triple by `by` (0-1)."""
    r, g, b = (c / 255 for c in rgb)
    h, s, v = rgb_to_hsv(r, g, b)
    v = min(1.0, v + by)
    nr, ng, nb = hsv_to_rgb(h, s, v)
    return (round(nr * 255), round(ng * 255), round(nb * 255))


def cap_saturation(rgb: tuple[int, int, int], cap: float = 0.78) -> tuple[int, int, int]:
    """Bound the inner color's saturation so the bloom never looks
    neon. Anything above ~78% sat tends to upstage the artwork
    the bloom is supposed to flatter."""
    r, g, b = (c / 255 for c in rgb)
    h, s, v = rgb_to_hsv(r, g, b)
    s = min(s, cap)
    nr, ng, nb = hsv_to_rgb(h, s, v)
    return (round(nr * 255), round(ng * 255), round(nb * 255))


def hsv_of(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    return rgb_to_hsv(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)


def extract_bloom(path: Path) -> tuple[str, str]:
    img = Image.open(path).convert("RGB")
    img.thumbnail((SAMPLE, SAMPLE), Image.Resampling.LANCZOS)

    # Median-cut quantize → palette of the K dominant colors.
    quantized = img.quantize(colors=PALETTE_K, method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette()  # flat list of [R,G,B, R,G,B, …]
    counts = quantized.getcolors()  # [(count, palette_index), …]

    # Build (count, rgb, hsv) entries, sorted descending by count.
    entries: list[tuple[int, tuple[int, int, int], tuple[float, float, float]]] = []
    for count, idx in counts:
        r, g, b = palette[idx * 3 : idx * 3 + 3]
        entries.append((count, (r, g, b), hsv_of((r, g, b))))
    entries.sort(key=lambda e: -e[0])

    # `outer` candidates: any palette entry whose V is in the lower
    # half (the painting's atmosphere / shadow body). Among those,
    # take the one with the most pixels. Falls back to the darkest
    # entry overall if all colors are bright (rare for these
    # painted covers).
    dark_entries = [e for e in entries if e[2][2] <= 0.55]
    if dark_entries:
        outer_rgb = dark_entries[0][1]
    else:
        outer_rgb = min(entries, key=lambda e: e[2][2])[1]

    # `inner` candidates: take the top half of palette entries by
    # pixel count, score each by saturation × value, pick the
    # winner. This biases toward bright saturated highlights that
    # ARE present in the painting (vs. an arbitrary neon).
    upper_half = entries[: max(2, len(entries) // 2)]
    inner_rgb = max(upper_half, key=lambda e: e[2][1] * e[2][2])[1]

    # If `inner` ended up identical (or very close) to `outer`,
    # bias it brighter so the gradient transition still reads.
    if abs(sum(inner_rgb) - sum(outer_rgb)) < 30:
        inner_rgb = boost_brightness(inner_rgb, by=0.25)

    # Final shaping passes — keep bloom colors readable across the
    # page bg (boost dim highlights, tame neon saturation).
    inner_rgb = boost_brightness(inner_rgb, by=0.12)
    inner_rgb = cap_saturation(inner_rgb, cap=0.78)

    return hex_color(inner_rgb), hex_color(outer_rgb)


def main() -> int:
    files = sorted(p for p in COVERS_DIR.iterdir() if p.suffix.lower() == ".jpg")
    if not files:
        print("No .jpg files in", COVERS_DIR, file=sys.stderr)
        return 1

    print("// Auto-generated bloom palette — see scripts/extract-blooms.py")
    for p in files:
        book_id = p.stem  # e.g. "1-corinthians"
        inner, outer = extract_bloom(p)
        # Print one line per book in the shape we can search-and-
        # patch into bookCovers.ts.
        print(f'  "{book_id}": {{ inner: "{inner}", outer: "{outer}" }},')

    return 0


if __name__ == "__main__":
    sys.exit(main())
