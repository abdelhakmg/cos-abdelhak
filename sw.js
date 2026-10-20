// --- ملف sw.js ---

const CACHE_NAME = 'cosmetic-abdelhak-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/logo.png',
    '/manifest.json'
];

// 1. تثبيت التطبيق وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('Cache addAll warning:', err);
            });
        })
    );
});

// 2. تفعيل التحديث ومسح الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. إدارة الطلبات بذكاء (استثناء Firebase وطلبات POST)
self.addEventListener('fetch', (event) => {
    const reqUrl = event.request.url;

    // تجاهل الطلبات غير GET، وطلبات Firebase، وإضافات المتصفح
    if (
        event.request.method !== 'GET' ||
        reqUrl.includes('firestore.googleapis.com') ||
        reqUrl.includes('googleapis.com') ||
        reqUrl.includes('firebase') ||
        !reqUrl.startsWith('http')
    ) {
        return;
    }

    // استراتيجية Network First ثم العودة للكاش عند انقطاع الإنترنت
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
