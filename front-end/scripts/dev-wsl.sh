#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node not found in PATH" >&2
  exit 1
fi

if [ ! -d "$ROOT_DIR/node_modules/next" ]; then
  echo "Error: node_modules not found (or next not installed)." >&2
  echo "Run dependency install using a Linux package manager inside WSL." >&2
  exit 1
fi

exec node "$ROOT_DIR/node_modules/next/dist/bin/next" dev

