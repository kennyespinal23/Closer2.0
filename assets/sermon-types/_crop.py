"""
One-time script to slice the composite into 10 individual hero PNGs.

Run with: python3 assets/sermon-types/_crop.py

The composite is 1024×682; icons sit in two rows of 5. Centers are
hand-tuned from visual inspection of the source image. Each crop is
a 220×220 square so the dark composite background bleeds into the
app background seamlessly.
"""
from PIL import Image
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "_source.png"

CROP_W = 220
CROP_H = 180
HALF_W = CROP_W // 2
HALF_H = CROP_H // 2

# (filename, center_x, center_y). y centers are tuned to keep the
# "01 Daily Church" / "10 Prayer Nights" badges OUT of the crop.
CROPS = [
    ("daily-church.png",       122, 175),
    ("jesus-only.png",         305, 175),
    ("letters-struggling.png", 495, 175),
    ("letters-grateful.png",   692, 175),
    ("character-studies.png",  890, 175),
    ("deep-verse.png",         122, 465),
    ("misconceptions.png",     305, 465),
    ("testimonies.png",        495, 465),
    ("questions.png",          692, 465),
    ("prayer-nights.png",      890, 465),
]


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    print(f"Source: {img.size}")
    for name, cx, cy in CROPS:
        box = (cx - HALF_W, cy - HALF_H, cx + HALF_W, cy + HALF_H)
        crop = img.crop(box)
        out = HERE / name
        crop.save(out, optimize=True)
        print(f"  → {name}  {box}")


if __name__ == "__main__":
    main()
