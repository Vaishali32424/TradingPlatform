#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ATLAS=false
PORT=80

while [[ $# -gt 0 ]]; do
  case "$1" in
    --atlas) ATLAS=true; shift ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "Usage: $0 [--atlas] [--port 80]"; exit 1 ;;
  esac
done

command -v docker >/dev/null || { echo "Install Docker first: https://docs.docker.com/get-docker/"; exit 1; }

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env — set JWT_SECRET and passwords before production."
fi

export APP_PORT="$PORT"

if [[ "$ATLAS" == true ]]; then
  echo "Deploying API + Web (MongoDB Atlas)..."
  docker compose -f docker-compose.atlas.yml up -d --build
else
  echo "Deploying API + Web + MongoDB..."
  docker compose up -d --build
fi

echo ""
echo "App: http://localhost:${PORT}"
echo "API: http://localhost:${PORT}/api/health"
