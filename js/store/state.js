// --- ملف js/store/state.js (حالة مركزية موحدة ومحمية عبر كافة الوحدات) ---

const defaultState = {
    products: [],
    categories: [],
    heroSlides: [],
    bannerMessages: [],
    orders: [],
    brands: [],
    coupons: [],
    WILAYAS: [],
    categoryFilters: {}, 
    availableSkinTypes: [],
    availableHairTypes: [],
    favorites: (() => {
        try { return JSON.parse(localStorage.getItem('lb_favs_v7')) || []; } 
        catch (e) { return []; }
    })(),
    cart: (() => {
        try { return JSON.parse(localStorage.getItem('lb_cart_v7')) || []; } 
        catch (e) { return []; }
    })(),
    storeSettings: {
        name: "كوسمتيك عبد الحق",
        slogan: "يبدو أن أحدهم سينام سعيداً اليوم",
        logoUrl: "",
        msgSuccess: "تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.",
        msgWarning: "يرجى ملء كافة معلومات الاستمارة الضرورية!"
    }
};

// 🌟 ضمان عدم تعدد نسخ الـ State حتى مع استخدام Cache Busting في الاستيراد
if (!window.__COS_SHARED_STATE__) {
    window.__COS_SHARED_STATE__ = defaultState;
}

export const state = window.__COS_SHARED_STATE__;

export const INITIAL_WILAYAS_58 = [
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

export function saveCartToLocal() { localStorage.setItem('lb_cart_v7', JSON.stringify(state.cart)); }
export function saveFavsToLocal() { localStorage.setItem('lb_favs_v7', JSON.stringify(state.favorites)); }
window.appState = state;
