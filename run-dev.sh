#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$ROOT_DIR/backend"
API_DIR="$ROOT_DIR/backend/api"
FRONTEND_DIR="$ROOT_DIR/frontend"
PIDS=()

log() {
  printf '\n[%s] %s\n' "$1" "$2"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

cleanup() {
  local status=$?
  trap - INT TERM EXIT

  log shutdown "Stopping frontend/backend processes..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  wait "${PIDS[@]:-}" >/dev/null 2>&1 || true

  log shutdown "Stopping database container..."
  (cd "$DB_DIR" && docker compose down) >/dev/null 2>&1 || true

  exit "$status"
}

wait_for_postgres() {
  log database "Waiting for PostgreSQL to accept connections..."
  for _ in {1..60}; do
    if (cd "$DB_DIR" && docker compose exec -T postgres pg_isready -U clockedin -d clockedin) >/dev/null 2>&1; then
      log database "PostgreSQL is ready."
      return 0
    fi
    sleep 1
  done

  printf 'PostgreSQL did not become ready within 60 seconds.\n' >&2
  return 1
}

require_command docker
require_command mvn
require_command npm
docker compose version >/dev/null

trap cleanup INT TERM EXIT

log database "Starting PostgreSQL with: docker compose up --build"
(cd "$DB_DIR" && exec docker compose up --build) &
PIDS+=("$!")

wait_for_postgres

log backend "Starting Spring Boot with: mvn spring-boot:run"
(cd "$API_DIR" && exec mvn spring-boot:run) &
PIDS+=("$!")

log frontend "Starting Vite with: npm run dev"
(cd "$FRONTEND_DIR" && exec npm run dev) &
PIDS+=("$!")

log ready "Frontend: http://localhost:5173 | Backend: http://localhost:8080"
log ready "Press Ctrl-C to stop all services."

wait -n "${PIDS[@]}"
