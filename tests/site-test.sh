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
    echo /vendor/draco/1.5.7/draco_decoder.js
    echo /vendor/draco/1.5.7/draco_decoder.wasm
    echo /vendor/draco/1.5.7/draco_wasm_wrapper.js
    echo /js/vx-avatar-motion.js
    for t in skin-body skin-face skin-lips skin-roughness; do echo "/models/textures/$t.webp"; done
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

echo "==> SEO and page structure"
ok() { pass=$((pass + 1)); }
bad() { echo "  FAIL $1"; fail=1; }
res() { if [ "$1" = 0 ]; then ok; else bad "$2"; fi; }   # res $? "message"
titles=""
for p in / /products /products/pearledu; do
    html="$(curl -s "${HDR[@]}" "$BASE$p")"
    want="https://voxsign.co.ug$p"
    n() { printf '%s' "$html" | grep -o -E "$1" | wc -l; }
    if [ "$(n '<title>[^<]+</title>')" = 1 ]; then ok; else bad "$p: want exactly one <title>"; fi
    if [ "$(n '<meta name="description" content="[^"]{50,170}"')" = 1 ]; then ok; else bad "$p: want one meta description of 50-170 chars"; fi
    printf '%s' "$html" | grep -q "<link rel=\"canonical\" href=\"$want\""; res $? "$p: canonical is not $want"
    printf '%s' "$html" | grep -q "<meta property=\"og:url\" content=\"$want\""; res $? "$p: og:url is not $want"
    printf '%s' "$html" | grep -q '<meta property="og:image" content="https://voxsign.co.ug/images/voxsign/og-card.png"'; res $? "$p: og:image"
    printf '%s' "$html" | grep -q '<meta name="twitter:card" content="summary_large_image"'; res $? "$p: twitter:card"
    if printf '%s' "$html" | python3 -c '
import sys, re, json
blocks = re.findall(r"<script type=\"application/ld\+json\">(.*?)</script>", sys.stdin.read(), re.S)
types = [g["@type"] for b in blocks for g in json.loads(b).get("@graph", [])]
sys.exit(0 if "Organization" in types else 1)'; then ok; else bad "$p: JSON-LD missing, invalid or without Organization"; fi
    if [ "$(n '<h1[ >]')" = 1 ]; then ok; else bad "$p: want exactly one <h1>"; fi
    # heading levels never skip on the way down (h2 -> h4 etc.)
    levels="$(printf '%s' "$html" | grep -o -E '<h[1-6][ >]' | tr -dc '1-6\n')"
    prev=0; skip=""
    for l in $levels; do [ "$l" -gt $((prev + 1)) ] && skip="h$prev->h$l"; prev=$l; done
    if [ -z "$skip" ]; then ok; else bad "$p: heading level skips ($skip)"; fi
    # every img has an alt attribute
    ! printf '%s' "$html" | grep -o '<img[^>]*>' | grep -v -q 'alt='; res $? "$p: <img> without alt"
    # in-page anchors point at ids that exist on this page
    for a in $(printf '%s' "$html" | grep -o -E 'href="#[^"]+"' | sed -E 's/href="#(.*)"/\1/' | sort -u); do
        printf '%s' "$html" | grep -q "id=\"$a\""; res $? "$p: href=\"#$a\" has no matching id"
    done
    titles+="$(printf '%s' "$html" | grep -o '<title>[^<]*')"$'\n'
done
if [ "$(printf '%s' "$titles" | sort -u | grep -c .)" = 3 ]; then ok; else bad "page titles are not unique"; fi
sm="$(curl -s "${HDR[@]}" "$BASE/sitemap.xml")"
if [ "$(printf '%s' "$sm" | grep -c '<lastmod>')" -ge 3 ]; then ok; else bad "sitemap.xml lacks lastmod"; fi
curl -s "${HDR[@]}" "$BASE/robots.txt" | grep -q '^Sitemap: https://voxsign.co.ug/sitemap.xml'; res $? "robots.txt does not point at the sitemap"
expect /images/avatar/avatar-poster-480.webp 200
expect /images/avatar/avatar-poster-960.webp 200
expect /images/voxsign/og-card.png 200
expect /no-such-page-xyz 404
curl -s "${HDR[@]}" "$BASE/no-such-page-xyz" | grep -q 'name="robots" content="noindex'; res $? "404 page is not noindex"

echo "==> headers"
h="$(curl -sI "${HDR[@]}" "$BASE/")"
for hdr in content-security-policy x-content-type-options x-frame-options strict-transport-security; do
    if echo "$h" | grep -qi "^$hdr:"; then pass=$((pass + 1)); else echo "  FAIL missing $hdr"; fail=1; fi
done
if echo "$h" | grep -qi '^set-cookie:'; then echo "  FAIL / sets a cookie"; fail=1; else pass=$((pass + 1)); fi
ct="$(curl -sI "${HDR[@]}" "$BASE/models/avatar-v2.glb" | grep -i '^content-type:' | tr -d '\r')"
case "$ct" in *model/gltf-binary*) pass=$((pass + 1)) ;; *) echo "  FAIL avatar-v2.glb content-type: $ct"; fail=1 ;; esac
# The model is Draco-compressed in the file itself, so its size does not depend
# on the server compressing it (the live LiteSpeed host does not gzip .glb).
len="$(curl -s "${HDR[@]}" -o /dev/null -w '%{size_download}' "$BASE/models/avatar-v2.glb")"
if [ "${len:-0}" -gt 0 ] && [ "$len" -lt 1500000 ]; then pass=$((pass + 1)); else echo "  FAIL avatar-v2.glb is $len bytes (want < 1.5 MB)"; fail=1; fi

echo
echo "passed: $pass"
if [ "$fail" = 0 ]; then echo "ALL SITE CHECKS PASSED"; else echo "SOME SITE CHECKS FAILED"; exit 1; fi
