#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Running backend tests..."

if ! command -v mvn >/dev/null 2>&1; then
  echo "Error: Maven is not installed or not on PATH." >&2
  exit 1
fi

cd "$repo_root/api"

if mvn test; then
  echo "Backend tests passed."
else
  status=$?
  echo "Backend tests failed." >&2
  exit "$status"
fi
