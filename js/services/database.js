// --- ملف js/services/database.js ---

import { state, INITIAL_WILAYAS_58 } from '../store/state.js';
import { safeCall } from '../utils/helpers.js';

export function initFirebaseSync() {
    if (typeof window.firebase === 'undefined' || typeof window.db === 'undefined') {
        console.error("خطأ: فايربيس غير متصل.");
        return;
    }

    // 1. مزامنة المنتجات
    window.db.collection("products").onSnapshot((snapshot) => {
        state.products = [];
        snapshot.forEach((doc) => { state.products.push({ id: doc.id, ...doc.data() }); });
        safeCall('renderProducts');
        safeCall('renderDynamicSidebarFilters');
        safeCall('applyFilters');
        safeCall('renderAdminProductsTable');
    });

    // 2. مزامنة الولايات
    window.db.collection("wilayas").onSnapshot((snapshot) => {
        state.WILAYAS = [];
        snapshot.forEach((doc) => { state.WILAYAS.push({ id: doc.id, ...doc.data() }); });
        
        if (state.WILAYAS.length === 0) {
            INITIAL_WILAYAS_58.forEach(w => { window.db.collection("wilayas").doc(w.code).set(w); });
        } else {
            state.WILAYAS.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            safeCall('populateWilayas');
            safeCall('populateCartWilayas');
            safeCall('renderAdminWilayasList');
        }
    });

    // 3. مزامنة الفئات (مع تحديث لوحة التحكم)
    window.db.collection("categories").onSnapshot((snapshot) => {
        state.categories = [];
        snapshot.forEach((doc) => { state.categories.push({ id: doc.id, ...doc.data() }); });
        safeCall('updateAppHeaderInfo');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminCategoriesList'); // تحديث قائمة الحذف في الإدارة
    });

    // 4. مزامنة الإعدادات (الرسائل، الماركات، والبانر)
    window.db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            state.storeSettings = { ...state.storeSettings, ...data };
            if (data.brands) state.brands = data.brands;
            if (data.bannerMessages) state.bannerMessages = data.bannerMessages;
            
            state.availableSkinTypes = (data.skinTypes && data.skinTypes.length > 0) ? data.skinTypes : state.availableSkinTypes;
            state.availableHairTypes = (data.hairTypes && data.hairTypes.length > 0) ? data.hairTypes : state.availableHairTypes;
        }
        safeCall('updateAppHeaderInfo');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminBrandsList'); // تحديث ماركات الإدارة
        safeCall('renderBannerTextsList'); // تحديث جمل البانر
        safeCall('startBannerTicker');
    });

    // 5. مزامنة الطلبيات للوحة التحكم
    window.db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        state.orders = [];
        snapshot.forEach((doc) => { state.orders.push({ id: doc.id, ...doc.data() }); });
        safeCall('renderAdminDashboard'); // تحديث جدول الطلبات فوراً
    });

    // 6. مزامنة إعلانات الصور
    window.db.collection("heroSlides").onSnapshot((snapshot) => {
        state.heroSlides = [];
        snapshot.forEach((doc) => { state.heroSlides.push({ id: doc.id, ...doc.data() }); });
        safeCall('renderHeroSlider');
    });
}

window.initFirebaseSync = initFirebaseSync;
