#!/usr/bin/env bash
# compress-covers.sh
#
# One-shot batch converter for the book-cover artwork. Run from
# the repo root. For each source PNG listed below it:
#
#   1. resamples to ≤ 1200px on the long edge (preserves aspect
#      ratio — sips' `-Z` mode), which is plenty of resolution
#      for a phone-sized cover even at 3× DPR;
#
#   2. re-encodes as JPEG at quality 85 (visually transparent
#      vs the PNG source for painted artwork, ~30-100× smaller
#      on disk);
#
#   3. writes to a canonical `{bookId}.jpg` filename in
#      assets/book-covers/ so the require() paths in
#      constants/bookCovers.ts stay short and predictable.
#
# Originals are NOT touched here — delete the .png siblings
# from the repo after you've verified the .jpg outputs look
# right. A safety backup of the originals lives at
# /tmp/closer-cover-backup/ (created by the caller).

set -euo pipefail

SRC_DIR="assets/book-covers"
QUALITY=85
MAX_EDGE=1200

# Map of {source-filename → bookId}. Ordering matches the
# bookCovers.ts COVER_MAP so a diff is easy to scan.
declare -a MAPPING=(
  # The Law
  "Book of Genesis  1.png|genesis"
  "Book of Exodus  1.png|exodus"
  "bookofleviticus 1.png|leviticus"
  "Book of Deuteronomy 1.png|deuteronomy"
  # Historical
  "bookofjoshua 1.png|joshua"
  "Bookofjudgesupdated 1.png|judges"
  "Book of Ruth  1.png|ruth"
  "Book_Of_Kings_1 1.png|1-kings"
  "Book of Chronicles 2 1.png|2-chronicles"
  "BookofEzra_Updated 1.png|ezra"
  # Wisdom
  "thebookofjob.png|job"
  "Book of Proverbs 1.png|proverbs"
  "Ecclesiastes 2.png|ecclesiastes"
  # Major Prophets
  "Book_Of_Lamentations 1.png|lamentations"
  "book of ezekial 1.png|ezekiel"
  "Book_of_Daniel_ 1.png|daniel"
  # Minor Prophets
  "bookofhosea 1.png|hosea"
  "amos 1.png|amos"
  "Book of Obadiah  1.png|obadiah"
  "Book_Of_Jonah 1.png|jonah"
  "Book_Of_Micah 1.png|micah"
  "Book of Nahum 1.png|nahum"
  "bookofhabakkuk 1.png|habakkuk"
  "Book of Zephaniah  1.png|zephaniah"
  "Book of Haggai  1.png|haggai"
  "Book of Zachariah  1.png|zechariah"
  "book of malachi 1.png|malachi"
  # Gospels
  "Bookofmatthews.png|matthew"
  "bookofmarksaturated 1.png|mark"
  "bookofluke 1.png|luke"
  "Book of John  1.png|john"
  # Acts
  "bookofacts.png|acts"
  # Pauline
  "Book_Of_Romans 1.png|romans"
  "Book of Corinthians 1 1.png|1-corinthians"
  "Book_Of_Galatians 1.png|galatians"
  "Book_Of_Philippians 1.png|philippians"
  "Book_Of_Colossians_ 1.png|colossians"
  "Book_Of_Thessalonians_1 1.png|1-thessalonians"
  "Book_Of_Thessalonians_2 1.png|2-thessalonians"
  "Book_Of_Timothy_1 1.png|1-timothy"
  "Book_Of_Timothy_2 1.png|2-timothy"
  "Book_Of_Titus 1.png|titus"
  "Book_Of_Philemon 1.png|philemon"
  # General Epistles
  "bookofhebrews 1.png|hebrews"
  "Book_Of_James 1.png|james"
  "Book_Of_John_1 1.png|1-john"
  "Book_Of_John_2 1.png|2-john"
  "Book_Of_John_3 1.png|3-john"
  # Apocalyptic
  "Book_Of_Revelations 1.png|revelation"
)

total=${#MAPPING[@]}
i=0
for entry in "${MAPPING[@]}"; do
  i=$((i + 1))
  src="${entry%%|*}"
  bookId="${entry##*|}"
  in_path="${SRC_DIR}/${src}"
  out_path="${SRC_DIR}/${bookId}.jpg"

  if [[ ! -f "${in_path}" ]]; then
    echo "[${i}/${total}] SKIP (missing): ${in_path}"
    continue
  fi

  before=$(stat -f%z "${in_path}")
  sips -s format jpeg \
       -s formatOptions "${QUALITY}" \
       -Z "${MAX_EDGE}" \
       "${in_path}" \
       --out "${out_path}" > /dev/null
  after=$(stat -f%z "${out_path}")

  before_mb=$(awk "BEGIN{printf \"%.2f\", ${before}/1048576}")
  after_kb=$(awk "BEGIN{printf \"%.0f\", ${after}/1024}")
  echo "[${i}/${total}] ${bookId}: ${before_mb} MB → ${after_kb} KB"
done

echo
echo "Done. New JPG files written to ${SRC_DIR}/{bookId}.jpg"
