#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
fixtures_dir=$(mktemp -d)
trap 'rm -rf "$fixtures_dir"' EXIT
npm ci --prefix diagnostics --ignore-scripts --no-audit --no-fund
node tests/fixtures.cjs "$fixtures_dir"
docker run --rm --platform linux/amd64 --entrypoint node \
  -v "$fixtures_dir:/fixtures:ro" -v "$PWD/tests:/tests:ro" \
  "${1:-policywonk-sso:diagnostics}" /tests/image.cjs
