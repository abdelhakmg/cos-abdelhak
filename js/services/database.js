// --- ملف js/services/database.js ---

import { state, INITIAL_WILAYAS_58 } from '../store/state.js';
import { safeCall } from '../utils/helpers.js';

export function initFirebaseSync() {
    if (typeof window.firebase === 'undefined' || typeof window.db === 'undefined') {
        console.error("لم يتم تهيئة Firebase بشكل صحيح.");
        return;
    }

    // 1. مزامنة المنتجات
    window.db.collection("products").onSnapshot((snapshot) => {
        state.products = [];
        snapshot.forEach((doc) => {
            state.products.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderProducts');
        safeCall('renderDynamicSidebarFilters');
        safeCall('applyFilters');
        safeCall('renderAdminProductsTable');
    }, (error) => console.error("Error fetching products:", error));

    // 2. مزامنة الولايات (باستخدام batch للكتابة دفعة واحدة)
    window.db.collection("wilayas").onSnapshot((snapshot) => {
        state.WILAYAS = [];
        snapshot.forEach((doc) => {
            state.WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        
        if (state.WILAYAS.length === 0) {
            console.log("قائمة الولايات فارغة، جاري حقن الـ 58 ولاية دفعة واحدة...");
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
        safeCall('startBannerTicker'); 
        safeCall('updateStoreFooterLinks');
    }, (error) => console.error("Error settings error:", error));

    // 🌟 5. الأمان أولاً: مزامنة الطلبيات للإدارة فقط عندما يكون المدير مسجلاً
    if (localStorage.getItem('cosAdminLoggedIn') === 'true') {
        initAdminOrdersSync();
    }
}

// دالة منفصلة لجلب الطلبيات للمسؤول حصرياً
export function initAdminOrdersSync() {
    if (typeof window.db === 'undefined') return;
    window.db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        state.orders = [];
        snapshot.forEach((doc) => {
            state.orders.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderAdminDashboard');
    }, (error) => console.error("Error fetching orders:", error));
}

window.initFirebaseSync = initFirebaseSync;
window.initAdminOrdersSync = initAdminOrdersSync;
