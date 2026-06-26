#!/usr/bin/env bash
# Refresh iOS provisioning profiles (Family Controls) and ship a TestFlight build.
#
# Run from the project root in Terminal — Apple will prompt for your
# Apple ID password and 2FA. EAS cannot do this step non-interactively.
#
#   chmod +x scripts/ios-testflight-build.sh
#   ./scripts/ios-testflight-build.sh
#
# If you see "Apple Account has been locked" or Apple ID shows as "y":
#   1. Unlock at https://iforgot.apple.com
#   2. Open Keychain Access → search "expo" → delete Expo / Apple entries
#   3. Re-run this script and enter espinalcapital@gmail.com when asked
#
# Before running, confirm in developer.apple.com → Identifiers that
# Family Controls + App Groups are ON for all four bundle IDs:
#   • com.espinalcapital.closer
#   • com.espinalcapital.closer.ShieldConfiguration
#   • com.espinalcapital.closer.ShieldAction
#   • com.espinalcapital.closer.ActivityMonitorExtension

set -euo pipefail
cd "$(dirname "$0")/.."

APPLE_ID="${APPLE_ID:-espinalcapital@gmail.com}"

echo "Using Apple ID: ${APPLE_ID}"
echo "(override with: APPLE_ID=you@email.com ./scripts/ios-testflight-build.sh)"
echo ""

echo "→ Step 1: Refresh iOS credentials (log in when prompted)…"
echo "   When asked for Apple ID, type: ${APPLE_ID}"
npx eas-cli credentials:configure-build --platform ios --profile production

echo ""
echo "→ Step 2: TestFlight build (no Screen Time extensions — team QA)…"
npx eas-cli build --platform ios --profile testflight

echo ""
echo "→ Step 3: Submit to TestFlight (optional)…"
read -r -p "Submit this build to TestFlight now? [y/N] " SUBMIT
if [[ "${SUBMIT,,}" == "y" ]]; then
  npx eas-cli submit --platform ios --profile production --latest
fi

echo "Done."
