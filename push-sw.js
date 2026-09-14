/*
 * ZGAS Ρέθυμνο — service worker for push notifications only.
 *
 * This does NOT do any offline-caching / PWA-shell work — its only job is
 * to wake up when a push notification arrives (even if the app itself is
 * closed) and show it with vibration, and to focus/open the app when the
 * driver taps it. See the "push notifications" section of index.html for
 * how the notification gets sent (plain Web Push, RFC 8291/8292 — no
 * Firebase Cloud Messaging, no paid backend).
 */

self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event){
  var data = {};
  try{ data = event.data ? event.data.json() : {}; }catch(e){}

  var title = data.title || 'ZGAS — Νέα παραγγελία';
  var options = {
    body: data.body || '',
    tag: data.tag || 'zgas-order',
    // Android plays this pattern; iOS/desktop just use the system default
    // notification sound (there is no cross-platform way to pick a custom
    // sound for a web push notification).
    vibrate: [200, 100, 200, 100, 300],
    requireInteraction: false,
    data: {url: data.url || './'}
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(list){
      for(var i = 0; i < list.length; i++){
        if('focus' in list[i]) return list[i].focus();
      }
      if(self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
