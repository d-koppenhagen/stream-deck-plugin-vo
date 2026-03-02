#!/usr/bin/env bash
# Syncs the manifest.json "Version" field with the current npm package version.
# Called automatically by the npm "version" lifecycle script.
#
# Stream Deck uses a 4-segment version format (e.g. 1.2.3.0),
# so we append ".0" to the 3-segment npm version.

set -euo pipefail

VERSION="${npm_package_version:?npm_package_version not set — run this via npm version}"
SD_VERSION="${VERSION}.0"

node --input-type=commonjs -e "
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.Version = '${SD_VERSION}';
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
"

git add manifest.json
echo "manifest.json updated to ${SD_VERSION}"
