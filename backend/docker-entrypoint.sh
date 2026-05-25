#!/bin/sh
set -e

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Running super-admin seed (skips if already exists)..."
  node dist/scripts/seedSuperAdmin.js || true
fi

exec "$@"
