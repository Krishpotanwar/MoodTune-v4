#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null; then
  echo "Install Supabase CLI first: brew install supabase/tap/supabase"
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL env var required"
  exit 1
fi

supabase db push --db-url "$SUPABASE_DB_URL"
