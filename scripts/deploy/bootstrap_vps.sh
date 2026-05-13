#!/usr/bin/env bash
# Bootstrap script for deploying UltraDashboard on the VPS for the first
# time. Run as root (or via sudo) on the VPS:
#
#   bash scripts/deploy/bootstrap_vps.sh
#
# Idempotent — safe to re-run after upgrades. Assumes:
#   - Docker + Docker Compose v2 are already installed.
#   - Vaultwarden + bw serve are already running on the host (see
#     install_vaultwarden_bw_relay.sh for the bridge wiring).
#   - This repo is checked out at /opt/UltraDashboard (or the directory the
#     script lives in).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="$ROOT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[bootstrap] .env not found, copying from .env.example"
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  echo "[bootstrap] Please edit $ENV_FILE before re-running. Defaults assume:"
  echo "  POSTGRES_PASSWORD=<set me>"
  echo "  BW_SERVE_URL=http://host.docker.internal:18087"
  echo "  OMNIROUTE_SQLITE_HOST_PATH=/root/.omniroute/storage.sqlite"
  exit 1
fi

echo "[bootstrap] Pulling latest images and building web service"
docker compose pull ultradashboard-db || true
docker compose build ultradashboard-web

echo "[bootstrap] Bringing up the stack"
docker compose up -d

echo "[bootstrap] Waiting for ultradashboard-db to become healthy"
for _ in $(seq 1 30); do
  status=$(docker inspect --format='{{.State.Health.Status}}' ultradashboard-db 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    break
  fi
  sleep 2
done

echo "[bootstrap] Running database migrations"
docker compose exec -T ultradashboard-web npm run db:migrate

echo "[bootstrap] Seeding service families (no-op if already seeded)"
docker compose exec -T ultradashboard-web npm run db:seed || true

echo "[bootstrap] Done. Verify:"
echo "  curl http://127.0.0.1:3000/api/internal/services"
echo "Then from your laptop:"
echo "  ssh -N -L 3000:127.0.0.1:3000 root@<VPS> &"
echo "  open http://127.0.0.1:3000/"
