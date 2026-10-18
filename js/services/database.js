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

    // 2. مزامنة الولايات
    window.db.collection("wilayas").onSnapshot((snapshot) => {
        state.WILAYAS = [];
        snapshot.forEach((doc) => {
            state.WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        
        if (state.WILAYAS.length === 0) {
            console.log("قائمة الولايات فارغة، جاري حقن الـ 58 ولاية تلقائياً...");
            INITIAL_WILAYAS_58.forEach(w => {
                window.db.collection("wilayas").doc(w.code).set(w);
            });
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

    // 4. مزامنة الإعدادات العامة للمتجر (هنا تم حل مشكلة فقدان الذاكرة!)
    window.db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            state.storeSettings = { ...state.storeSettings, ...data };
            if (data.brands) state.brands = data.brands;
            if (data.bannerMessages) state.bannerMessages = data.bannerMessages;

            // 🚀 السطر السحري: جلب الفلاتر الديناميكية التي تصنعها في الإدارة
            if (data.categoryFilters) state.categoryFilters = data.categoryFilters;

            // الإبقاء على الفلاتر القديمة لعدم كسر المنتجات السابقة
            state.availableSkinTypes = (data.skinTypes && data.skinTypes.length > 0) ? data.skinTypes : state.availableSkinTypes;
            state.availableHairTypes = (data.hairTypes && data.hairTypes.length > 0) ? data.hairTypes : state.availableHairTypes;
        }
        
        // تحديث الواجهات فوراً بعد جلب الإعدادات والفلاتر
        safeCall('updateAppHeaderInfo');
        safeCall('updateSplashScreenText');
        safeCall('renderDynamicSidebarFilters'); // تحديث فلاتر الزبون
        safeCall('populateAdminDropdowns'); // تحديث فلاتر الإدارة
        safeCall('renderAdminAttributesTab'); 
        safeCall('renderAdminBrandsList'); 
        safeCall('renderBannerTextsList'); 
        safeCall('startBannerTicker'); 
        safeCall('updateStoreFooterLinks');
    }, (error) => console.error("Error fetching settings:", error));

    // 5. مزامنة الطلبيات (للإدارة)
    window.db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        state.orders = [];
        snapshot.forEach((doc) => {
            state.orders.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderAdminDashboard');
    }, (error) => console.error("Error fetching orders:", error));

    // 6. مزامنة البانر الإعلاني
    window.db.collection("heroSlides").onSnapshot((snapshot) => {
        state.heroSlides = [];
        snapshot.forEach((doc) => {
            state.heroSlides.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderHeroSlider');
    }, (error) => console.error("Error fetching hero slides:", error));
}

window.initFirebaseSync = initFirebaseSync;
