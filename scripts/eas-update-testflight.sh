#!/usr/bin/env bash
# Publish a JS OTA to the testflight channel.
#
# EAS fingerprint can fail on duplicate targets/**/Shared.swift — we skip
# auto-fingerprint for OTA (JS-only updates). Native builds still use
# fingerprint.config.js when fingerprint runs.
#
# We export ios+android bundles first, then publish with --skip-bundler.
# Running `eas update` with the built-in bundler can still hit the Shared.swift
# EEXIST collision even when EAS_SKIP_AUTO_FINGERPRINT=1.
#
#   chmod +x scripts/eas-update-testflight.sh
#   ./scripts/eas-update-testflight.sh "Your update message"

set -euo pipefail
cd "$(dirname "$0")/.."

MESSAGE="${1:-Closer OTA update}"

export EAS_SKIP_AUTO_FINGERPRINT=1

echo "Exporting ios + android bundles..."
npx expo export \
  --output-dir dist \
  --dump-assetmap \
  --platform ios \
  --platform android

EAS_SKIP_AUTO_FINGERPRINT=1 npx eas-cli update \
  --channel testflight \
  --message "${MESSAGE}" \
  --non-interactive \
  --skip-bundler

echo "Done. Force-quit the app twice on device to pull the update."
