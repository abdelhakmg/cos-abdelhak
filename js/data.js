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

const INITIAL_WILAYAS_58 = [
    { code: "01", name: "أدرار", officeCost: 900, communesData: [{ name: "أدرار", cost: 1000 }, { name: "تيميمون", cost: 1200 }, { name: "رقان", cost: 1300 }] },
    { code: "02", name: "الشلف", officeCost: 500, communesData: [{ name: "الشلف", cost: 600 }, { name: "تنس", cost: 700 }, { name: "بوقادير", cost: 700 }] },
    { code: "03", name: "الأغواط", officeCost: 600, communesData: [{ name: "الأغواط", cost: 700 }, { name: "آفلو", cost: 800 }] },
    { code: "04", name: "أم البواقي", officeCost: 500, communesData: [{ name: "أم البواقي", cost: 600 }, { name: "عين البيضاء", cost: 700 }, { name: "عين مليلة", cost: 700 }] },
    { code: "05", name: "باتنة", officeCost: 500, communesData: [{ name: "باتنة", cost: 600 }, { name: "بريكة", cost: 700 }, { name: "مروانة", cost: 700 }] },
    { code: "06", name: "بجاية", officeCost: 500, communesData: [{ name: "بجاية", cost: 600 }, { name: "أقبو", cost: 700 }, { name: "سوق الإثنين", cost: 700 }] },
    { code: "07", name: "بسكرة", officeCost: 600, communesData: [{ name: "بسكرة", cost: 700 }, { name: "طولقة", cost: 800 }, { name: "سيدي عقبة", cost: 800 }] },
    { code: "08", name: "بشار", officeCost: 800, communesData: [{ name: "بشار", cost: 900 }, { name: "عبادلة", cost: 1000 }] },
    { code: "09", name: "البليدة", officeCost: 400, communesData: [{ name: "البليدة", cost: 500 }, { name: "بوفاريك", cost: 500 }, { name: "الأربعاء", cost: 600 }, { name: "العفارون", cost: 600 }] },
    { code: "10", name: "البويرة", officeCost: 450, communesData: [{ name: "البويرة", cost: 550 }, { name: "الأخضرية", cost: 600 }, { name: "سور الغزلان", cost: 600 }] },
    { code: "11", name: "تمنراست", officeCost: 1000, communesData: [{ name: "تمنراست", cost: 1200 }] },
    { code: "12", name: "تبسة", officeCost: 600, communesData: [{ name: "تبسة", cost: 700 }, { name: "الشريعة", cost: 800 }, { name: "بئر العاتر", cost: 800 }] },
    { code: "13", name: "تلمسان", officeCost: 550, communesData: [{ name: "تلمسان", cost: 650 }, { name: "مغنية", cost: 700 }, { name: "الغسوات", cost: 700 }] },
    { code: "14", name: "تيارت", officeCost: 550, communesData: [{ name: "تيارت", cost: 650 }, { name: "فرندة", cost: 700 }, { name: "قصر الشلالة", cost: 700 }] },
    { code: "15", name: "تيزي وزو", officeCost: 450, communesData: [{ name: "تيزي وزو", cost: 550 }, { name: "أزفون", cost: 650 }, { name: "عزازقة", cost: 650 }, { name: "دراع بن خدة", cost: 600 }] },
    { code: "16", name: "الجزائر", officeCost: 350, communesData: [{ name: "الجزائر العاصمة", cost: 450 }, { name: "باب الواد", cost: 450 }, { name: "الدار البيضاء", cost: 500 }, { name: "بئر مراد رايس", cost: 450 }, { name: "الحراش", cost: 450 }, { name: "سيدي أمحمد", cost: 450 }, { name: "زرالدة", cost: 550 }, { name: "الرغاية", cost: 550 }] },
    { code: "17", name: "الجلفة", officeCost: 500, communesData: [{ name: "الجلفة", cost: 600 }, { name: "مسعد", cost: 700 }, { name: "حاسي بحبح", cost: 700 }] },
    { code: "18", name: "جيجل", officeCost: 500, communesData: [{ name: "جيجل", cost: 600 }, { name: "الطاهير", cost: 700 }, { name: "الميلية", cost: 700 }] },
    { code: "19", name: "سطيف", officeCost: 450, communesData: [{ name: "سطيف", cost: 550 }, { name: "العلمة", cost: 600 }, { name: "بوعبيرة", cost: 600 }] },
    { code: "20", name: "سعيدة", officeCost: 550, communesData: [{ name: "سعيدة", cost: 650 }] },
    { code: "21", name: "سكيكدة", officeCost: 500, communesData: [{ name: "سكيكدة", cost: 600 }, { name: "القرارة", cost: 700 }, { name: "عزابة", cost: 700 }] },
    { code: "22", name: "سيدي بلعباس", officeCost: 550, communesData: [{ name: "سيدي بلعباس", cost: 650 }, { name: "سيدي علي بن يوب", cost: 700 }] },
    { code: "23", name: "عنابة", officeCost: 500, communesData: [{ name: "عنابة", cost: 600 }, { name: "البوني", cost: 650 }, { name: "الحجار", cost: 650 }] },
    { code: "24", name: "قالمة", officeCost: 500, communesData: [{ name: "قالمة", cost: 600 }, { name: "بوشقوف", cost: 700 }] },
    { code: "25", name: "قسنطينة", officeCost: 450, communesData: [{ name: "قسنطينة", cost: 550 }, { name: "الخروب", cost: 600 }, { name: "عين عبيد", cost: 650 }] },
    { code: "26", name: "المدية", officeCost: 450, communesData: [{ name: "المدية", cost: 550 }, { name: "قصر البخاري", cost: 650 }, { name: "برواقية", cost: 600 }] },
    { code: "27", name: "مستغانم", officeCost: 500, communesData: [{ name: "مستغانم", cost: 600 }, { name: "عين تادلس", cost: 700 }] },
    { code: "28", name: "المسيلة", officeCost: 500, communesData: [{ name: "المسيلة", cost: 600 }, { name: "بوسعادة", cost: 700 }, { name: "مقرة", cost: 700 }] },
    { code: "29", name: "معسكر", officeCost: 550, communesData: [{ name: "معسكر", cost: 650 }, { name: "سيق", cost: 700 }, { name: "محمدية", cost: 700 }] },
    { code: "30", name: "ورقلة", officeCost: 650, communesData: [{ name: "ورقلة", cost: 750 }, { name: "حاسي مسعود", cost: 850 }, { name: "تقرت", cost: 800 }] },
    { code: "31", name: "وهران", officeCost: 450, communesData: [{ name: "وهران", cost: 550 }, { name: "السانية", cost: 600 }, { name: "أرزيو", cost: 600 }, { name: "بئر الجير", cost: 550 }] },
    { code: "32", name: "البيض", officeCost: 650, communesData: [{ name: "البيض", cost: 750 }] },
    { code: "33", name: "إليزي", officeCost: 1100, communesData: [{ name: "إليزي", cost: 1300 }, { name: "جانت", cost: 1400 }] },
    { code: "34", name: "برج بوعريريج", officeCost: 450, communesData: [{ name: "برج بوعريريج", cost: 550 }, { name: "رأس الوادي", cost: 650 }] },
    { code: "35", name: "بومرداس", officeCost: 400, communesData: [{ name: "بومرداس", cost: 500 }, { name: "الثنية", cost: 550 }, { name: "دلس", cost: 600 }, { name: "برج منايل", cost: 550 }] },
    { code: "36", name: "الطارف", officeCost: 550, communesData: [{ name: "الطارف", cost: 650 }, { name: "القالة", cost: 700 }, { name: "بن مهيدي", cost: 650 }] },
    { code: "37", name: "تندوف", officeCost: 1000, communesData: [{ name: "تندوف", cost: 1200 }] },
    { code: "38", name: "تيسمسيلت", officeCost: 550, communesData: [{ name: "تيسمسيلت", cost: 650 }, { name: "ثنية الأحد", cost: 700 }] },
    { code: "39", name: "الوادي", officeCost: 650, communesData: [{ name: "الوادي", cost: 750 }, { name: "المغير", cost: 800 }, { name: "جامعة", cost: 800 }] },
    { code: "40", name: "خنشلة", officeCost: 550, communesData: [{ name: "خنشلة", cost: 650 }, { name: "قايس", cost: 700 }] },
    { code: "41", name: "سوق أهراس", officeCost: 550, communesData: [{ name: "سوق أهراس", cost: 650 }, { name: "سدروات", cost: 700 }] },
    { code: "42", name: "تيبازة", officeCost: 400, communesData: [{ name: "تيبازة", cost: 500 }, { name: "شرشال", cost: 550 }, { name: "القليعة", cost: 500 }, { name: "بواسماعيل", cost: 500 }] },
    { code: "43", name: "ميلة", officeCost: 500, communesData: [{ name: "ميلة", cost: 600 }, { name: "فرجيوة", cost: 700 }, { name: "تاجنانت", cost: 700 }] },
    { code: "44", name: "عين الدفلى", officeCost: 450, communesData: [{ name: "عين الدفلى", cost: 550 }, { name: "خميس مليانة", cost: 600 }, { name: "العطاف", cost: 600 }] },
    { code: "45", name: "النعامة", officeCost: 600, communesData: [{ name: "النعامة", cost: 700 }, { name: "مشرية", cost: 750 }] },
    { code: "46", name: "عين تموشنت", officeCost: 550, communesData: [{ name: "عين تموشنت", cost: 650 }, { name: "بني صاف", cost: 700 }] },
    { code: "47", name: "غرداية", officeCost: 650, communesData: [{ name: "غرداية", cost: 750 }, { name: "متليلي", cost: 800 }, { name: "القرارة", cost: 800 }] },
    { code: "48", name: "غليزان", officeCost: 500, communesData: [{ name: "غليزان", cost: 600 }, { name: "وادي رهيو", cost: 700 }, { name: "مازونة", cost: 700 }] },
    { code: "49", name: "تيميمون", officeCost: 900, communesData: [{ name: "تيميمون", cost: 1000 }] },
    { code: "50", name: "برج باجي مختار", officeCost: 1200, communesData: [{ name: "برج باجي مختار", cost: 1400 }] },
    { code: "51", name: "أولاد جلال", officeCost: 600, communesData: [{ name: "أولاد جلال", cost: 700 }] },
    { code: "52", name: "بني عباس", officeCost: 900, communesData: [{ name: "بني عباس", cost: 1000 }] },
    { code: "53", name: "إن صالح", officeCost: 1000, communesData: [{ name: "إن صالح", cost: 1200 }] },
    { code: "54", name: "إن قزام", officeCost: 1200, communesData: [{ name: "إن قزام", cost: 1400 }] },
    { code: "55", name: "تقرت", officeCost: 650, communesData: [{ name: "تقرت", cost: 750 }] },
    { code: "56", name: "جانت", officeCost: 1100, communesData: [{ name: "جانت", cost: 1300 }] },
    { code: "57", name: "المغير", officeCost: 650, communesData: [{ name: "المغير", cost: 750 }] },
    { code: "58", name: "المنيعة", officeCost: 750, communesData: [{ name: "المنيعة", cost: 850 }] }
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
        
        if (WILAYAS.length === 0) {
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
