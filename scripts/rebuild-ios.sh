#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Closer iOS rebuild (links expo-video for Get Started)"
echo

if ! curl -fsI https://cdn.cocoapods.org/ >/dev/null 2>&1; then
  echo "⚠️  CocoaPods CDN looks blocked (403)."
  echo "   If pod install fails, try on a normal network / VPN off, then re-run this script."
  echo
fi

echo "▶ pod install"
pod install --project-directory=ios

echo
echo "▶ Building & launching on Simulator"
npx expo run:ios

echo
echo "✅ Done — Get Started video should loop on first launch (new users)."
