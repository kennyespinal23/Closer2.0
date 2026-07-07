#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/configure-google-env.sh <web-client-id> <ios-client-id> <ios-url-scheme> [web-client-secret-for-reference]

Example:
  ./scripts/configure-google-env.sh \
    123456789-abc.apps.googleusercontent.com \
    123456789-ios.apps.googleusercontent.com \
    com.googleusercontent.apps.123456789-ios

Writes Google env vars into .env (gitignored). Paste the Web Client
Secret into Supabase yourself — never commit it to the app.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

WEB_ID="${1:-}"
IOS_ID="${2:-}"
IOS_SCHEME="${3:-}"

if [[ -z "$WEB_ID" || -z "$IOS_ID" || -z "$IOS_SCHEME" ]]; then
  usage
  exit 1
fi

if [[ "$IOS_SCHEME" != com.googleusercontent.apps.* ]]; then
  echo "ios-url-scheme must start with com.googleusercontent.apps."
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

upsert_env "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" "$WEB_ID"
upsert_env "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" "$IOS_ID"
upsert_env "EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME" "$IOS_SCHEME"

echo "Wrote Google env vars to $ENV_FILE"
echo "Next: paste Web Client Secret into Supabase → Auth → Google"
echo "Then rebuild: npx expo run:ios --device"
