#!/bin/sh
set -e
echo "[entrypoint] Starting..."
# Run migrations when DATABASE_URL is set (e.g. in Dokploy). Same env as the app.
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] Running database migrations..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations complete."
else
  echo "[entrypoint] DATABASE_URL not set, skipping migrations."
fi
echo "[entrypoint] Starting app: $*"
exec "$@"
