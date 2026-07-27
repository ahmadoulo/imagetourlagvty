#!/bin/sh
set -e

echo "Running Prisma db push to sync database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo "Starting Next.js server..."
exec node server.js
