#!/usr/bin/env bash
# Regenerates every PDF in the pdf/ folder from the .md and .csv files.
# Needs: node 18+, pandoc, python3 with pypdf, Chromium for Playwright,
#        fonts Inter, DejaVu Sans Mono and Noto Color Emoji.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
cd "$HERE"
[ -d node_modules/mermaid ] || npm install --no-audit --no-fund
node build.js "$REPO" "$REPO/pdf" "$HERE/node_modules/mermaid/dist/mermaid.min.js"
python3 fix_outline.py "$HERE/.build-html" "$REPO/pdf"
echo "Done. PDFs are in $REPO/pdf"
