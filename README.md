# PearlEdu — Public Assets

This directory is the **web document root** (Laravel's `public/` folder) of the
PearlEdu school management platform by [VoxSign Technologies](https://github.com/VoxSign-Technologies).
All HTTP requests are routed through `index.php`, the Laravel front controller.

PearlEdu handles attendance and marks — and keeps working when the network drops,
thanks to its offline-first progressive web app (PWA) layer.

## Repository

- **Remote:** `https://github.com/VoxSign-Technologies/The-Landing-Page.git`
- **Branch:** `main`

> Note: this folder is part of a larger Laravel application. Application code,
> routes, and configuration live in the parent project, not here.

## Directory Structure

```
public/
├── index.php              # Laravel front controller (entry point for all requests)
├── .htaccess              # Apache rewrites, HTTPS enforcement, env-file protection
├── robots.txt             # Crawler rules (open to all)
├── manifest.webmanifest   # PWA manifest (name, icons, theme colors, start_url)
├── sw.js                  # Service worker — offline shell & caching strategy
├── favicon.ico            # Favicons & app icons (multiple formats/sizes)
├── apple-touch-icon.png
├── favicon.{png,svg,ico}
├── favicon-16x16.png
├── favicon-32x32.png
├── css/
│   └── mobile-app.css     # Styles for the mobile/PWA experience
├── js/
│   ├── offline-first.js   # Service worker registration, IndexedDB outbox & sync
│   ├── idle-session.js    # Idle detection, heartbeat, warning dialog & auto-logout
│   ├── flash-toast.js     # Toast notifications for flash messages
│   ├── header-dropdowns.js# Header navigation dropdown behaviour
│   ├── staff-clock-scanner.js # Badge/QR clock-in scanner (keyboard + camera input)
│   ├── vx-avatar-loader.js    # Mounts the 3D sign-language avatar (Three.js)
│   ├── vx-avatar-motion.js    # Avatar animation/pose control
│   ├── vx-avatar-scroll-guide.js # Avatar-guided scroll cues
│   └── vx-preloader.js    # Animated preloader for avatar scenes
├── models/
│   ├── avatar.glb         # 3D avatar model (glTF binary)
│   └── textures/          # Skin/body textures for the avatar
└── vendor/
    ├── three-0.170.0/     # Three.js r170 + addons (self-hosted)
    └── draco/1.5.7/       # Draco decoder for compressed glTF models
```

## Key Features

### Offline-First PWA
- `sw.js` registers a service worker with two caching strategies:
  - **Cache-first** for static assets (`js`, `css`, images, fonts, webmanifest).
  - **Network-first** for pages, with a cached fallback and a friendly
    offline message when a page was never saved on the device.
- `offline-first.js` queues form submissions in an IndexedDB outbox
  (`pearledu-offline` / `outbox`) and replays them when connectivity returns.
- Cache version lives in `sw.js` under the `CACHE` constant
  (`pearledu-offline-v2`) — **bump it whenever the service worker changes.**

### 3D Sign-Language Avatar
- Interactive avatar rendered with self-hosted **Three.js r170** and
  **Draco 1.5.7** decompression (no external CDN dependency).
- The `.htaccess` registers the required MIME types for `.glb` and `.wasm`.

### Idle Session Management
- `idle-session.js` tracks user activity, pings a heartbeat endpoint, shows a
  countdown warning dialog, and signs the user out after the configured
  idle lifetime (values injected via `<meta>` tags from the Laravel backend).

### Staff Clock Scanner
- `staff-clock-scanner.js` supports badge keyboard wedges and camera-based
  scanning for staff clock-in/out, with configurable prefix/suffix trimming.

## Server Configuration (`.htaccess`)

- Denies access to any `.env` file that might be copied into the document root.
- Forces **HTTPS** (works behind cPanel / proxy TLS termination via
  `X-Forwarded-Proto`).
- Forwards `Authorization` and `X-XSRF-Token` headers to PHP.
- Redirects trailing slashes and routes all non-file/non-directory requests
  to `index.php`.
- Adds MIME types: `model/gltf-binary` for `.glb`, `application/wasm` for `.wasm`.

## Local Development

Serve this folder as the document root through the parent Laravel project:

```bash
# From the Laravel project root (one level up)
php artisan serve
```

Then open `http://127.0.0.1:8000` in your browser.

## Deployment Notes

- Point the web server's document root at this directory — never at the
  Laravel project root.
- After changing `sw.js`, increment the `CACHE` version so clients pick up
  the new service worker.
- HTTPS is required for the service worker and camera access features.
