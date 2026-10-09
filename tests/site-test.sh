#!/bin/bash
# HTTP checks for the deployed static site: pages, clean URLs, redirects,
# every same-site link/asset on every page, and headers.
# Usage: bash tests/site-test.sh [BASE_URL]   (default https://voxsign.co.ug)
# For a local Apache without TLS, set FORWARDED_HTTPS=1 so the HTTPS redirect
# is treated as already satisfied.
set -uo pipefail
BASE="${1:-https://voxsign.co.ug}"
BASE="${BASE%/}"
APP="https://pearledu.voxsign.co.ug"
HDR=()
[ "${FORWARDED_HTTPS:-0}" = 1 ] && HDR=(-H 'X-Forwarded-Proto: https')
CURL=(curl -s -o /dev/null --max-time 20 "${HDR[@]}")
fail=0
pass=0

expect() { # path expected_code [expected_location] [method]
    local path="$1" code="$2" loc="${3:-}" method="${4:-GET}" out got gotloc
    out="$("${CURL[@]}" -X "$method" -w '%{http_code} %{redirect_url}' "$BASE$path")"
    got="${out%% *}"; gotloc="${out#* }"
    if [ "$got" != "$code" ] || { [ -n "$loc" ] && [ "$gotloc" != "$loc" ]; }; then
        echo "  FAIL $method $path -> $got $gotloc (want $code $loc)"; fail=1
    else
        pass=$((pass + 1))
    fi
}

echo "==> pages"
expect / 200
expect /products 200
expect /products/pearledu 200
expect /robots.txt 200
expect /sitemap.xml 200
expect /sw.js 200
for p in / /products /products/pearledu; do
    t="$(curl -s "${HDR[@]}" "$BASE$p" | grep -o '<title>[^<]*' | head -1)"
    echo "    $p  ${t#<title>}"
done

echo "==> clean-URL redirects"
expect /products/ 301 "$BASE/products"
expect /products/pearledu/ 301 "$BASE/products/pearledu"
expect /index.php 301 "$BASE/"
expect /index.html 301 "$BASE/"
expect /products/index.html 301 "$BASE/products/"
expect /products/pearledu/index.html 301 "$BASE/products/pearledu/"
expect /contact 301 "$BASE/#contact"

echo "==> old app paths go to the PearlEdu host (308 keeps POSTs)"
expect /login 308 "$APP/login"
expect '/login?next=%2Fadmin' 308 "$APP/login?next=%2Fadmin"
expect /apply 308 "$APP/apply"
expect /health 308 "$APP/health"
expect /admin/schools 308 "$APP/admin/schools"
expect /forgot-password 308 "$APP/forgot-password"
expect /onboard 308 "$APP/onboard" POST
expect /webhooks/flutterwave/1 308 "$APP/webhooks/flutterwave/1" POST
expect /build/assets/app.css 308 "$APP/build/assets/app.css"
expect /manifest.webmanifest 301 "$APP/manifest.webmanifest"
expect /js/offline-first.js 301 "$APP/js/offline-first.js"
expect /css/mobile-app.css 301 "$APP/css/mobile-app.css"

echo "==> unknown paths get the 404 page, repo files are never served"
expect /no-such-page 404
expect /about 404
for f in /.git/config /.cpanel.yml /README.md /scripts/deploy.sh /drafts/landing-redesign.html /tests/site-test.sh /seo-head.blade.php /.htaccess; do
    out="$("${CURL[@]}" -w '%{http_code}' "$BASE$f")"
    case "$out" in 403|404) pass=$((pass + 1)) ;; *) echo "  FAIL $f served ($out)"; fail=1 ;; esac
done

echo "==> every same-site link and asset on every page"
tmp="$(mktemp)"
for p in / /products /products/pearledu /404.html; do
    curl -s "${HDR[@]}" "$BASE$p"
done | grep -oE "(href|src)=\"/[^\"#]*\"|'/(js|vendor|models)/[^']*'|\"/(js|vendor|models)/[^\"]*\"" \
     | sed -E "s/^(href|src)=//; s/^[\"']//; s/[\"']$//; s/\?.*$//" | sort -u > "$tmp"
# Modules the avatar loader pulls in through the import map and at runtime.
{
    echo /vendor/three-0.170.0/addons/loaders/GLTFLoader.js
    echo /vendor/three-0.170.0/addons/loaders/DRACOLoader.js
    echo /vendor/draco/1.5.7/draco_decoder.wasm
    echo /vendor/draco/1.5.7/draco_wasm_wrapper.js
    echo /js/vx-avatar-motion.js
    for t in skin-body skin-face skin-lips skin-roughness; do echo "/models/textures/$t.png"; done
} >> "$tmp"
while read -r u; do
    case "$u" in */) continue ;; esac   # directory prefixes (import map, decoder path)
    out="$("${CURL[@]}" -w '%{http_code}' "$BASE$u")"
    if [ "$out" = 200 ]; then pass=$((pass + 1)); else echo "  FAIL $u -> $out"; fail=1; fi
done < <(sort -u "$tmp")
echo "    checked $(sort -u "$tmp" | wc -l) same-site URLs"
rm -f "$tmp"

echo "==> external links point at the right hosts"
for p in / /products /products/pearledu; do
    curl -s "${HDR[@]}" "$BASE$p"
done | grep -oE 'href="https://[^"]+"' | grep -v -E 'fonts\.(googleapis|gstatic)\.com|api\.fontshare\.com' | sort | uniq -c

echo "==> headers"
h="$(curl -sI "${HDR[@]}" "$BASE/")"
for hdr in content-security-policy x-content-type-options x-frame-options strict-transport-security; do
    if echo "$h" | grep -qi "^$hdr:"; then pass=$((pass + 1)); else echo "  FAIL missing $hdr"; fail=1; fi
done
if echo "$h" | grep -qi '^set-cookie:'; then echo "  FAIL / sets a cookie"; fail=1; else pass=$((pass + 1)); fi
ct="$(curl -sI "${HDR[@]}" "$BASE/models/avatar.glb" | grep -i '^content-type:' | tr -d '\r')"
case "$ct" in *model/gltf-binary*) pass=$((pass + 1)) ;; *) echo "  FAIL avatar.glb content-type: $ct"; fail=1 ;; esac

echo
echo "passed: $pass"
if [ "$fail" = 0 ]; then echo "ALL SITE CHECKS PASSED"; else echo "SOME SITE CHECKS FAILED"; exit 1; fi
