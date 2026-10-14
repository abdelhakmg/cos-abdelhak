// --- ملف js/services/database.js ---

// نستورد حالة المتجر والدوال المساعدة التي أنشأناها سابقاً
import { state, INITIAL_WILAYAS_58 } from '../store/state.js';
import { safeCall } from '../utils/helpers.js';

// دالة بدء المزامنة المباشرة مع قاعدة البيانات (Firebase Realtime Sync)
export function initFirebaseSync() {
    // نتأكد من أن فايربيس تم تحميله بنجاح من ملف index.html
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
        console.error("لم يتم تهيئة Firebase بشكل صحيح.");
        return;
    }

    // 1. مزامنة المنتجات
    db.collection("products").onSnapshot((snapshot) => {
        state.products = [];
        snapshot.forEach((doc) => {
            state.products.push({ id: doc.id, ...doc.data() });
        });
        // تحديث الواجهة بأمان
        safeCall('renderProducts');
        safeCall('renderDynamicSidebarFilters');
        safeCall('applyFilters');
        safeCall('renderAdminProductsTable');
    }, (error) => console.error("Error fetching products:", error));

    // 2. مزامنة الولايات (مع حقن الـ 58 ولاية تلقائياً إذا كانت فارغة)
    db.collection("wilayas").onSnapshot((snapshot) => {
        state.WILAYAS = [];
        snapshot.forEach((doc) => {
            state.WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        
        if (state.WILAYAS.length === 0) {
            console.log("قائمة الولايات فارغة، جاري حقن الـ 58 ولاية تلقائياً...");
            INITIAL_WILAYAS_58.forEach(w => {
                db.collection("wilayas").doc(w.code).set(w);
            });
        } else {
            state.WILAYAS.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            safeCall('populateWilayas');
            safeCall('populateCartWilayas');
            safeCall('renderAdminWilayasList');
        }
    }, (error) => console.error("Error fetching wilayas:", error));

    // 3. مزامنة الفئات (الأقسام)
    db.collection("categories").onSnapshot((snapshot) => {
        state.categories = [];
        snapshot.forEach((doc) => {
            state.categories.push({ id: doc.id, ...doc.data() });
        });
        safeCall('updateAppHeaderInfo');
        safeCall('populateAdminDropdowns');
    }, (error) => console.error("Error fetching categories:", error));

    // 4. مزامنة الإعدادات العامة للمتجر
    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            state.storeSettings = { ...state.storeSettings, ...data };
            if (data.brands) state.brands = data.brands;

            state.availableSkinTypes = (data.skinTypes && data.skinTypes.length > 0) ? data.skinTypes : state.availableSkinTypes;
            state.availableHairTypes = (data.hairTypes && data.hairTypes.length > 0) ? data.hairTypes : state.availableHairTypes;
        }
        safeCall('updateAppHeaderInfo');
        safeCall('renderDynamicSidebarFilters');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminAttributesTab');
    }, (error) => console.error("Error fetching settings:", error));

    // 5. مزامنة الطلبيات (للإدارة)
    db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        state.orders = [];
        snapshot.forEach((doc) => {
            state.orders.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderAdminDashboard');
    }, (error) => console.error("Error fetching orders:", error));

    // 6. مزامنة البانر الإعلاني
    db.collection("heroSlides").onSnapshot((snapshot) => {
        state.heroSlides = [];
        snapshot.forEach((doc) => {
            state.heroSlides.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderHeroSlider');
    }, (error) => console.error("Error fetching hero slides:", error));
}

// جعل الدالة متاحة للـ window ليبدأ تشغيلها عند تحميل الصفحة
window.initFirebaseSync = initFirebaseSync;
