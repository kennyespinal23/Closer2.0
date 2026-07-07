#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/configure-revenuecat-env.sh <ios-public-api-key>

Example:
  ./scripts/configure-revenuecat-env.sh appl_xxxxxxxxxxxxxxxx

Writes EXPO_PUBLIC_REVENUECAT_IOS_API_KEY into .env (gitignored).
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

KEY="${1:-}"
if [[ -z "$KEY" ]]; then
  usage
  exit 1
fi

touch "$ENV_FILE"

if grep -q "^EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=" "$ENV_FILE"; then
  perl -0pi -e "s/^EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=.*/EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=${KEY}/m" "$ENV_FILE"
else
  printf '\nEXPO_PUBLIC_REVENUECAT_IOS_API_KEY=%s\n' "$KEY" >> "$ENV_FILE"
fi

echo "Wrote RevenueCat iOS API key to $ENV_FILE"

if command -v npx >/dev/null 2>&1; then
  if npx eas-cli env:create --help >/dev/null 2>&1; then
    if npx eas-cli env:list --environment production 2>/dev/null | grep -q "^EXPO_PUBLIC_REVENUECAT_IOS_API_KEY="; then
      npx eas-cli env:update --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "$KEY" --visibility plaintext --non-interactive
      echo "Updated EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in EAS (production)"
    else
      npx eas-cli env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "$KEY" --visibility plaintext --non-interactive
      echo "Created EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in EAS (production)"
    fi
  fi
fi

echo "Rebuild: npx expo run:ios --device"
