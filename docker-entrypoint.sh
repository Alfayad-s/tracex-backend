#!/bin/sh
set -e
npx prisma migrate deploy --skip-generate 2>/dev/null || true
exec node dist/server.js
