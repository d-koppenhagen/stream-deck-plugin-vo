#!/usr/bin/env bash
# Build and deploy the plugin locally for testing.
# Requires: npm install -g @elgato/cli
# Usage: npm run deploy

set -euo pipefail

PLUGIN_DIR="com.voiceover-streamdeck.sdPlugin"
PLUGIN_UUID="com.voiceover-streamdeck"

# Check that the Stream Deck CLI is installed
if ! command -v streamdeck &>/dev/null; then
  echo "Error: Stream Deck CLI not found."
  echo "Install it with: npm install -g @elgato/cli"
  exit 1
fi

# Build the plugin bundle
bash scripts/build-plugin.sh

# Enable developer mode (idempotent, safe to run multiple times)
echo "==> Enabling Stream Deck developer mode..."
streamdeck dev 2>/dev/null || true

# Link the plugin into Stream Deck (fails silently if already linked)
echo "==> Linking $PLUGIN_DIR to Stream Deck..."
if streamdeck link "$PLUGIN_DIR" 2>&1 | grep -qi "linked\|already"; then
  echo "   Linked."
else
  echo "   Link may have failed — check that Stream Deck is running."
fi

# Try to restart the plugin. On first deploy this will fail because
# Stream Deck hasn't loaded the plugin yet — that's expected.
echo "==> Restarting plugin..."
if streamdeck restart "$PLUGIN_UUID" 2>/dev/null; then
  echo "   Plugin restarted."
else
  echo "   Could not restart (expected on first deploy)."
  echo "   Please restart the Stream Deck app to load the plugin."
fi

echo ""
echo "Done! Look for the 'VoiceOver Control' category in Stream Deck."
