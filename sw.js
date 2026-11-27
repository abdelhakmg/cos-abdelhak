// --- ملف sw.js (الإصدار الذكي v6 مع حماية امتلاء الكاش وتحديد سقف الصور) ---

const CACHE_NAME = 'cosmetic-abdelhak-v15';
const IMAGE_CACHE_NAME = 'firebase-images-cache';
const MAX_CACHED_IMAGES = 80;

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/logo.png',
    '/manifest.json'
];

// 🌟 دالة آمنة لحفظ الملفات في الكاش مع حذف القديم تلقائياً ومنع خطأ QuotaExceededError
async function safeCachePut(cacheName, request, response, maxItems = 0) {
    try {
        // عدم تخزين الاستجابات الفاشلة أو المجهولة الحجم (Opaque) التي تستهلك مساحة ضخمة
        if (!response || !response.ok || response.type === 'opaque') return;

        const cache = await caches.open(cacheName);
        if (maxItems > 0) {
            const keys = await cache.keys();
            if (keys.length >= maxItems) {
                const toDelete = keys.slice(0, keys.length - maxItems + 1);
                await Promise.all(toDelete.map((k) => cache.delete(k)));
            }
        }
        await cache.put(request, response);
    } catch (err) {
        // إذا امتلأت مساحة المتصفح (مثل التصفح المتخفي)، نفرّغ كاش الصور بصمت دون أي خطأ
        if (err && err.name === 'QuotaExceededError') {
            await caches.delete(IMAGE_CACHE_NAME).catch(() => {});
        }
    }
}

// 1. تثبيت التطبيق وفرض التفعيل الفوري
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
        })
    );
});

// 2. تفعيل التحديث ومسح الكاش البرمجي القديم (مع الحفاظ على كاش الصور)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== IMAGE_CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. إدارة الطلبات بذكاء
self.addEventListener('fetch', (event) => {
    const reqUrl = event.request.url;

    // تجاهل الطلبات غير GET وطلبات الـ API الخاصة بالطلبات والتتبع
    if (event.request.method !== 'GET' || !reqUrl.startsWith('http') || reqUrl.includes('/api/')) {
        return;
    }

    // استثناء قاعدة بيانات فايرباس (Firestore) لتبقى البيانات حية
    if (reqUrl.includes('firestore.googleapis.com')) {
        return;
    }

    // التقاط صور المنتجات وتخزينها بحد أقصى (80 صورة) وحماية كاملة من امتلاء الذاكرة
    if (reqUrl.includes('firebasestorage.googleapis.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.ok && networkResponse.type !== 'opaque') {
                        const clone = networkResponse.clone();
                        event.waitUntil(safeCachePut(IMAGE_CACHE_NAME, event.request, clone, MAX_CACHED_IMAGES));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // تجاهل باقي خدمات فايرباس وجوجل وأي نطاقات خارجية (مثل فيسبوك والخطوط) لعدم تضخيم الكاش
    if (new URL(reqUrl).origin !== self.location.origin) {
        return;
    }

    // جلب أحدث كود برمجي من السيرفر لملفات موقعك فقط وتحديث الكاش بأمان
    event.respondWith(
        fetch(event.request, { cache: 'no-store' })
            .then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                    const clone = networkResponse.clone();
                    event.waitUntil(safeCachePut(CACHE_NAME, event.request, clone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});
