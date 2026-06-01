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

forbidden='(^|/)(\.env($|\.)|\.env\.local$|\.git/|node_modules/|\.output/|supabase/\.temp/|supabase/snippets/|backups/|exports/|.*\.log$)'

matches=$(unzip -Z1 "$ZIP_PATH" | grep -E "$forbidden" || true)

if [[ -n "$matches" ]]; then
  echo "❌ Unsafe archive. Forbidden entries found:"
  echo "$matches"
  exit 1
fi

echo "✅ Archive looks safe: $ZIP_PATH"
