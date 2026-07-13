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
# right.

set -euo pipefail

SRC_DIR="assets/book-covers"
QUALITY=85
MAX_EDGE=1200

# Map of {source-filename → bookId}. Filenames must match the
# assets on disk exactly (including trailing spaces before .PNG).
declare -a MAPPING=(
  # The Law
  "Book of Genesis.PNG|genesis"
  "Book of Exodus.PNG|exodus"
  "Book of Leviticus 1.PNG|leviticus"
  "Book of Numbers.PNG|numbers"
  "Book of Deuteronomy 1.PNG|deuteronomy"
  # Historical
  "Book of Joshua.PNG|joshua"
  "Book of Judges.png|judges"
  "Book of Ruth.PNG|ruth"
  "Book of Samuel 1.PNG|1-samuel"
  "Book of Samuel 2.PNG|2-samuel"
  "Book of kings .PNG|1-kings"
  "Book of Kings 2.PNG|2-kings"
  "Book of Chronicles 1.PNG|1-chronicles"
  "Book of Chronicles 2.PNG|2-chronicles"
  "Book of Ezra.PNG|ezra"
  "Book of Nehemiah.PNG|nehemiah"
  "Book of Esther.PNG|esther"
  # Wisdom
  "Book of Job.PNG|job"
  "Book of Psalms .PNG|psalms"
  "Book of Proverbs .PNG|proverbs"
  "Book of Ecclesiastes .PNG|ecclesiastes"
  "Book of Song of Solomon .PNG|song-of-solomon"
  # Major Prophets
  "Book of Isaiah .PNG|isaiah"
  "Book of Jeremiah.PNG|jeremiah"
  "Book of Lamentations .PNG|lamentations"
  "Book of Ezekiel .PNG|ezekiel"
  "Book of Daniel.PNG|daniel"
  # Minor Prophets
  "Book of Hosea.PNG|hosea"
  "Book of Joel.PNG|joel"
  "Book of Amos 1.PNG|amos"
  "Book of Obadiah .PNG|obadiah"
  "Book of Jonah.PNG|jonah"
  "Book of Micah .PNG|micah"
  "Book of Nahum.PNG|nahum"
  "Book of Habakkuk 1.PNG|habakkuk"
  "Book of Zephaniah.PNG|zephaniah"
  "Book of Haggai.PNG|haggai"
  "Book of Zachariah 1.PNG|zechariah"
  "Book of Malachi 1.PNG|malachi"
  # Gospels
  "Book of Matthews .PNG|matthew"
  "Book of Mark.PNG|mark"
  "Book of Luke.PNG|luke"
  "Book of John .PNG|john"
  # Acts
  "Book of facts.PNG|acts"
  # Pauline
  "Book of Romans .PNG|romans"
  "Book of Corinthians .PNG|1-corinthians"
  "Book of Corinthians 2.PNG|2-corinthians"
  "Book of Galatians 1.PNG|galatians"
  "Book of Ephesians.PNG|ephesians"
  "Book of Philippians 1.PNG|philippians"
  "Book of Colossians .PNG|colossians"
  "Book of Thessalonians 1.PNG|1-thessalonians"
  "Book of Thessalonians 2.PNG|2-thessalonians"
  "Book of Timothy 1.PNG|1-timothy"
  "Book of Timothy 2.PNG|2-timothy"
  "Book of Titus.PNG|titus"
  "Book of Philemon.PNG|philemon"
  # General Epistles
  "Book of hebrews .PNG|hebrews"
  "Book of James.PNG|james"
  "Book of Peter 1.PNG|1-peter"
  "Book of Peter 2.PNG|2-peter"
  "Book of John 1.PNG|1-john"
  "Book of John 2.PNG|2-john"
  "Book of John 3.PNG|3-john"
  "Book of Jude.PNG|jude"
  # Apocalyptic
  "Book of Revelations .PNG|revelation"
)

total=${#MAPPING[@]}
i=0
missing=0
for entry in "${MAPPING[@]}"; do
  i=$((i + 1))
  src="${entry%%|*}"
  bookId="${entry##*|}"
  in_path="${SRC_DIR}/${src}"
  out_path="${SRC_DIR}/${bookId}.jpg"

  if [[ ! -f "${in_path}" ]]; then
    echo "[${i}/${total}] SKIP (missing): ${in_path}"
    missing=$((missing + 1))
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
echo "Done. Missing sources: ${missing}"
