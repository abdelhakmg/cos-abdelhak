let products = [];
let WILAYAS = [];
let categories = [];
let heroSlides = [];
let bannerMessages = [];
let orders = [];
let brands = [];

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

function safeCall(fn, ...args) {
    if (typeof window[fn] === 'function') {
        try {
            window[fn](...args);
        } catch (e) {
            console.warn(`Error executing ${fn}:`, e);
        }
    }
}

function showCustomAlert(title, message, isSuccess = true) {
    const modal = document.getElementById('custom-alert-modal');
    const iconBox = document.getElementById('alert-icon-box');
    const icon = document.getElementById('alert-icon');
    const titleEl = document.getElementById('alert-title');
    const msgEl = document.getElementById('alert-message');

    if (!modal) return;

    titleEl.innerText = title;
    msgEl.innerText = message;

    if (isSuccess) {
        iconBox.className = "w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto text-black text-2xl shadow-lg";
        icon.className = "fa-solid fa-check";
    } else {
        iconBox.className = "w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-500 text-2xl shadow-lg";
        icon.className = "fa-solid fa-circle-exclamation";
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// 🟢 قائمة الولايات الـ 58 الجزائرية وتعبئتها التلقائية في Firebase إذا كانت فارغة
// 🟢 قائمة الولايات الـ 58 الجزائرية وتعبئتها التلقائية في Firebase إذا كانت فارغة (نظام المكتب + المنزل الثابت)
const INITIAL_WILAYAS_58 = [
    { code: "01", name: "أدرار", officeCost: 900, homeCost: 1200 },
    { code: "02", name: "الشلف", officeCost: 500, homeCost: 700 },
    { code: "03", name: "الأغواط", officeCost: 600, homeCost: 800 },
    { code: "04", name: "أم البواقي", officeCost: 500, homeCost: 700 },
    { code: "05", name: "باتنة", officeCost: 500, homeCost: 700 },
    { code: "06", name: "بجاية", officeCost: 500, homeCost: 700 },
    { code: "07", name: "بسكرة", officeCost: 600, homeCost: 800 },
    { code: "08", name: "بشار", officeCost: 800, homeCost: 1000 },
    { code: "09", name: "البليدة", officeCost: 400, homeCost: 600 },
    { code: "10", name: "البويرة", officeCost: 450, homeCost: 650 },
    { code: "11", name: "تمنراست", officeCost: 1000, homeCost: 1300 },
    { code: "12", name: "تبسة", officeCost: 600, homeCost: 800 },
    { code: "13", name: "تلمسان", officeCost: 550, homeCost: 750 },
    { code: "14", name: "تيارت", officeCost: 550, homeCost: 750 },
    { code: "15", name: "تيزي وزو", officeCost: 450, homeCost: 650 },
    { code: "16", name: "الجزائر", officeCost: 350, homeCost: 550 },
    { code: "17", name: "الجلفة", officeCost: 500, homeCost: 700 },
    { code: "18", name: "جيجل", officeCost: 500, homeCost: 700 },
    { code: "19", name: "سطيف", officeCost: 450, homeCost: 650 },
    { code: "20", name: "سعيدة", officeCost: 550, homeCost: 750 },
    { code: "21", name: "سكيكدة", officeCost: 500, homeCost: 700 },
    { code: "22", name: "سيدي بلعباس", officeCost: 550, homeCost: 750 },
    { code: "23", name: "عنابة", officeCost: 500, homeCost: 700 },
    { code: "24", name: "قالمة", officeCost: 500, homeCost: 700 },
    { code: "25", name: "قسنطينة", officeCost: 450, homeCost: 650 },
    { code: "26", name: "المدية", officeCost: 450, homeCost: 650 },
    { code: "27", name: "مستغانم", officeCost: 500, homeCost: 700 },
    { code: "28", name: "المسيلة", officeCost: 500, homeCost: 700 },
    { code: "29", name: "معسكر", officeCost: 550, homeCost: 750 },
    { code: "30", name: "ورقلة", officeCost: 650, homeCost: 850 },
    { code: "31", name: "وهران", officeCost: 450, homeCost: 650 },
    { code: "32", name: "البيض", officeCost: 650, homeCost: 850 },
    { code: "33", name: "إليزي", officeCost: 1100, homeCost: 1400 },
    { code: "34", name: "برج بوعريريج", officeCost: 450, homeCost: 650 },
    { code: "35", name: "بومرداس", officeCost: 400, homeCost: 600 },
    { code: "36", name: "الطارف", officeCost: 550, homeCost: 750 },
    { code: "37", name: "تندوف", officeCost: 1000, homeCost: 1300 },
    { code: "38", name: "تيسمسيلت", officeCost: 550, homeCost: 750 },
    { code: "39", name: "الوادي", officeCost: 650, homeCost: 850 },
    { code: "40", name: "خنشلة", officeCost: 550, homeCost: 750 },
    { code: "41", name: "سوق أهراس", officeCost: 550, homeCost: 750 },
    { code: "42", name: "تيبازة", officeCost: 400, homeCost: 600 },
    { code: "43", name: "ميلة", officeCost: 500, homeCost: 700 },
    { code: "44", name: "عين الدفلى", officeCost: 450, homeCost: 650 },
    { code: "45", name: "النعامة", officeCost: 600, homeCost: 800 },
    { code: "46", name: "عين تموشنت", officeCost: 550, homeCost: 750 },
    { code: "47", name: "غرداية", officeCost: 650, homeCost: 850 },
    { code: "48", name: "غليزان", officeCost: 500, homeCost: 700 },
    { code: "49", name: "تيميمون", officeCost: 900, homeCost: 1200 },
    { code: "50", name: "برج باجي مختار", officeCost: 1200, homeCost: 1500 },
    { code: "51", name: "أولاد جلال", officeCost: 600, homeCost: 800 },
    { code: "52", name: "بني عباس", officeCost: 900, homeCost: 1200 },
    { code: "53", name: "إن صالح", officeCost: 1000, homeCost: 1300 },
    { code: "54", name: "إن قزام", officeCost: 1200, homeCost: 1500 },
    { code: "55", name: "تقرت", officeCost: 650, homeCost: 850 },
    { code: "56", name: "جانت", officeCost: 1100, homeCost: 1400 },
    { code: "57", name: "المغير", officeCost: 650, homeCost: 850 },
    { code: "58", name: "المنيعة", officeCost: 750, homeCost: 950 }
];

function initFirebaseSync() {
    if (typeof firebase === 'undefined' || typeof db === 'undefined') {
        console.error("Firebase is not initialized properly.");
        return;
    }

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

    db.collection("wilayas").onSnapshot((snapshot) => {
        WILAYAS = [];
        snapshot.forEach((doc) => {
            WILAYAS.push({ id: doc.id, ...doc.data() });
        });
        
        // إذا كانت قاعدة البيانات فارغة تماماً من الولايات، نقوم بحقن الـ 58 ولاية تلقائياً
        if (WILAYAS.length === 0) {
            console.log("الولايات فارغة، جاري حقن الـ 58 ولاية تلقائياً...");
            INITIAL_WILAYAS_58.forEach(w => {
                db.collection("wilayas").doc(w.code).set(w);
            });
        } else {
            WILAYAS.sort((a, b) => parseInt(a.code) - parseInt(b.code));
            safeCall('populateWilayas');
            safeCall('populateCartWilayas');
            safeCall('renderAdminWilayasList');
        }
    }, (error) => {
        console.error("Error fetching wilayas:", error);
    });

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

    db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        orders = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        safeCall('renderAdminDashboard');
    }, (error) => {
        console.error("Error fetching orders:", error);
    });

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
