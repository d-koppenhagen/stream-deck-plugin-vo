#!/usr/bin/env bash
# Build the Stream Deck plugin bundle (.sdPlugin directory).
# Usage: npm run build:plugin

set -euo pipefail

PLUGIN_DIR="com.voiceover-streamdeck.sdPlugin"

echo "==> Compiling TypeScript..."
npx tsc

echo "==> Assembling $PLUGIN_DIR..."
rm -rf "$PLUGIN_DIR"
mkdir -p "$PLUGIN_DIR/bin"

# Copy the full compiled output tree (preserves actions/ and services/ subdirs)
cp -r dist/* "$PLUGIN_DIR/bin/"

# Copy manifest and icons (only PNGs — Stream Deck requires PNG format)
cp manifest.json "$PLUGIN_DIR/"
mkdir -p "$PLUGIN_DIR/imgs/actions" "$PLUGIN_DIR/imgs/plugin"
cp imgs/actions/*.png "$PLUGIN_DIR/imgs/actions/"
cp imgs/plugin/*.png "$PLUGIN_DIR/imgs/plugin/"

# Install production dependencies inside the plugin bundle
echo "==> Installing production dependencies..."
cp package.json "$PLUGIN_DIR/"
npm install --omit=dev --prefix "$PLUGIN_DIR" --silent

# Replace the full package.json with a minimal runtime one
# Node.js needs "type": "module" to handle ESM imports in .js files
cat > "$PLUGIN_DIR/package.json" <<'EOF'
{
  "type": "module"
}
EOF
rm -f "$PLUGIN_DIR/package-lock.json"

echo "==> Done. Plugin bundle ready at $PLUGIN_DIR/"
