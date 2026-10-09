/*
 * Retired service worker.
 *
 * voxsign.co.ug used to be served by the PearlEdu Laravel app, whose pages
 * registered an offline service worker at /sw.js. This site is static and
 * has no service worker, so any browser that still has the old one installed
 * fetches this file on its next update check, clears the old PearlEdu caches,
 * unregisters itself and reloads its open tabs from the network.
 */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.map(function (key) { return caches.delete(key); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) { clients.forEach(function (client) { client.navigate(client.url); }); })
  );
});
