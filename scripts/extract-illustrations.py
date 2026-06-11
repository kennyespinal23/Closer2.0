"""
Slice the v2 illustration contact sheet (10 portrait cards in a 5x2
grid on a white background) into 10 individual portrait card images.

Source: assets/sermon-types/_source-v2.png   (1024 x 682)
Output: assets/sermon-types/illustrations/<id>.jpg

The cards have rounded corners and their own background gradients.
We crop each as a portrait JPG (white outer pixels around the
rounded corners are accepted — they sit on a dark app background and
the surrounding strip is small enough not to read as a visible
"frame" once placed inside another rounded container on-screen.)

Run with: python3 scripts/extract-illustrations.py
"""
from PIL import Image
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
SRC = HERE / "assets" / "sermon-types" / "_source-v2.png"
OUT_DIR = HERE / "assets" / "sermon-types" / "illustrations"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Card bounds tuned by visual inspection of the 1024x682 sheet.
# Each card is roughly 190 x 305 portrait; centers below were
# measured from the contact sheet so a tight crop catches the full
# card (background gradient included) without touching neighbors.
CROP_W = 184
CROP_H = 296
HALF_W = CROP_W // 2
HALF_H = CROP_H // 2

# (output_filename, center_x, center_y, source_label)
# Source labels are just for the run log so it's clear which
# illustration ended up where.
CROPS = [
    # ── Row 1 (cy = 170) ─────────────────────────────
    ("open-book.jpg",      113, 170, "open book on red"),
    ("cross-mountain.jpg", 316, 170, "cross on mountain path"),
    ("heart-flower.jpg",   519, 170, "heart-flower on green"),
    ("lightbulb.jpg",      722, 170, "lightbulb on purple"),
    ("family.jpg",         925, 170, "family silhouettes on peach"),
    # ── Row 2 (cy = 512) ─────────────────────────────
    ("moon-stars.jpg",     113, 512, "crescent moon + stars"),
    ("chapel-hill.jpg",    316, 512, "chapel on green hill"),
    ("hands-sun.jpg",      519, 512, "hands holding sun on red"),
    ("boat-ocean.jpg",     722, 512, "paper boat on ocean"),
    ("doorway-path.jpg",   925, 512, "open doorway with winding path"),
]


def main() -> None:
    img = Image.open(SRC).convert("RGB")
    print(f"Source: {img.size}")
    print(f"Output: {OUT_DIR.relative_to(HERE)}/")
    print()
    for name, cx, cy, label in CROPS:
        box = (cx - HALF_W, cy - HALF_H, cx + HALF_W, cy + HALF_H)
        crop = img.crop(box)
        out = OUT_DIR / name
        # 88% JPEG — matches the book-cover compression ratio so
        # asset sizes stay in the same neighborhood as the rest of
        # the bundle. Each crop ends up ~25-40KB.
        crop.save(out, "JPEG", quality=88, optimize=True)
        size_kb = out.stat().st_size / 1024
        print(f"  → {name:<24}  {label:<32}  box={box}  {size_kb:5.1f} KB")


if __name__ == "__main__":
    main()
