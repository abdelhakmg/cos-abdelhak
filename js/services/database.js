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

window.initFirebaseSync = initFirebaseSync;
window.initAdminOrdersSync = initAdminOrdersSync;
