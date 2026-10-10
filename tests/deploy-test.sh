#!/bin/bash
# check() evals its condition later, so single-quoted $vars are intended.
# shellcheck disable=SC2016,SC2034,SC2012
# Sandbox test for scripts/deploy.sh: runs it against a fake cPanel home and
# checks it publishes only the site, keeps cPanel-managed items, and never
# touches pearledu-app. Run: bash tests/deploy-test.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT
HOME_DIR="$SANDBOX/home/voxsignco"
DOCROOT="$HOME_DIR/public_html"
APP="$HOME_DIR/pearledu-app"
fail=0
ok()   { echo "  ok   $*"; }
bad()  { echo "  FAIL $*"; fail=1; }
check() { if eval "$2"; then ok "$1"; else bad "$1"; fi; }

# --- fake server state as it is today ---------------------------------------
mkdir -p "$DOCROOT/.well-known/acme-challenge" "$DOCROOT/cgi-bin" "$DOCROOT/js" \
         "$DOCROOT/products" "$DOCROOT/accessibility" "$APP/public"
echo token > "$DOCROOT/.well-known/acme-challenge/abc"
echo cgi > "$DOCROOT/cgi-bin/keep.cgi"
echo log > "$DOCROOT/error_log"
echo old > "$DOCROOT/.htaccess.bak"
echo "<?php // PearlEdu bridge" > "$DOCROOT/index.php"
echo "old app js" > "$DOCROOT/js/offline-first.js"
echo stale > "$DOCROOT/products/stale.html"
echo other > "$DOCROOT/accessibility/index.html"
cat > "$DOCROOT/.htaccess" <<'HT'
RewriteEngine On
RewriteRule ^ index.php [L]
# php -- BEGIN cPanel-generated handler, do not edit
AddHandler application/x-httpd-ea-php84 .php .php8 .phtml
# php -- END cPanel-generated handler, do not edit
HT
echo sentinel > "$APP/public/index.php"
app_before="$(cd "$APP" && find . -type f -exec md5sum {} + | sort)"

echo "==> dry run writes nothing"
before="$(cd "$DOCROOT" && find . -exec stat -c '%n %s %Y' {} + | sort)"
DRY_RUN=1 VOXSIGN_DOCROOT="$DOCROOT" bash "$REPO_ROOT/scripts/deploy.sh" >/dev/null
after="$(cd "$DOCROOT" && find . -exec stat -c '%n %s %Y' {} + | sort)"
check "dry run left public_html unchanged" '[ "$before" = "$after" ]'

echo "==> real deploy"
VOXSIGN_DOCROOT="$DOCROOT" bash "$REPO_ROOT/scripts/deploy.sh" > "$SANDBOX/deploy.log"

for f in index.html 404.html products/index.html products/pearledu/index.html robots.txt sitemap.xml sw.js \
         favicon.ico js/vx-avatar-loader.js models/avatar-v2.glb vendor/three-0.170.0/three.module.js images/voxsign/team-victor.jpg; do
    check "published $f" "cmp -s '$REPO_ROOT/$f' '$DOCROOT/$f'"
done
for f in .git .cpanel.yml README.md scripts drafts tests; do
    check "did not publish $f" "[ ! -e '$DOCROOT/$f' ]"
done
check "kept .well-known challenge"   "[ -f '$DOCROOT/.well-known/acme-challenge/abc' ]"
check "kept cgi-bin"                 "[ -f '$DOCROOT/cgi-bin/keep.cgi' ]"
check "kept error_log"               "[ -f '$DOCROOT/error_log' ]"
check "kept old .htaccess.bak"       "[ -f '$DOCROOT/.htaccess.bak' ]"
check "kept unrelated folder"        "[ -f '$DOCROOT/accessibility/index.html' ]"
check "kept bridge index.php (manual removal)" "[ -f '$DOCROOT/index.php' ]"
check "kept shared js file it does not own" "[ -f '$DOCROOT/js/offline-first.js' ]"
check "pruned stale file in products/" "[ ! -e '$DOCROOT/products/stale.html' ]"
check "backed up previous .htaccess" "ls '$DOCROOT'/.htaccess.bak-* >/dev/null 2>&1 && grep -q 'RewriteRule ^ index.php' '$DOCROOT'/.htaccess.bak-*"
check "new .htaccess is the site's"  "grep -q 'DirectorySlash Off' '$DOCROOT/.htaccess'"
check "cPanel PHP handler carried over" "grep -q 'BEGIN cPanel-generated handler' '$DOCROOT/.htaccess' && grep -q 'ea-php84' '$DOCROOT/.htaccess'"
check "old Laravel rewrite gone"     "! grep -q 'RewriteRule ^ index.php' '$DOCROOT/.htaccess'"
check "warned about the bridge"      "grep -q 'old Laravel bridge' '$SANDBOX/deploy.log'"
app_after="$(cd "$APP" && find . -type f -exec md5sum {} + | sort)"
check "pearledu-app untouched"       '[ "$app_before" = "$app_after" ]'

echo "==> second deploy is idempotent and adds no extra backup"
n1="$(ls "$DOCROOT"/.htaccess.bak-* | wc -l)"
VOXSIGN_DOCROOT="$DOCROOT" bash "$REPO_ROOT/scripts/deploy.sh" >/dev/null
n2="$(ls "$DOCROOT"/.htaccess.bak-* | wc -l)"
check "no new .htaccess backup"      '[ "$n1" = "$n2" ]'
check "handler block not duplicated" '[ "$(grep -c "BEGIN cPanel-generated handler" "$DOCROOT/.htaccess")" = 1 ]'

echo "==> guards"
check "refuses pearledu-app/public_html" "! VOXSIGN_DOCROOT='$APP' bash '$REPO_ROOT/scripts/deploy.sh' >/dev/null 2>&1"
mkdir -p "$APP/public_html"
check "refuses a public_html inside pearledu-app" "! VOXSIGN_DOCROOT='$APP/public_html' bash '$REPO_ROOT/scripts/deploy.sh' >/dev/null 2>&1 && [ -z \"\$(ls -A '$APP/public_html')\" ]"
check "refuses a non-public_html dir" "! VOXSIGN_DOCROOT='$SANDBOX' bash '$REPO_ROOT/scripts/deploy.sh' >/dev/null 2>&1"
check "refuses a missing docroot"     "! VOXSIGN_DOCROOT='$HOME_DIR/nope/public_html' bash '$REPO_ROOT/scripts/deploy.sh' >/dev/null 2>&1"
mkdir -p "$SANDBOX/l" && ln -s "$DOCROOT" "$SANDBOX/l/public_html"
check "refuses a symlinked docroot"   "! VOXSIGN_DOCROOT='$SANDBOX/l/public_html' bash '$REPO_ROOT/scripts/deploy.sh' >/dev/null 2>&1"

if [ "$fail" = 0 ]; then echo "ALL DEPLOY TESTS PASSED"; else echo "DEPLOY TESTS FAILED"; exit 1; fi
