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

echo "==> Backend lint"
install_deps "$ROOT/backend"
cd "$ROOT/backend"
bun run lint

echo "==> Frontend lint"
install_deps "$ROOT/frontend"
cd "$ROOT/frontend"
bun run lint:ci

echo "==> All lint checks passed"
