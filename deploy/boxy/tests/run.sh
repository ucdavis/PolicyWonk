#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
fixtures_dir=$(mktemp -d)
trap 'rm "$fixtures_dir/"*; rmdir "$fixtures_dir"' EXIT
npm ci --prefix diagnostics --ignore-scripts --no-audit --no-fund
node tests/fixtures.cjs "$fixtures_dir"
# This instance has no production database, keys, metadata, or network IdP.
container_id=$(docker run -d --platform linux/amd64 -p 127.0.0.1::5225 \
  -e DB_ENGINE=mem -e JACKSON_API_KEYS=isolated-test-key \
  -e BOXYHQ_NO_ANALYTICS=1 -e EXTERNAL_URL=http://localhost:5225 \
  -e SAML_AUDIENCE=https://sp.example.invalid \
  "${1:-policywonk-sso:source}")
cleanup() {
  docker stop "$container_id" >/dev/null
  docker rm "$container_id" >/dev/null
  rm "$fixtures_dir/"*
  rmdir "$fixtures_dir"
}
trap cleanup EXIT
port=$(docker port "$container_id" 5225/tcp | sed 's/.*://')
node tests/http.cjs "http://127.0.0.1:$port" "$fixtures_dir/fixtures.json" "$fixtures_dir/report.json"
docker logs "$container_id" > "$fixtures_dir/container.log" 2>&1
node tests/logs.cjs "$fixtures_dir/container.log" "$fixtures_dir/report.json"
