#!/usr/bin/env bash
# Opens the three Supabase dashboard pages Closer needs and copies
# the database SQL to your clipboard. Run once after creating a project.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="aoujadxqicyfgoaymmtz"
SQL_FILE="$ROOT/supabase/migrations/20260703180000_initial_schema.sql"

pbcopy < "$SQL_FILE"

open "https://supabase.com/dashboard/project/${REF}/auth/providers"
open "https://supabase.com/dashboard/project/${REF}/settings/auth"
open "https://supabase.com/dashboard/project/${REF}/auth/url-configuration"
open "https://supabase.com/dashboard/project/${REF}/sql/new"

cat <<EOF
Opened Supabase dashboard tabs and copied database SQL to your clipboard.

Do these 4 quick clicks in the browser tabs that just opened:

1) Auth → Providers → Email
   - Turn Email ON
   - Save

2) Auth → Settings (User Signups)
   - Turn ON "Allow new users to sign up"
   - Save

3) Auth → URL Configuration
   - Add redirect URL: closer://auth/callback
   - Save

4) SQL Editor (new query)
   - Paste (Cmd+V) — SQL is already on your clipboard
   - Click Run

Then restart Metro: npx expo start --clear
Test: Settings → Account → Continue with Email
EOF
