// البيانات المرجعية الأساسية للمتجر
let products = [];
let WILAYAS = [];
let categories = [];
let heroSlides = [];
let bannerMessages = [];
let orders = [];
let brands = [];

// مصفوفات ديناميكية لأنواع البشرة والشعر
let availableSkinTypes = ["الدهنية", "الجافة", "الحساسة", "المختلطة", "العادية"];
let availableHairTypes = ["الشعر الدهني", "الشعر الجاف", "الشعر العادي", "الشعر المصبوغ", "الشعر المتضرر", "علاج القشرة", "بروتين / كيراتين"];

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

// تهيئة الربط المباشر مع Firebase
function initFirebaseSync() {
    if (typeof firebase === 'undefined') return;

    // 1. مزامنة المنتجات
    db.collection("products").onSnapshot((snapshot) => {
        products = [];
        snapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof renderDynamicSidebarFilters === 'function') renderDynamicSidebarFilters();
        if (typeof applyFilters === 'function') applyFilters();
        if (typeof renderAdminProductsTable === 'function') renderAdminProductsTable();
    });

    // 2. مزامنة الولايات والأسعار
    db.collection("wilayas").onSnapshot((snapshot) => {
        WILAYAS = [];
        snapshot.forEach((doc) => {
            WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        WILAYAS.sort((a, b) => parseInt(a.code) - parseInt(b.code));
        if (typeof populateWilayas === 'function') populateWilayas();
        if (typeof populateCartWilayas === 'function') populateCartWilayas();
        if (typeof renderAdminWilayasList === 'function') renderAdminWilayasList();
    });

    // 3. مزامنة الفئات
    db.collection("categories").onSnapshot((snapshot) => {
        categories = [];
        snapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
        if (typeof populateAdminDropdowns === 'function') populateAdminDropdowns();
    });

    // 4. مزامنة إعدادات الهوية والأنواع
    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            storeSettings = { ...storeSettings, ...data };
            if (data.brands) brands = data.brands;
            if (data.skinTypes && data.skinTypes.length > 0) availableSkinTypes = data.skinTypes;
            if (data.hairTypes && data.hairTypes.length > 0) availableHairTypes = data.hairTypes;
        }
        if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
        if (typeof renderDynamicSidebarFilters === 'function') renderDynamicSidebarFilters();
        if (typeof populateAdminDropdowns === 'function') populateAdminDropdowns();
        if (typeof renderAdminAttributesTab === 'function') renderAdminAttributesTab();
    });

    // 5. مزامنة الطلبيات
    db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        orders = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    // 6. مزامنة البانر
    db.collection("heroSlides").onSnapshot((snapshot) => {
        heroSlides = [];
        snapshot.forEach((doc) => {
            heroSlides.push({ id: doc.id, ...doc.data() });
        });
        if (typeof renderHeroSlider === 'function') renderHeroSlider();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initFirebaseSync();
});
