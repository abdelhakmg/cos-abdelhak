const CACHE_NAME = 'cosmetic-v1';

// تثبيت التطبيق
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// تفعيل التطبيق
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// جلب البيانات (العمل أوفلاين)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
