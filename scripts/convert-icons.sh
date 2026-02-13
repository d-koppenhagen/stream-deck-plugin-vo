#!/usr/bin/env bash
# Convert SVG source icons to the PNG sizes required by Stream Deck.
# Requires: rsvg-convert (install via `brew install librsvg`)
#
# Action icons:  40×40 @1x, 80×80 @2x
# Plugin icon:   56×56 @1x, 112×112 @2x
#
# Usage: npm run icons

set -euo pipefail

if ! command -v rsvg-convert &>/dev/null; then
  echo "Error: rsvg-convert not found."
  echo "Install it with: brew install librsvg"
  exit 1
fi

echo "==> Converting action icons..."
for svg in imgs/actions/*.svg; do
  base=$(basename "$svg" .svg)
  rsvg-convert -w 40 -h 40 "$svg" -o "imgs/actions/${base}.png"
  rsvg-convert -w 80 -h 80 "$svg" -o "imgs/actions/${base}@2x.png"
  echo "   ${base}"
done

echo "==> Converting plugin icon..."
rsvg-convert -w 56 -h 56 imgs/plugin/voiceover-plugin.svg -o imgs/plugin/voiceover-plugin.png
rsvg-convert -w 112 -h 112 imgs/plugin/voiceover-plugin.svg -o "imgs/plugin/voiceover-plugin@2x.png"
echo "   voiceover-plugin"

echo "==> Done."
