#!/usr/bin/env bash
set -euo pipefail

# Create a share-safe project archive for JAS App.
# This intentionally excludes secrets, git history, dependencies, build output,
# local Supabase state, logs, backups, and previously generated zip files.

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

EXPORT_DIR="${1:-exports}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE_NAME="jas-app-safe-${STAMP}.zip"
ARCHIVE_PATH="${EXPORT_DIR%/}/${ARCHIVE_NAME}"
TMP_DIR="$(mktemp -d)"
PROJECT_DIR="$TMP_DIR/jas-app"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$EXPORT_DIR" "$PROJECT_DIR"

RSYNC_EXCLUDES=(
  "--exclude=.env"
  "--exclude=.env.local"
  "--exclude=.env.production"
  "--exclude=.env.development"
  "--exclude=.env.test"
  "--exclude=.env.*.local"
  "--exclude=.git/"
  "--exclude=node_modules/"
  "--exclude=.output/"
  "--exclude=dist/"
  "--exclude=dist-ssr/"
  "--exclude=.tanstack/"
  "--exclude=.nitro/"
  "--exclude=.vinxi/"
  "--exclude=.wrangler/"
  "--exclude=__unconfig*/"
  "--exclude=supabase/.temp/"
  "--exclude=supabase/.branches/"
  "--exclude=supabase/snippets/"
  "--exclude=backups/"
  "--exclude=exports/"
  "--exclude=*.log"
  "--exclude=*.zip"
  "--exclude=.DS_Store"
)

if command -v rsync >/dev/null 2>&1; then
  rsync -a "${RSYNC_EXCLUDES[@]}" ./ "$PROJECT_DIR/"
else
  echo "rsync not found; using tar fallback"
  tar \
    --exclude='./.env' \
    --exclude='./.env.local' \
    --exclude='./.env.production' \
    --exclude='./.env.development' \
    --exclude='./.env.test' \
    --exclude='./.env.*.local' \
    --exclude='./.git' \
    --exclude='./node_modules' \
    --exclude='./.output' \
    --exclude='./dist' \
    --exclude='./dist-ssr' \
    --exclude='./.tanstack' \
    --exclude='./.nitro' \
    --exclude='./.vinxi' \
    --exclude='./.wrangler' \
    --exclude='./__unconfig*' \
    --exclude='./supabase/.temp' \
    --exclude='./supabase/.branches' \
    --exclude='./supabase/snippets' \
    --exclude='./backups' \
    --exclude='./exports' \
    --exclude='*.log' \
    --exclude='*.zip' \
    --exclude='.DS_Store' \
    -cf - . | (cd "$PROJECT_DIR" && tar -xf -)
fi

# Safety guard: fail if any blocked sensitive/local folders slipped through.
BLOCKED_PATHS=$(find "$PROJECT_DIR" \
  \( -name '.env' \
  -o -name '.env.local' \
  -o -name '.env.production' \
  -o -name '.env.development' \
  -o -name '.env.test' \
  -o -name '.git' \
  -o -name 'node_modules' \
  -o -name '.output' \
  -o -path '*/supabase/.temp' \
  -o -path '*/supabase/.branches' \
  -o -path '*/supabase/snippets' \
  \) -print | head -20)

if [ -n "$BLOCKED_PATHS" ]; then
  echo "Safe export blocked. Sensitive/local files were still present:" >&2
  echo "$BLOCKED_PATHS" >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "zip command not found. Install it with: sudo apt install zip" >&2
  exit 1
fi

(
  cd "$TMP_DIR"
  zip -qr "$ROOT_DIR/$ARCHIVE_PATH" jas-app
)

BYTES=$(wc -c < "$ARCHIVE_PATH" | tr -d ' ')
echo "Safe export created: $ARCHIVE_PATH (${BYTES} bytes)"
echo "Excluded: .env*, .git, node_modules, .output, supabase/.temp, backups, exports, logs, zip files"
