#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

install_deps() {
  local dir="$1"
  cd "$dir"
  if [[ -f bun.lock ]]; then
    bun install --frozen-lockfile
  else
    bun install
  fi
}

echo "==> Frontend build"
install_deps "$ROOT/frontend"
cd "$ROOT/frontend"
bun run build-only

echo "==> Build succeeded"
