let products = [];
let WILAYAS = [];
let categories = [];
let heroSlides = [];
let bannerMessages = [];
let orders = [];
let brands = [];

// قيم احتياطية تلقائية لضمان العرض
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

function initFirebaseSync() {
    if (typeof firebase === 'undefined') return;

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

    db.collection("categories").onSnapshot((snapshot) => {
        categories = [];
        snapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
        if (typeof populateAdminDropdowns === 'function') populateAdminDropdowns();
    });

    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            storeSettings = { ...storeSettings, ...data };
            if (data.brands) brands = data.brands;

            if (data.skinTypes && data.skinTypes.length > 0) {
                availableSkinTypes = data.skinTypes;
            } else {
                availableSkinTypes = defaultSkinTypes;
                db.collection("settings").doc("main").set({ skinTypes: defaultSkinTypes }, { merge: true });
            }

            if (data.hairTypes && data.hairTypes.length > 0) {
                availableHairTypes = data.hairTypes;
            } else {
                availableHairTypes = defaultHairTypes;
                db.collection("settings").doc("main").set({ hairTypes: defaultHairTypes }, { merge: true });
            }
        } else {
            availableSkinTypes = defaultSkinTypes;
            availableHairTypes = defaultHairTypes;
            db.collection("settings").doc("main").set({
                skinTypes: defaultSkinTypes,
                hairTypes: defaultHairTypes
            }, { merge: true });
        }

        if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
        if (typeof renderDynamicSidebarFilters === 'function') renderDynamicSidebarFilters();
        if (typeof populateAdminDropdowns === 'function') populateAdminDropdowns();
        if (typeof renderAdminAttributesTab === 'function') renderAdminAttributesTab();
    });

    db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        orders = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

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
