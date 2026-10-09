# VoxSign — marketing site (voxsign.co.ug)

The static marketing site for VoxSign. Plain HTML, CSS and JS. There is no
PHP, Laravel or build step.

- Production: https://voxsign.co.ug, served from `/home/voxsignco/public_html`.
- The PearlEdu school app is a separate repository
  ([ebrinejason-sys/Pearledu](https://github.com/ebrinejason-sys/Pearledu))
  served only from https://pearledu.voxsign.co.ug (`/home/voxsignco/pearledu-app`).
  Every sign-in and "Open PearlEdu" link here points there.
- cPanel: Git Version Control → **Landing-Page-VoxSign**
  (`/home/voxsignco/Landing-Page-VoxSign`, remote
  `git@github.com:VoxSign-Technologies/The-Landing-Page.git`, branch `main`).

## Pages

| URL | File |
|---|---|
| `/` | `index.html` |
| `/products` | `products/index.html` |
| `/products/pearledu` | `products/pearledu/index.html` |
| anything unknown | `404.html` |

Clean URLs (no trailing slash, no `.html`) come from `.htaccess`. Each page is
self-contained, so changes to the header, nav or footer must be made on every
page.

## Redirects (`.htaccess`)

- `/products/`, `/index.html`, `/index.php` → the clean URL.
- `/contact` → `/#contact`.
- PearlEdu app paths that used to answer on this domain (`/login`, `/apply`,
  `/admin/...`, `/webhooks/...`, ...) → the same path on
  `https://pearledu.voxsign.co.ug` with **308**, which keeps POST bodies.
- Old PearlEdu-only assets (`/manifest.webmanifest`, `/css/mobile-app.css`,
  `/js/offline-first.js`, ...) → the app host.

`sw.js` is a retired service worker: it unregisters PearlEdu's old offline
worker from browsers that installed it on this domain. Keep it.

## Deploy

cPanel's **Deploy HEAD Commit** runs `.cpanel.yml`, which runs
`scripts/deploy.sh` with `VOXSIGN_DOCROOT=/home/voxsignco/public_html`. The script:

- copies only the site files and folders it lists. It never copies `.git`,
  `.cpanel.yml`, this README, `scripts/`, `drafts/` or `tests/`;
- never deletes anything except stale files inside `products/`. `.well-known`,
  `cgi-bin`, `error_log`, `.htaccess` backups and other folders are left alone;
- backs up the existing `.htaccess` (`.htaccess.bak-<UTC time>`) and keeps any
  cPanel-generated blocks from it;
- refuses to write anywhere but a real `public_html` directory, and never
  inside `pearledu-app`.

To preview what it would change: `DRY_RUN=1 VOXSIGN_DOCROOT=/home/voxsignco/public_html bash scripts/deploy.sh`.

When adding a new top-level file or folder, add it to `SITE_FILES` /
`OWNED_DIRS` / `SHARED_DIRS` in `scripts/deploy.sh`, or it will not be
published.

## Tests

```bash
bash tests/deploy-test.sh                     # deploy script, in a sandbox
bash tests/site-test.sh https://voxsign.co.ug # live checks after a deploy
```

`tests/site-test.sh` also works against a local Apache with
`AllowOverride All` (set `FORWARDED_HTTPS=1` when it has no TLS). `php -S`
ignores `.htaccess`, so it can preview pages but not test clean URLs or redirects.

## Drafts

`drafts/landing-redesign.html` is an unfinished redesign of the home page.
It links to pages that don't exist yet and has a placeholder phone number.
It is not deployed.

## Content policy

Do not add made-up customers, partnerships, certifications, endorsements or
statistics. If a claim can't be verified, don't publish it.
