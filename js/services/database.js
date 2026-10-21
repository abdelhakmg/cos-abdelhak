// --- ملف js/services/database.js (نسخة Cloud Architect المحسنة) ---

import { state, INITIAL_WILAYAS_58 } from '../store/state.js';
import { safeCall } from '../utils/helpers.js';

let ordersUnsubscribe = null;
let isSyncInitialized = false;

export function initFirebaseSync() {
    if (typeof window.firebase === 'undefined' || typeof window.db === 'undefined') {
        console.error("لم يتم تهيئة Firebase بشكل صحيح.");
        return;
    }

    // منع تشغيل المزامنة أكثر من مرة
    if (isSyncInitialized) return;
    isSyncInitialized = true;

    // 🚀 تفعيل التخزين المؤقت المحلي لـ Firestore (يوفر حتى 60% من القراءات المتكررة)
    window.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        console.warn("Firestore persistence warning:", err.code);
    });

    // 1. مزامنة المنتجات
    window.db.collection("products").onSnapshot((snapshot) => {
        state.products = [];
        snapshot.forEach((doc) => {
            state.products.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderProducts');
        safeCall('renderDynamicSidebarFilters');
        safeCall('renderBrandsFilterSidebar');
        safeCall('applyFilters');
        safeCall('renderAdminProductsTable');
        safeCall('checkInitialProductDeepLink'); // 🌟 يفتح صفحة المنتج فوراً إذا دخل الزبون من رابط فيسبوك
    }, (error) => console.error("Error fetching products:", error));

    // 2. مزامنة الولايات
    window.db.collection("wilayas").onSnapshot((snapshot) => {
        state.WILAYAS = [];
        snapshot.forEach((doc) => {
            state.WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        
        if (state.WILAYAS.length === 0) {
            const batch = window.db.batch();
            INITIAL_WILAYAS_58.forEach(w => {
                const ref = window.db.collection("wilayas").doc(w.code);
                batch.set(ref, w);
            });
            batch.commit().catch(err => console.error("Batch error:", err));
        } else {
            state.WILAYAS.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            safeCall('populateWilayas');
            safeCall('populateCartWilayas');
            safeCall('renderAdminWilayasList');
        }
    }, (error) => console.error("Error fetching wilayas:", error));

    // 3. مزامنة الفئات (الأقسام)
    window.db.collection("categories").onSnapshot((snapshot) => {
        state.categories = [];
        snapshot.forEach((doc) => {
            state.categories.push({ id: doc.id, ...doc.data() });
        });
        safeCall('updateAppHeaderInfo');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminCategoriesList');
    }, (error) => console.error("Error fetching categories:", error));

    // 4. مزامنة الإعدادات العامة للمتجر
    window.db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            state.storeSettings = { ...state.storeSettings, ...data };
            if (data.brands) state.brands = data.brands;
            if (data.bannerMessages) state.bannerMessages = data.bannerMessages;
            if (data.categoryFilters) state.categoryFilters = data.categoryFilters;
            if (data.coupons) state.coupons = data.coupons; // 🌟 جلب الكوبونات

            state.availableSkinTypes = (data.skinTypes && data.skinTypes.length > 0) ? data.skinTypes : state.availableSkinTypes;
            state.availableHairTypes = (data.hairTypes && data.hairTypes.length > 0) ? data.hairTypes : state.availableHairTypes;
        }
        
        safeCall('updateAppHeaderInfo');
        safeCall('updateSplashScreenText');
        safeCall('renderDynamicSidebarFilters');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminAttributesTab'); 
        safeCall('renderAdminBrandsList'); 
        safeCall('renderBannerTextsList'); 
        safeCall('renderAdminCouponsList');
        safeCall('startBannerTicker'); 
        safeCall('updateStoreFooterLinks');
    }, (error) => console.error("Error settings:", error));

    // 5. مزامنة البانر الإعلاني
    window.db.collection("heroSlides").onSnapshot((snapshot) => {
        state.heroSlides = [];
        snapshot.forEach((doc) => {
            state.heroSlides.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderHeroSlider');
        safeCall('renderAdminHeroSlidesList');
    }, (error) => console.error("Error fetching hero slides:", error));
}
// 6. تشغيل نظام تتبع الزوار الذكي
    initVisitorTracking();

    // 7. مزامنة الطلبيات ورادار الزوار للإدارة فقط عندما يكون المدير مسجلاً
    if (localStorage.getItem('cosAdminLoggedIn') === 'true') {
        initAdminOrdersSync();
        initAdminAnalyticsSync();
    }
// 🌟 دالة محمية من التكرار لجلب آخر 200 طلبية للمسؤول فقط (تمنع تسرب الذاكرة واستنزاف الحصة)
export function initAdminOrdersSync(limitCount = 200) {
    if (typeof window.db === 'undefined') return;
    
    // إذا كان هناك مستمع مفتوح مسبقاً، نغلقه أولاً لمنع مضاعفة الاستهلاك
    if (ordersUnsubscribe) {
        ordersUnsubscribe();
    }

    ordersUnsubscribe = window.db.collection("orders")
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .onSnapshot((snapshot) => {
            state.orders = [];
            snapshot.forEach((doc) => {
                state.orders.push({ id: doc.id, ...doc.data() });
            });
            safeCall('renderAdminDashboard');
        }, (error) => console.error("Error fetching orders:", error));
}
// ==========================================
// 🟢 محرك رادار الزوار الذكي (Live Presence & Daily/Monthly Analytics)
// ==========================================
let analyticsUnsubscribe = null; // تم تعريفه في البداية لتجنب أي خطأ

export async function initVisitorTracking() {
    if (typeof window.db === 'undefined') return;

    let sessionId = sessionStorage.getItem('cos_session_id');
    const isNewSession = !sessionId;
    if (!sessionId) {
        sessionId = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
        sessionStorage.setItem('cos_session_id', sessionId);
    }

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);
    const analyticsRef = window.db.collection("settings").doc("analytics");

    const updatePresence = async (countVisit = false) => {
        try {
            const doc = await analyticsRef.get();
            const nowMs = Date.now();
            let data = doc.exists ? doc.data() : {};

            let dayDate = data.dayDate || todayKey;
            let monthDate = data.monthDate || monthKey;
            let todayViews = Number(data.todayViews) || 0;
            let monthViews = Number(data.monthViews) || 0;
            let activeSessions = data.activeSessions || {};

            if (dayDate !== todayKey) {
                dayDate = todayKey;
                todayViews = 0;
            }
            if (monthDate !== monthKey) {
                monthDate = monthKey;
                monthViews = 0;
            }

            if (countVisit) {
                todayViews += 1;
                monthViews += 1;
            }

            Object.keys(activeSessions).forEach(id => {
                if (nowMs - activeSessions[id] > 240000) {
                    delete activeSessions[id];
                }
            });

            activeSessions[sessionId] = nowMs;

            await analyticsRef.set({
                dayDate,
                monthDate,
                todayViews,
                monthViews,
                activeSessions
            }, { merge: true });
        } catch (err) {
            console.warn("Analytics tracking info:", err.message);
        }
    };

    updatePresence(isNewSession);

    setInterval(() => {
        if (document.visibilityState === 'visible') {
            updatePresence(false);
        }
    }, 120000);

    window.addEventListener('beforeunload', () => {
        analyticsRef.update({
            [`activeSessions.${sessionId}`]: window.firebase.firestore.FieldValue.delete()
        }).catch(() => {});
    });
}

export function initAdminAnalyticsSync() {
    if (typeof window.db === 'undefined') return;
    if (analyticsUnsubscribe) analyticsUnsubscribe();

    analyticsUnsubscribe = window.db.collection("settings").doc("analytics")
        .onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            const nowMs = Date.now();
            const todayKey = new Date().toISOString().slice(0, 10);
            const monthKey = new Date().toISOString().slice(0, 7);

            const sessions = data.activeSessions || {};
            const liveCount = Object.values(sessions).filter(ts => (nowMs - ts) <= 240000).length;

            const todayCount = (data.dayDate === todayKey) ? (data.todayViews || 0) : 0;
            const monthCount = (data.monthDate === monthKey) ? (data.monthViews || 0) : 0;

            const liveEl = document.getElementById('stat-visitors-live');
            const todayEl = document.getElementById('stat-visitors-today');
            const monthEl = document.getElementById('stat-visitors-month');

            if (liveEl) liveEl.innerText = Math.max(1, liveCount).toLocaleString();
            if (todayEl) todayEl.innerText = todayCount.toLocaleString();
            if (monthEl) monthEl.innerText = monthCount.toLocaleString();
        }, (err) => console.warn("Admin analytics sync warning:", err));
}

window.initVisitorTracking = initVisitorTracking;
window.initAdminAnalyticsSync = initAdminAnalyticsSync;
window.initFirebaseSync = initFirebaseSync;
window.initAdminOrdersSync = initAdminOrdersSync;
