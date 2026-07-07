#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/configure-supabase.sh <project-url> <anon-key>

Example:
  ./scripts/configure-supabase.sh \
    https://abcdefgh.supabase.co \
    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Writes EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
into .env (gitignored). Does not commit or push anything.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

URL="${1:-}"
ANON_KEY="${2:-}"

if [[ -z "$URL" || -z "$ANON_KEY" ]]; then
  usage
  exit 1
fi

touch "$ENV_FILE"

upsert_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    perl -0pi -e "s/^${key}=.*$/${key}=${value}/m" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

upsert_env "EXPO_PUBLIC_SUPABASE_URL" "$URL"
upsert_env "EXPO_PUBLIC_SUPABASE_ANON_KEY" "$ANON_KEY"

echo "Wrote Supabase env vars to $ENV_FILE"
echo "Restart Metro with: npx expo start --clear"
