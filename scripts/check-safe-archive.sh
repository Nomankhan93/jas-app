#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash scripts/check-safe-archive.sh path/to/export.zip"
  exit 2
fi

ZIP_PATH="$1"

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Archive not found: $ZIP_PATH"
  exit 2
fi

if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip command is required"
  exit 2
fi

forbidden='(^|/)(.env0.env.local0.env.(development|production|test|preview|staging)0.git/|node_modules/|.output/|supabase/.temp/|supabase/snippets/|backups/|exports/|.*.log1000 4 24 27 30 46 100 1000 1001'

matches=$(unzip -Z1 "$ZIP_PATH" | grep -E "$forbidden" || true)

if [[ -n "$matches" ]]; then
  echo "❌ Unsafe archive. Forbidden entries found:"
  echo "$matches"
  exit 1
fi

echo "✅ Archive looks safe: $ZIP_PATH"
