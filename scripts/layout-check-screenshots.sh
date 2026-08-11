#!/usr/bin/env bash
# Capture key Closer screens on two booted Simulators for layout compare.
# Default: smallest available compact phone + Pro Max.
#
# Usage:
#   ./scripts/layout-check-screenshots.sh
#   COMPACT_UDID=... LARGE_UDID=... ./scripts/layout-check-screenshots.sh
#
# Tip: boot devices first:
#   xcrun simctl boot "iPhone 16e"
#   xcrun simctl boot "iPhone 17 Pro Max"
#   open -a Simulator

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${OUT_DIR:-$ROOT/.tmp-layout-check}"
mkdir -p "$OUT"

COMPACT_UDID="${COMPACT_UDID:-95004B0B-E172-4EB5-95E3-C2CC1E22842B}" # iPhone 16e
LARGE_UDID="${LARGE_UDID:-3086E99D-9609-48EA-8030-11EC921056DC}"     # iPhone 17 Pro Max
BUNDLE_ID="${BUNDLE_ID:-com.espinalcapital.closer}"
METRO_URL="${METRO_URL:-http://127.0.0.1:8081}"

ROUTES=(
  "onboarding/howitworks"
  "onboarding/notifications"
  "onboarding/account"
  "onboarding/paywall"
  "today"
  "library"
  "profile"
)

encode() {
  node -e "console.log(encodeURIComponent(process.argv[1]))" "$1"
}

launch_dev() {
  local udid="$1"
  xcrun simctl terminate "$udid" "$BUNDLE_ID" >/dev/null 2>&1 || true
  local enc
  enc="$(encode "$METRO_URL")"
  xcrun simctl openurl "$udid" "closer://expo-development-client/?url=${enc}" >/dev/null 2>&1 \
    || xcrun simctl launch "$udid" "$BUNDLE_ID" >/dev/null 2>&1 || true
}

shot() {
  local udid="$1"
  local label="$2"
  local route="$3"
  local safe="${route//\//-}"
  xcrun simctl openurl "$udid" "closer:///${route}" >/dev/null 2>&1 || true
  sleep 2.4
  xcrun simctl io "$udid" screenshot "$OUT/${label}-${safe}.png" >/dev/null
  echo "wrote $OUT/${label}-${safe}.png"
}

echo "Launching against Metro ($METRO_URL)…"
launch_dev "$COMPACT_UDID"
launch_dev "$LARGE_UDID"
sleep 8

for route in "${ROUTES[@]}"; do
  echo "== ${route} =="
  shot "$LARGE_UDID" "large" "$route"
  shot "$COMPACT_UDID" "compact" "$route"
done

echo
echo "Done. Compare pairs in: $OUT"
echo "Checklist: CTAs not clipped, no overflow, safe areas, scroll on short screens."
