import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Precache assets injected by VitePWA
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Push Event Handler for incoming Web Push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: 'Accountability Nudge!',
    body: 'Your friend is reminding you to complete your daily goals!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: '/'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (err) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'accountability-reminder',
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notification Click Handler to focus or open the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
