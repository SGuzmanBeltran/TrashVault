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

echo "==> Backend type-check"
install_deps "$ROOT/backend"
cd "$ROOT/backend"
bun run type-check

echo "==> Frontend type-check"
install_deps "$ROOT/frontend"
cd "$ROOT/frontend"
bun run type-check

echo "==> All type checks passed"
