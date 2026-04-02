#!/bin/sh

# Resolve database URL — prefer PUBLIC for external connectivity
DB_URL="${DATABASE_PUBLIC_URL:-$DATABASE_URL}"

echo "=== GymRPG Deploy ==="
if [ -n "$DB_URL" ]; then
  DB_HOST=$(echo "$DB_URL" | sed 's|.*@||' | sed 's|/.*||')
  echo "Database host: $DB_HOST"
else
  echo "WARNING: No DATABASE_URL or DATABASE_PUBLIC_URL set."
fi

# Run migrations — non-fatal so the server still starts if DB is unreachable.
# Fix DATABASE_URL in Railway Variables if this step fails.
echo "Running migrations..."
if DATABASE_URL="$DB_URL" npx prisma migrate deploy; then
  echo "Migrations complete."
else
  echo "WARNING: Migrations failed — server will start anyway. Fix DATABASE_URL in Railway Variables tab."
fi

echo "Starting server on port ${PORT:-3001}..."
exec node server/dist/index.js
