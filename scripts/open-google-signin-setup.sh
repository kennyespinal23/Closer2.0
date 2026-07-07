#!/usr/bin/env bash
set -euo pipefail

SUPABASE_REF="aoujadxqicyfgoaymmtz"
BUNDLE_ID="com.espinalcapital.closer"
CALLBACK="https://${SUPABASE_REF}.supabase.co/auth/v1/callback"

open "https://console.cloud.google.com/apis/credentials"
open "https://console.cloud.google.com/apis/credentials/consent"
open "https://supabase.com/dashboard/project/${SUPABASE_REF}/auth/providers"

cat <<EOF
Google Sign-In setup — do these in order:

1) Google Cloud → OAuth consent screen
   - App name: Closer
   - User support email: your email
   - Save

2) Google Cloud → Credentials → Create OAuth client ID → Web application
   - Name: Closer Supabase
   - Authorized redirect URIs: ${CALLBACK}
   - Create → copy Client ID + Client Secret

3) Google Cloud → Create OAuth client ID → iOS
   - Bundle ID: ${BUNDLE_ID}
   - Create → copy iOS Client ID
   - Copy the iOS URL scheme (com.googleusercontent.apps.…)

4) Supabase → Auth → Providers → Google
   - Turn ON
   - Client ID: (Web client ID from step 2)
   - Client Secret: (Web client secret from step 2)
   - Save

5) Back here — paste your 3 Google values and I'll wire .env:
   Web Client ID: xxxxx.apps.googleusercontent.com
   iOS Client ID: xxxxx.apps.googleusercontent.com
   iOS URL scheme: com.googleusercontent.apps.xxxxx

6) Rebuild dev app:
   npx expo run:ios --device
EOF
