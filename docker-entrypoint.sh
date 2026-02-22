#!/bin/sh
set -e
echo "Running database migrations..."
if npx prisma migrate deploy --skip-generate; then
  echo "Migrations completed."
else
  echo "Migration failed or skipped (e.g. DIRECT_URL unreachable). Ensure tables exist."
fi
exec node dist/server.js
