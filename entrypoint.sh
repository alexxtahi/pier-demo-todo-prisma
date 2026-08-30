#!/bin/sh
set -e

# Pier's managed Postgres has no pooler in front of it, so DIRECT_URL can just
# mirror DATABASE_URL — see hub/apps/landing/src/app/docs/projects (Prisma section).
export DIRECT_URL="$DATABASE_URL"

npx prisma migrate deploy
exec npm start
