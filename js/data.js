let products = [];
let WILAYAS = [];
let categories = [];
let heroSlides = [];
let bannerMessages = [];
let orders = [];
let brands = [];

// قيم احتياطية تلقائية لضمان التشغيل وعدم التعليق
const defaultSkinTypes = ["الدهنية", "الجافة", "الحساسة", "المختلطة", "العادية"];
const defaultHairTypes = ["الشعر الدهني", "الشعر الجاف", "الشعر العادي", "الشعر المصبوغ", "الشعر المتضرر", "علاج القشرة", "بروتين / كيراتين"];

let availableSkinTypes = [...defaultSkinTypes];
let availableHairTypes = [...defaultHairTypes];

let favorites = JSON.parse(localStorage.getItem('lb_favs_v7')) || [];
let cart = JSON.parse(localStorage.getItem('lb_cart_v7')) || [];

let storeSettings = {
    name: "كوسمتيك عبد الحق",
    slogan: "يبدو أن أحدهم سيغدو سعيداً اليوم",
    logoUrl: "",
    pass: "admin123",
    msgSuccess: "تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.",
    msgWarning: "يرجى ملء كافة معلومات الاستمارة الضرورية!"
};

// دالة الأمان لاستدعاء الدوال الحركية دون إيقاف الكود في حال غياب أحدها
function safeCall(fn, ...args) {
    if (typeof window[fn] === 'function') {
        try {
            window[fn](...args);
        } catch (e) {
            console.warn(`Error executing ${fn}:`, e);
        }
    }
}

function initFirebaseSync() {
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
        console.error("Firebase is not initialized properly.");
        return;
    }

    // 1. جلب المنتجات
    db.collection("products").onSnapshot((snapshot) => {
        products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderProducts');
        safeCall('renderDynamicSidebarFilters');
        safeCall('applyFilters');
        safeCall('renderAdminProductsTable');
    }, (error) => {
        console.error("Error fetching products:", error);
    });

    // 2. جلب الولايات
    db.collection("wilayas").onSnapshot((snapshot) => {
        WILAYAS = [];
        snapshot.forEach((doc) => {
            WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        WILAYAS.sort((a, b) => parseInt(a.code) - parseInt(b.code));
        safeCall('populateWilayas');
        safeCall('populateCartWilayas');
        safeCall('renderAdminWilayasList');
    }, (error) => {
        console.error("Error fetching wilayas:", error);
    });

    // 3. جلب الفئات
    db.collection("categories").onSnapshot((snapshot) => {
        categories = [];
        snapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        safeCall('updateAppHeaderInfo');
        safeCall('populateAdminDropdowns');
    }, (error) => {
        console.error("Error fetching categories:", error);
    });

    // 4. جلب الإعدادات والخصائص
    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            storeSettings = { ...storeSettings, ...data };
            if (data.brands) brands = data.brands;

            if (data.skinTypes && data.skinTypes.length > 0) {
                availableSkinTypes = data.skinTypes;
            } else {
                availableSkinTypes = defaultSkinTypes;
            }

            if (data.hairTypes && data.hairTypes.length > 0) {
                availableHairTypes = data.hairTypes;
            } else {
                availableHairTypes = defaultHairTypes;
            }
        } else {
            availableSkinTypes = defaultSkinTypes;
            availableHairTypes = defaultHairTypes;
        }

        safeCall('updateAppHeaderInfo');
        safeCall('renderDynamicSidebarFilters');
        safeCall('populateAdminDropdowns');
        safeCall('renderAdminAttributesTab');
    }, (error) => {
        console.error("Error fetching settings:", error);
    });

    // 5. جلب الطلبيات
    db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        orders = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderAdminDashboard');
    }, (error) => {
        console.error("Error fetching orders:", error);
    });

    // 6. جلب البانرات الإعلانية
    db.collection("heroSlides").onSnapshot((snapshot) => {
        heroSlides = [];
        snapshot.forEach((doc) => {
            heroSlides.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderHeroSlider');
    }, (error) => {
        console.error("Error fetching hero slides:", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initFirebaseSync();
});
