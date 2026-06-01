#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

log_section() {
  echo -e "\n${BLUE}== $1 ==${NC}"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "${GREEN}✓${NC} $1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  echo -e "${YELLOW}⚠${NC} $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "${RED}✗${NC} $1"
}

require_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    pass "Found $file"
  else
    fail "Missing $file"
  fi
}

require_dir() {
  local dir="$1"
  if [[ -d "$dir" ]]; then
    pass "Found $dir/"
  else
    fail "Missing $dir/"
  fi
}

run_cmd() {
  local title="$1"
  shift
  log_section "$title"
  if "$@"; then
    pass "$title passed"
  else
    fail "$title failed"
    return 1
  fi
}

log_section "JAS Production Readiness + QA Phase 1"
echo "Root: $ROOT_DIR"
echo "Date: $(date -Is)"

log_section "Required project files"
require_file "package.json"
require_file "package-lock.json"
require_file "README.md"
require_file ".env.example"
require_file ".gitignore"
require_file ".zipignore"
require_dir "src/routes"
require_dir "supabase/migrations"
require_file "src/routeTree.gen.ts"

log_section "Critical routes registered"
critical_routes=(
  "/admin"
  "/admin/audit-logs"
  "/admin/area-permissions"
  "/admin/roles"
  "/admin/committees"
  "/designation-card"
  "/verify/office-bearer/\$officeBearerId"
  "/admin/members/\$id/designation-card"
  "/card"
  "/dashboard"
)

for route in "${critical_routes[@]}"; do
  if grep -q "$route" src/routeTree.gen.ts; then
    pass "Route registered: $route"
  else
    warn "Route not found in routeTree.gen.ts: $route"
  fi
 done

log_section "Migration files present"
migrations=(
  "20260601220000_security_advisor_phase1.sql"
  "20260601230000_performance_advisor_phase1.sql"
  "20260602001000_fix_organization_committees_rls_recursion.sql"
  "20260602002000_rbac_membership_admin_phase1.sql"
  "20260602003000_database_area_rls_enforcement_phase3.sql"
  "20260602004000_database_audit_logs_phase1.sql"
)

for migration in "${migrations[@]}"; do
  if find supabase/migrations -maxdepth 1 -name "$migration" | grep -q .; then
    pass "Migration found: $migration"
  else
    warn "Migration missing or not yet applied locally: $migration"
  fi
 done

log_section "Repository hygiene"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked_forbidden=$(git ls-files | grep -E '(^\.env$|^\.env\.local$|^\.env\.(development|production|test|preview|staging)$|^node_modules/|^\.output/|^supabase/\.temp/|^supabase/snippets/|\.zip$)' || true)
  if [[ -n "$tracked_forbidden" ]]; then
    fail "Forbidden/sensitive files are tracked by git:"
    echo "$tracked_forbidden"
  else
    pass "No forbidden files tracked by git"
  fi

  untracked_forbidden=$(git status --porcelain --untracked-files=all | awk '{print $2}' | grep -E '(^\.env$|^\.env\.local$|^\.env\.(development|production|test|preview|staging)$|^node_modules/|^\.output/|^supabase/\.temp/|^supabase/snippets/|\.zip$)' || true)
  if [[ -n "$untracked_forbidden" ]]; then
    warn "Forbidden/sensitive files exist locally but are untracked. Do not export/share them:"
    echo "$untracked_forbidden"
  else
    pass "No forbidden untracked files detected by git status"
  fi
else
  warn "Not inside a git repository; skipping git hygiene checks"
fi

if [[ -f ".env.local" ]]; then
  warn ".env.local exists locally. This is okay for local development, but never include it in zip/export. Rotate cloud service role key if it was shared."
fi

log_section "Environment documentation"
if grep -q "SUPABASE_URL" .env.example; then pass ".env.example documents SUPABASE_URL"; else warn ".env.example does not document SUPABASE_URL"; fi
if grep -q "VITE_PUBLIC_SITE_URL" .env.example; then pass ".env.example documents VITE_PUBLIC_SITE_URL"; else warn ".env.example does not document VITE_PUBLIC_SITE_URL"; fi
if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.example; then pass ".env.example documents server service role variable"; else warn ".env.example does not document SUPABASE_SERVICE_ROLE_KEY"; fi

log_section "Client secret exposure scan"
if grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.output --exclude='*.zip' "SUPABASE_SERVICE_ROLE_KEY" src | grep -v "src/lib/supabase/admin.ts"; then
  fail "SUPABASE_SERVICE_ROLE_KEY appears in client/app source outside server admin helper"
else
  pass "No obvious service-role variable usage outside server admin helper"
fi

if grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.output --exclude='*.zip' "service_role" src | grep -v "src/lib/supabase/admin.ts"; then
  warn "String 'service_role' appears outside server admin helper; review manually"
else
  pass "No obvious service_role references outside server admin helper"
fi

log_section "TypeScript and production build"
if npm run check; then
  pass "npm run check passed"
else
  fail "npm run check failed"
  exit 1
fi

if npm run build; then
  pass "npm run build passed"
else
  fail "npm run build failed"
  exit 1
fi

log_section "Safe export command"
if npm run | grep -q "safe-export"; then
  pass "npm run safe-export is available"
else
  warn "npm run safe-export script not found. Run scripts/apply-qa-npm-scripts.mjs or add it manually."
fi

log_section "Supabase CLI availability"
if command -v npx >/dev/null 2>&1 && npx supabase --version >/dev/null 2>&1; then
  pass "Supabase CLI available: $(npx supabase --version)"
  echo "Tip: run 'npx supabase migration list' to compare local/cloud migration status."
else
  warn "Supabase CLI not available or not installed in this environment"
fi

log_section "QA summary"
echo -e "${GREEN}Passed:${NC} $PASS_COUNT"
echo -e "${YELLOW}Warnings:${NC} $WARN_COUNT"
echo -e "${RED}Failures:${NC} $FAIL_COUNT"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  echo -e "${RED}Project readiness check failed. Fix failures before deployment.${NC}"
  exit 1
fi

if [[ "$WARN_COUNT" -gt 0 ]]; then
  echo -e "${YELLOW}Project readiness check completed with warnings. Review them before deployment.${NC}"
else
  echo -e "${GREEN}Project readiness check completed cleanly.${NC}"
fi
