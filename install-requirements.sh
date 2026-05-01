#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUIREMENTS_FILE="$ROOT_DIR/requirements.txt"

log() {
  printf '\n[%s] %s\n' "$1" "$2"
}

sudo_cmd() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    printf 'Installing system packages requires root privileges or sudo.\n' >&2
    return 1
  fi
}

package_manager() {
  if command -v apt-get >/dev/null 2>&1; then
    printf 'apt'
  elif command -v brew >/dev/null 2>&1; then
    printf 'brew'
  else
    printf 'none'
  fi
}

has_java_21() {
  if ! command -v java >/dev/null 2>&1; then
    return 1
  fi

  local major
  major="$(java -version 2>&1 | awk -F '"' '/version/ { print $2 }' | awk -F. '{ print ($1 == "1") ? $2 : $1 }')"
  [ "${major:-0}" -ge 21 ]
}

has_system_dependency() {
  case "$1" in
    java) has_java_21 ;;
    maven) command -v mvn >/dev/null 2>&1 ;;
    docker) command -v docker >/dev/null 2>&1 ;;
    docker-compose) docker compose version >/dev/null 2>&1 ;;
    node) command -v node >/dev/null 2>&1 ;;
    npm) command -v npm >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}

install_with_apt() {
  local dependency="$1"
  local packages=()

  case "$dependency" in
    java) packages=(openjdk-21-jdk) ;;
    maven) packages=(maven) ;;
    docker) packages=(docker.io) ;;
    docker-compose) packages=(docker-compose-plugin) ;;
    node) packages=(nodejs npm) ;;
    npm) packages=(npm) ;;
    *)
      printf 'No apt package mapping for %s.\n' "$dependency" >&2
      return 1
      ;;
  esac

  sudo_cmd apt-get update
  sudo_cmd apt-get install -y "${packages[@]}"
}

install_with_brew() {
  local dependency="$1"
  local packages=()

  case "$dependency" in
    java) packages=(openjdk@21) ;;
    maven) packages=(maven) ;;
    docker) packages=(docker) ;;
    docker-compose) packages=(docker-compose) ;;
    node | npm) packages=(node) ;;
    *)
      printf 'No Homebrew package mapping for %s.\n' "$dependency" >&2
      return 1
      ;;
  esac

  brew install "${packages[@]}"
}

install_system_dependency() {
  local requirement="$1"
  local dependency="${requirement%%>=*}"

  if has_system_dependency "$dependency"; then
    log system "$requirement is already installed."
    return 0
  fi

  log system "Installing $requirement..."
  case "$(package_manager)" in
    apt) install_with_apt "$dependency" ;;
    brew) install_with_brew "$dependency" ;;
    *)
      printf 'No supported package manager found for %s. Install it manually and rerun this script.\n' "$requirement" >&2
      return 1
      ;;
  esac

  if ! has_system_dependency "$dependency"; then
    printf '%s still is not available after installation.\n' "$requirement" >&2
    return 1
  fi
}

install_project_dependency() {
  case "$1" in
    frontend-npm)
      log project "Installing frontend npm dependencies..."
      (cd "$ROOT_DIR/frontend" && npm install)
      ;;
    backend-maven)
      log project "Resolving backend Maven dependencies..."
      (cd "$ROOT_DIR/backend/api" && mvn dependency:resolve dependency:resolve-plugins)
      ;;
    *)
      printf 'Unknown project requirement: %s\n' "$1" >&2
      return 1
      ;;
  esac
}

if [ ! -f "$REQUIREMENTS_FILE" ]; then
  printf 'Missing %s\n' "$REQUIREMENTS_FILE" >&2
  exit 1
fi

while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%#*}"
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"
  [ -z "$line" ] && continue

  kind="${line%%:*}"
  value="${line#*:}"

  case "$kind" in
    system) install_system_dependency "$value" ;;
    project) install_project_dependency "$value" ;;
    *)
      printf 'Unknown requirement kind in line: %s\n' "$line" >&2
      exit 1
      ;;
  esac
done < "$REQUIREMENTS_FILE"

log done "All requirements are installed."
