#!/bin/sh
set -e

# ── Validate DATABASE_URL ────────────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL is not set."
  echo "Go to your Railway service → Variables and add DATABASE_URL pointing"
  echo "to your Railway Postgres instance, e.g. \${{Postgres.DATABASE_URL}}"
  exit 1
fi

# Print the host portion only (never the password)
DB_HOST=$(echo "$DATABASE_URL" | sed 's|.*@||' | sed 's|/.*||')
echo "DATABASE_URL host: $DB_HOST"

if echo "$DB_HOST" | grep -q "localhost\|127\.0\.0\.1"; then
  echo "FATAL: DATABASE_URL points to localhost — this will not work on Railway."
  echo "Set DATABASE_URL to your Railway Postgres URL in the service Variables tab."
  exit 1
fi

# ── Run migrations ────────────────────────────────────────────────────────────
echo "Running database migrations..."
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy

# ── Start server ──────────────────────────────────────────────────────────────
echo "Starting GymRPG server..."
exec node server/dist/index.js
