#!/usr/bin/env bash
# Opens Apple Developer + Supabase pages for native Sign in with Apple.
set -euo pipefail

BUNDLE_ID="com.espinalcapital.closer"
SUPABASE_REF="aoujadxqicyfgoaymmtz"

open "https://developer.apple.com/account/resources/identifiers/list"
open "https://supabase.com/dashboard/project/${SUPABASE_REF}/auth/providers"

cat <<EOF
Native Sign in with Apple — finish these 3 steps:

1) Apple Developer → Identifiers → ${BUNDLE_ID}
   - Open the App ID
   - Enable "Sign in with Apple"
   - Save

2) Supabase → Auth → Providers → Apple
   - Turn Apple ON
   - Client IDs: ${BUNDLE_ID}
   - Save (no secret needed for native iPhone sign-in)

3) Rebuild the dev app on your phone (required — new native module):
   npx expo run:ios --device

Then test onboarding → Continue with Apple on a PHYSICAL iPhone.
EOF
