#!/bin/sh
set -e
# Run migrations when DATABASE_URL is set (e.g. in Dokploy). Same env as the app.
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
  echo "Migrations complete."
fi
exec "$@"
