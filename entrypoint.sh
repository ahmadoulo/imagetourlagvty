#!/bin/sh
set -e

echo "Running Prisma db push to sync database schema..."
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "Starting Next.js server..."
exec node server.js
