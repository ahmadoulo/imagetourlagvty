#!/bin/sh

# Set npm cache to a writable directory for the non-root user
export npm_config_cache=/tmp/.npm

echo "Starting deployment checks..."

echo "1. Pushing Prisma schema to the database..."
npx --yes prisma db push --accept-data-loss

echo "2. Seeding the database..."
# Run the seed script. We use --yes to auto-install tsx if it's missing in standalone
npx --yes tsx prisma/seed.ts

echo "3. Starting Next.js application..."
exec node server.js
