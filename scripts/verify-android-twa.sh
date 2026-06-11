#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${SITE_URL:-https://jasofficial.org}"
WWW_URL="${WWW_URL:-https://www.jasofficial.org}"
ANDROID_PACKAGE_NAME="${ANDROID_PACKAGE_NAME:-org.jasofficial.twa}"
ANDROID_PACKAGE_DIR="${ANDROID_PACKAGE_DIR:-$HOME/Downloads/jas-android-package}"

green='\033[0;32m'
yellow='\033[1;33m'
red='\033[0;31m'
reset='\033[0m'

log() { printf "%b\n" "${green}✓${reset} $1"; }
warn() { printf "%b\n" "${yellow}!${reset} $1"; }
fail() { printf "%b\n" "${red}✗${reset} $1"; exit 1; }

printf "\nJAS Android TWA / PWABuilder Verification\n"
printf "Primary URL: %s\n" "$SITE_URL"
printf "WWW URL: %s\n" "$WWW_URL"
printf "Package name: %s\n\n" "$ANDROID_PACKAGE_NAME"

[[ -f public/manifest.json ]] || fail "Missing public/manifest.json"
[[ -f public/.well-known/assetlinks.json ]] || fail "Missing public/.well-known/assetlinks.json"

node <<NODE
const fs = require('node:fs')
const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'))
const assetlinks = JSON.parse(fs.readFileSync('public/.well-known/assetlinks.json', 'utf8'))
if (manifest.start_url !== '/') {
  throw new Error('manifest.json start_url should be / for the packaged TWA')
}
if (manifest.scope !== '/') {
  throw new Error('manifest.json scope should be /')
}
if (manifest.display !== 'standalone') {
  throw new Error('manifest.json display should be standalone')
}
const target = assetlinks?.[0]?.target
if (!target) throw new Error('assetlinks.json missing target')
if (target.namespace !== 'android_app') throw new Error('assetlinks target.namespace must be android_app')
if (target.package_name !== '$ANDROID_PACKAGE_NAME') {
  throw new Error(`assetlinks package_name mismatch: expected $ANDROID_PACKAGE_NAME, got ${target.package_name}`)
}
if (!Array.isArray(target.sha256_cert_fingerprints) || target.sha256_cert_fingerprints.length === 0) {
  throw new Error('assetlinks missing sha256_cert_fingerprints')
}
console.log('✓ manifest.json and assetlinks.json are TWA-ready')
NODE

if command -v curl >/dev/null 2>&1; then
  primary_status=$(curl -o /dev/null -s -w '%{http_code}' "$SITE_URL/.well-known/assetlinks.json")
  if [[ "$primary_status" != "200" ]]; then
    fail "$SITE_URL/.well-known/assetlinks.json must return 200, got $primary_status"
  fi
  log "Primary domain assetlinks.json returns HTTP 200"

  www_status=$(curl -o /dev/null -s -w '%{http_code}' "$WWW_URL/.well-known/assetlinks.json" || true)
  if [[ "$www_status" == "200" ]]; then
    warn "WWW assetlinks.json returns 200. This is OK only if the APK was packaged for the www domain."
  elif [[ "$www_status" =~ ^30[178]$ ]]; then
    log "WWW domain redirects as expected"
  else
    warn "WWW domain returned HTTP $www_status. Check Vercel domain settings if needed."
  fi
else
  warn "curl not found; skipped live domain checks"
fi

if [[ -d "$ANDROID_PACKAGE_DIR" ]]; then
  [[ -f "$ANDROID_PACKAGE_DIR/JAS.apk" ]] && log "Found test APK: $ANDROID_PACKAGE_DIR/JAS.apk" || warn "JAS.apk not found in $ANDROID_PACKAGE_DIR"
  [[ -f "$ANDROID_PACKAGE_DIR/JAS.aab" ]] && log "Found Play Store AAB: $ANDROID_PACKAGE_DIR/JAS.aab" || warn "JAS.aab not found in $ANDROID_PACKAGE_DIR"
  [[ -f "$ANDROID_PACKAGE_DIR/signing.keystore" ]] && warn "Signing keystore exists in package directory. Back it up privately; never commit it." || true
  [[ -f "$ANDROID_PACKAGE_DIR/signing-key-info.txt" ]] && warn "Signing key info exists in package directory. Back it up privately; never commit it." || true
else
  warn "Android package directory not found: $ANDROID_PACKAGE_DIR"
fi

printf "\nAndroid TWA verification complete.\n"
