#!/bin/sh
set -e

# ── Resolve database URL ──────────────────────────────────────────────────────
# Prefer DATABASE_PUBLIC_URL (Railway's external URL) over DATABASE_URL
# (Railway's internal URL) so connections from the deploy container work.
DB_URL="${DATABASE_PUBLIC_URL:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
  echo "FATAL: Neither DATABASE_PUBLIC_URL nor DATABASE_URL is set."
  echo "Go to your Railway service → Variables and add DATABASE_URL pointing"
  echo "to your Railway Postgres instance, e.g. \${{Postgres.DATABASE_URL}}"
  exit 1
fi

# Print host only — never log passwords
DB_HOST=$(echo "$DB_URL" | sed 's|.*@||' | sed 's|/.*||')
echo "Database host: $DB_HOST"

# Only block if the resolved URL still points to localhost
if echo "$DB_HOST" | grep -q "localhost\|127\.0\.0\.1"; then
  echo "FATAL: Resolved database URL points to localhost — this will not work on Railway."
  echo "Set DATABASE_PUBLIC_URL or DATABASE_URL to your Railway Postgres URL."
  exit 1
fi

# ── Run migrations ────────────────────────────────────────────────────────────
echo "Running database migrations..."
DATABASE_URL="$DB_URL" npx prisma migrate deploy

# ── Start server ──────────────────────────────────────────────────────────────
echo "Starting GymRPG server..."
exec node server/dist/index.js
