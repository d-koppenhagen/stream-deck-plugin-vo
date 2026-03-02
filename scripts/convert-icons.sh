#!/usr/bin/env bash
# Convert SVG source icons to the PNG sizes required by Stream Deck,
# and generate marketplace images (icon, thumbnail, gallery).
#
# Requires:
#   rsvg-convert  — brew install librsvg
#   magick        — brew install imagemagick
#
# Action icons:      40×40 @1x, 80×80 @2x
# Plugin icon:       56×56 @1x, 112×112 @2x
# Marketplace icon:  288×288
# Thumbnail:         1920×960
# Gallery:           1920×960
#
# Usage: npm run icons

set -euo pipefail

BG_COLOR="#1a1a2e"

if ! command -v rsvg-convert &>/dev/null; then
  echo "Error: rsvg-convert not found."
  echo "Install it with: brew install librsvg"
  exit 1
fi

if ! command -v magick &>/dev/null; then
  echo "Error: ImageMagick not found."
  echo "Install it with: brew install imagemagick"
  exit 1
fi

# --- Stream Deck icons ---

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

# --- Marketplace images ---

mkdir -p marketplace
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "==> Generating marketplace icon (288×288)..."
rsvg-convert -w 288 -h 288 imgs/plugin/voiceover-plugin.svg -o "$TMPDIR/icon-raw.png"
magick "$TMPDIR/icon-raw.png" -background "$BG_COLOR" -gravity center -extent 288x288 marketplace/icon.png
echo "   icon"

echo "==> Generating marketplace thumbnail (1920×960)..."
rsvg-convert -w 200 -h 200 imgs/plugin/voiceover-plugin.svg -o "$TMPDIR/thumb-icon.png"
magick -size 1920x960 "xc:${BG_COLOR}" \
  "$TMPDIR/thumb-icon.png" -gravity center -geometry +0-80 -composite \
  -gravity center -fill white -font Helvetica-Bold -pointsize 64 -annotate +0+120 "VoiceOver Control" \
  -gravity center -fill "#aaaacc" -font Helvetica -pointsize 32 -annotate +0+180 "Stream Deck Plugin for macOS Accessibility Testing" \
  marketplace/thumbnail.png
echo "   thumbnail"

echo "==> Generating marketplace gallery (1920×960)..."

# Pre-render action icons for gallery use
ALL_ACTIONS=(
  "toggle-voiceover:VoiceOver Toggle"
  "interrupt-speech:Interrupt Speech"
  "next-element:Next Element"
  "prev-element:Previous Element"
  "open-rotor:Open Rotor"
  "repeat-last-phrase:Repeat Last Phrase"
  "next-focusable:Next Focusable"
  "prev-focusable:Previous Focusable"
  "start-reading:Start Reading"
  "open-settings:Open Settings"
)

for entry in "${ALL_ACTIONS[@]}"; do
  key="${entry%%:*}"
  rsvg-convert -w 120 -h 120 "imgs/actions/${key}.svg" -o "$TMPDIR/gallery-${key}.png"
done

# --- Gallery 1: Hero — Icon + title + subtitle ---
rsvg-convert -w 280 -h 280 imgs/plugin/voiceover-plugin.svg -o "$TMPDIR/hero-icon.png"

magick -size 1920x960 "xc:${BG_COLOR}" \
  -gravity NorthWest \
  "$TMPDIR/hero-icon.png" -geometry +820+100 -composite \
  -fill white -font Helvetica-Bold -pointsize 72 \
  -gravity North -annotate +0+420 "VoiceOver Control" \
  -fill "#aaaacc" -font Helvetica -pointsize 36 \
  -gravity North -annotate +0+510 "Stream Deck Plugin for macOS Accessibility Testing" \
  -fill "#666680" -font Helvetica -pointsize 24 \
  -gravity North -annotate +0+580 "10 Actions  ·  macOS 13+  ·  Open Source  ·  MIT License" \
  marketplace/gallery-1-hero.png
echo "   gallery-1-hero"

# --- Gallery 2: Navigation & Speech — two groups side by side ---
G2_ARGS=()

# Navigation group (left)
NAV_KEYS=("next-element" "prev-element" "next-focusable" "prev-focusable" "open-rotor")
NAV_LABELS=("Next Element" "Previous Element" "Next Focusable" "Previous Focusable" "Open Rotor")
for i in "${!NAV_KEYS[@]}"; do
  y=$((280 + i * 120))
  G2_ARGS+=( "$TMPDIR/gallery-${NAV_KEYS[$i]}.png" -geometry "+160+${y}" -composite )
  G2_ARGS+=( -fill "#ccccdd" -font Helvetica -pointsize 26 -annotate "+300+$((y + 72))" "${NAV_LABELS[$i]}" )
done

# Speech & Settings group (right)
SPEECH_KEYS=("toggle-voiceover" "interrupt-speech" "start-reading" "repeat-last-phrase" "open-settings")
SPEECH_LABELS=("VoiceOver Toggle" "Interrupt Speech" "Start Reading" "Repeat Last Phrase" "Open Settings")
for i in "${!SPEECH_KEYS[@]}"; do
  y=$((280 + i * 120))
  G2_ARGS+=( "$TMPDIR/gallery-${SPEECH_KEYS[$i]}.png" -geometry "+1040+${y}" -composite )
  G2_ARGS+=( -fill "#ccccdd" -font Helvetica -pointsize 26 -annotate "+1180+$((y + 72))" "${SPEECH_LABELS[$i]}" )
done

magick -size 1920x960 "xc:${BG_COLOR}" \
  -gravity NorthWest \
  -fill "#888899" -font Helvetica-Bold -pointsize 36 \
  -annotate +160+180 "Navigation" \
  -stroke "#333350" -strokewidth 1 -draw "line 160,230 860,230" -stroke none \
  -fill "#888899" -font Helvetica-Bold -pointsize 36 \
  -annotate +1040+180 "Speech & Settings" \
  -stroke "#333350" -strokewidth 1 -draw "line 1040,230 1740,230" -stroke none \
  "${G2_ARGS[@]}" \
  marketplace/gallery-2-features.png
echo "   gallery-2-features"

# --- Gallery 3: All actions in a 5×2 grid ---
G3_ARGS=()
COL_SPACING=340
ROW_SPACING=380
X_OFFSET=150
Y_OFFSET=120
i=0
for entry in "${ALL_ACTIONS[@]}"; do
  key="${entry%%:*}"
  label="${entry#*:}"
  col=$((i % 5))
  row=$((i / 5))
  x=$((X_OFFSET + col * COL_SPACING))
  y=$((Y_OFFSET + row * ROW_SPACING))
  label_y=$((y + 140))
  G3_ARGS+=( "$TMPDIR/gallery-${key}.png" -geometry "+${x}+${y}" -composite )
  G3_ARGS+=( -fill "#ccccdd" -font Helvetica -pointsize 22 -annotate "+$((x - 30))+${label_y}" "$label" )
  i=$((i + 1))
done

magick -size 1920x960 "xc:${BG_COLOR}" \
  -gravity NorthWest \
  "${G3_ARGS[@]}" \
  marketplace/gallery-3-all-actions.png
echo "   gallery-3-all-actions"

echo "==> Done."
