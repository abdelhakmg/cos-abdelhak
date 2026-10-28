// --- ملف sw.js ---

const CACHE_NAME = 'cosmetic-abdelhak-v4'; // تم التحديث إلى v3 لفرض التحديث عند الزوار
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
                    if (cache !== CACHE_NAME && cache !== 'firebase-images-cache') {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. إدارة الطلبات بذكاء (استثناء Firebase وتخزين الصور)
self.addEventListener('fetch', (event) => {
    const reqUrl = event.request.url;

    // تجاهل الطلبات غير GET
    if (event.request.method !== 'GET' || !reqUrl.startsWith('http')) {
        return;
    }

    // 🌟 استثناء قاعدة بيانات فايرباس (Firestore) لتبقى البيانات حية
    if (reqUrl.includes('firestore.googleapis.com')) {
        return;
    }

    // 🌟 الإضافة الجديدة: التقاط صور المنتجات وتخزينها في الكاش (يوفر استهلاك الـ Bandwidth)
    if (reqUrl.includes('firebasestorage.googleapis.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // إذا كانت الصورة محفوظة مسبقاً، نعرضها مجاناً بدون استهلاك إنترنت
                if (cachedResponse) {
                    return cachedResponse;
                }
                // إذا كانت جديدة، نجلبها ونحفظها للمرات القادمة
                return fetch(event.request).then((networkResponse) => {
                    return caches.open('firebase-images-cache').then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // تجاهل باقي خدمات فايرباس وجوجل (ما عدا الصور التي تمت معالجتها بالأعلى)
    if (reqUrl.includes('googleapis.com') || reqUrl.includes('firebase')) {
        return;
    }

    // استراتيجية Network First ثم العودة للكاش عند انقطاع الإنترنت لباقي ملفات الموقع
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
