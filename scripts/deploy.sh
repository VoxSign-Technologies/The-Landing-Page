#!/bin/bash
# Publish the static voxsign.co.ug site into the main domain's document root.
#
# cPanel Git Version Control runs this from the repository root (.cpanel.yml).
# Nothing to build: the site is plain HTML/CSS/JS.
#
# Safety rules (shared cPanel account, other things live next to this site):
#   * Only the files and folders in SITE_FILES / SITE_DIRS are copied.
#     .git, .cpanel.yml, README.md, scripts/ and drafts/ are never published.
#   * Nothing in the document root outside those paths is deleted:
#     .well-known, cgi-bin, error_log, .htaccess backups, other folders and
#     PearlEdu's old bridge index.php are left alone.
#   * Deletion of stale files happens only inside products/, which belongs
#     to this site alone. The shared asset folders (images, js, models,
#     vendor) are only added to / updated, never pruned.
#   * The existing .htaccess is backed up first, and any cPanel-generated
#     blocks in it (PHP handler, etc.) are carried over into the new one.
#   * It refuses to run against anything but a directory named public_html,
#     and never against /home/voxsignco/pearledu-app.
#
# Usage: VOXSIGN_DOCROOT=/home/voxsignco/public_html bash scripts/deploy.sh
#        DRY_RUN=1 ... to print what would change without writing anything.
set -euo pipefail

DOCROOT="${VOXSIGN_DOCROOT:-/home/voxsignco/public_html}"
DRY_RUN="${DRY_RUN:-0}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SITE_FILES=(
    index.html 404.html robots.txt sitemap.xml sw.js
    favicon.ico favicon.png favicon.svg favicon-16x16.png favicon-32x32.png apple-touch-icon.png
)
# Folders this site owns outright: stale files inside them are removed.
OWNED_DIRS=(products)
# Folders shared with what was in public_html before: add/update only.
SHARED_DIRS=(images js models vendor)

die() { echo "ERROR: $*" >&2; exit 1; }

echo "==> VoxSign static deploy $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "    source: $REPO_ROOT"
echo "    target: $DOCROOT"
if git -C "$REPO_ROOT" rev-parse --short HEAD >/dev/null 2>&1; then
    echo "    commit: $(git -C "$REPO_ROOT" rev-parse --short HEAD) ($(git -C "$REPO_ROOT" log -1 --pretty=%s))"
fi
[ "$DRY_RUN" = "1" ] && echo "    DRY RUN: nothing will be written"

# --- guards -----------------------------------------------------------------
[ -d "$DOCROOT" ] || die "$DOCROOT does not exist (it is created by cPanel; refusing to create it)."
[ -L "$DOCROOT" ] && die "$DOCROOT is a symlink; refusing to deploy through it."
DOCROOT="$(cd "$DOCROOT" && pwd -P)"
[ "$(basename "$DOCROOT")" = "public_html" ] || die "target must be a public_html directory, got $DOCROOT"
case "$DOCROOT/" in
    */pearledu-app/*) die "target is inside pearledu-app; this deploy must never touch the PearlEdu app." ;;
esac
case "$REPO_ROOT/" in
    "$DOCROOT"/*) die "the repository is inside the document root; refusing to publish it onto itself." ;;
esac

for f in "${SITE_FILES[@]}" .htaccess; do
    [ -f "$REPO_ROOT/$f" ] || die "missing site file $f"
done
for d in "${OWNED_DIRS[@]}" "${SHARED_DIRS[@]}"; do
    [ -d "$REPO_ROOT/$d" ] || die "missing site folder $d/"
done

command -v rsync >/dev/null 2>&1 || die "rsync is required."
RSYNC=(rsync -rlt '--chmod=D755,F644' --itemize-changes)
[ "$DRY_RUN" = "1" ] && RSYNC+=(--dry-run)

# --- 1. assets first, so pages never reference a file that is not there yet -
for d in "${SHARED_DIRS[@]}"; do
    echo "==> $d/ (add/update only)"
    "${RSYNC[@]}" "$REPO_ROOT/$d/" "$DOCROOT/$d/"
done
for d in "${OWNED_DIRS[@]}"; do
    echo "==> $d/ (mirrored, stale files inside it removed)"
    "${RSYNC[@]}" --delete "$REPO_ROOT/$d/" "$DOCROOT/$d/"
done

# --- 2. top-level pages and icons ---------------------------------------------
echo "==> top-level files"
"${RSYNC[@]}" "${SITE_FILES[@]/#/$REPO_ROOT/}" "$DOCROOT/"

# --- 3. .htaccess last: it is what switches routing from Laravel to static ---
echo "==> .htaccess"
NEW_HTACCESS="$(mktemp)"
trap 'rm -f "$NEW_HTACCESS"' EXIT
cp "$REPO_ROOT/.htaccess" "$NEW_HTACCESS"
if [ -f "$DOCROOT/.htaccess" ]; then
    # Keep blocks cPanel manages itself (MultiPHP handler, etc.).
    awk '
        /^# (php -- )?BEGIN cPanel-generated/ {keep=1}
        keep {print}
        /^# (php -- )?END cPanel-generated/   {keep=0}
    ' "$DOCROOT/.htaccess" > "$NEW_HTACCESS.cpanel"
    if [ -s "$NEW_HTACCESS.cpanel" ]; then
        echo "    carrying over cPanel-generated blocks from the existing .htaccess"
        { echo; cat "$NEW_HTACCESS.cpanel"; } >> "$NEW_HTACCESS"
    fi
    rm -f "$NEW_HTACCESS.cpanel"
    if ! cmp -s "$NEW_HTACCESS" "$DOCROOT/.htaccess"; then
        backup="$DOCROOT/.htaccess.bak-$(date -u '+%Y%m%d%H%M%S')"
        if [ "$DRY_RUN" = "1" ]; then
            echo "    would back up .htaccess to $backup and replace it"
        else
            cp -p "$DOCROOT/.htaccess" "$backup"
            echo "    backed up the previous .htaccess to $backup"
        fi
    else
        echo "    .htaccess unchanged"
    fi
fi
if [ "$DRY_RUN" != "1" ]; then
    install -m 644 "$NEW_HTACCESS" "$DOCROOT/.htaccess.new"
    mv -f "$DOCROOT/.htaccess.new" "$DOCROOT/.htaccess"
fi

if [ -f "$DOCROOT/index.php" ]; then
    echo "NOTE: $DOCROOT/index.php (PearlEdu's old Laravel bridge) is still there."
    echo "      It is no longer reachable (/ serves index.html and /index.php redirects to /)."
    echo "      Remove it by hand once the site checks pass; see the two-repos guide."
fi
echo "==> VoxSign deploy complete."
