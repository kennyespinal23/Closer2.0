#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is not installed. Run: brew install supabase/tap/supabase"
  exit 1
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing .env. Run ./scripts/configure-supabase.sh first."
  exit 1
fi

URL="$(grep '^EXPO_PUBLIC_SUPABASE_URL=' "$ROOT/.env" | cut -d= -f2- || true)"
if [[ -z "$URL" ]]; then
  echo "EXPO_PUBLIC_SUPABASE_URL is missing from .env"
  exit 1
fi

PROJECT_REF="${URL#https://}"
PROJECT_REF="${PROJECT_REF%%.supabase.co}"

echo "Linking Supabase project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo "Pushing database schema..."
supabase db push

echo "Done. Tables profiles + user_data are ready with row-level security."
