#!/usr/bin/env bash
# Bump version across package.json, package-lock.json, and manifest.json,
# then commit and tag — without relying on npm lifecycle scripts.
#
# Usage: bash scripts/release.sh patch|minor|major

set -euo pipefail

BUMP="${1:?Usage: bash scripts/release.sh patch|minor|major}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Error: argument must be 'patch', 'minor', or 'major'"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Bump package.json + package-lock.json (--no-git-tag-version skips commit & tag)
npm version "$BUMP" --no-git-tag-version

# Read the new version from package.json
VERSION=$(node --input-type=commonjs -p "require('./package.json').version")
SD_VERSION="${VERSION}.0"

# Update manifest.json
node --input-type=commonjs -e "
  const fs = require('fs');
  const m = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  m.Version = '${SD_VERSION}';
  fs.writeFileSync('manifest.json', JSON.stringify(m, null, 2) + '\n');
"

# Commit and tag
git add package.json package-lock.json manifest.json
git commit -m "${VERSION}"
git tag "v${VERSION}"

echo ""
echo "Released v${VERSION} (manifest: ${SD_VERSION})"
echo "Run 'git push --follow-tags' to publish."
