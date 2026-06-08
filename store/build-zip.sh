#!/usr/bin/env bash
# Build the Chrome Web Store upload package.
# Run from the repo root: bash store/build-zip.sh
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(grep -m1 '"version"' manifest.json | sed -E 's/.*"version"[^"]*"([^"]+)".*/\1/')
OUT="leetnoise-v${VERSION}.zip"

rm -f "$OUT"
zip -r "$OUT" . \
  -x ".git/*" ".gitignore" "CLAUDE.md" "store/*" \
     "*.DS_Store" "leetnoise-*.zip" "PRIVACY.md" \
     "assets/LeetNoise.png" "assets/logo.png" >/dev/null

echo "Built $OUT"
unzip -l "$OUT"
