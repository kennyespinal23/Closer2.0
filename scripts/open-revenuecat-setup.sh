#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ID="com.espinalcapital.closer"
ASC_APP_ID="6779004238"

open "https://app.revenuecat.com/"
open "https://appstoreconnect.apple.com/apps/${ASC_APP_ID}/distribution/subscriptions"
open "https://appstoreconnect.apple.com/apps/${ASC_APP_ID}/distribution/info"

cat <<EOF
RevenueCat + App Store subscription setup

PART A — App Store Connect (subscription product)
1) Subscriptions tab (opened) → Create Subscription Group: "Closer"
2) Add subscription:
   - Reference name: Closer Monthly
   - Product ID: closer_monthly
   - Price: \$7.99 / month
   - Free trial: 7 days
   - Save + submit for review when ready

PART B — RevenueCat (app.revenuecat.com)
1) New Project → Closer
2) Add iOS app → Bundle ID: ${BUNDLE_ID}
3) Connect App Store Connect (follow RC wizard — Shared Secret / API key)
4) Products → import closer_monthly from App Store
5) Entitlements → create entitlement id: pro
   - Attach closer_monthly to pro
6) Offerings → default offering → add Monthly package (closer_monthly)
7) Project Settings → API keys → copy the PUBLIC Apple/iOS key (starts with appl_)

PART C — Paste your iOS public API key here:
   appl_xxxxxxxx

I'll add it to .env and EAS for you.

PART D — Rebuild dev app:
   npx expo run:ios --device
EOF
