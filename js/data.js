const firebaseConfig = {
    apiKey: "AIzaSyBhOF2rgPJFQRVoLW7TD0t64A4skGewjsA",
    authDomain: "cos-abdelhak.firebaseapp.com",
    projectId: "cos-abdelhak",
    storageBucket: "cos-abdelhak.firebasestorage.app",
    messagingSenderId: "425194527542",
    appId: "1:425194527542:web:fa10d4cd5fcf904826f197"
};

// Initialize Firebase & Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// قائمة افتراضية للولايات في حال كانت قاعدة البيانات فارغة
const DEFAULT_WILAYAS = [
    { code: "01", name: "أدرار", homeCost: 900, officeCost: 500, communes: ["أدرار", "رقان", "أولف", "تيميمون"] },
    { code: "02", name: "الشلف", homeCost: 600, officeCost: 400, communes: ["الشلف", "تنس", "تاوقريت"] },
    { code: "03", name: "الأغواط", homeCost: 700, officeCost: 450, communes: ["الأغواط", "أفلو", "حاسي الرمل"] },
    { code: "04", name: "أم البواقي", homeCost: 650, officeCost: 400, communes: ["أم البواقي", "عين بيضاء", "عين مليلة"] },
    { code: "05", name: "باتنة", homeCost: 650, officeCost: 400, communes: ["باتنة", "بريكة", "عين التوتة"] },
    { code: "06", name: "بجاية", homeCost: 600, officeCost: 400, communes: ["بجاية", "أميزور", "أقبو"] },
    { code: "07", name: "بسكرة", homeCost: 700, officeCost: 450, communes: ["بسكرة", "طولقة", "زريبة الوادي"] },
    { code: "08", name: "بشار", homeCost: 850, officeCost: 500, communes: ["بشار", "القنادسة", "عني الصفراء"] },
    { code: "09", name: "البليدة", homeCost: 500, officeCost: 300, communes: ["البليدة", "بوفاريك", "العفرون"] },
    { code: "10", name: "البويرة", homeCost: 600, officeCost: 400, communes: ["البويرة", "الأخضرية", "سور الغزلان"] },
    { code: "11", name: "تمنراست", homeCost: 1000, officeCost: 600, communes: ["تمنراست", "عين صالح"] },
    { code: "12", name: "تبسة", homeCost: 650, officeCost: 400, communes: ["تبسة", "الونزة", "العوينات"] },
    { code: "13", name: "تلمسان", homeCost: 650, officeCost: 400, communes: ["تلمسان", "مغنية", "منصورة"] },
    { code: "14", name: "تيارت", homeCost: 650, officeCost: 400, communes: ["تيارت", "فرندة", "قصر الشلالة"] },
    { code: "15", name: "تيزي وزو", homeCost: 600, officeCost: 400, communes: ["تيزي وزو", "عزازقة", "ذراع الميزان"] },
    { code: "16", name: "الجزائر العاصمة", homeCost: 400, officeCost: 250, communes: ["باب الزوار", "الجزائر الوسطى", "الشراقة", "الرويبة"] },
    { code: "17", name: "الجلفة", homeCost: 650, officeCost: 400, communes: ["الجلفة", "مسعد", "عين وسارة"] },
    { code: "18", name: "جيجل", homeCost: 600, officeCost: 400, communes: ["جيجل", "الميلية", "طاهير"] },
    { code: "19", name: "سطيف", homeCost: 600, officeCost: 400, communes: ["سطيف", "العلمة", "عين أرنات"] },
    { code: "20", name: "سعيدة", homeCost: 650, officeCost: 400, communes: ["سعيدة", "الحساسنة"] },
    { code: "21", name: "سكيكدة", homeCost: 600, officeCost: 400, communes: ["سكيكدة", "عزابة", "الحروش"] },
    { code: "22", name: "سيدي بلعباس", homeCost: 650, officeCost: 400, communes: ["سيدي بلعباس", "سفيزف", "تلاغ"] },
    { code: "23", name: "عنابة", homeCost: 650, officeCost: 400, communes: ["عنابة", "البوني", "الحجار"] },
    { code: "24", name: "قالمة", homeCost: 650, officeCost: 400, communes: ["قالمة", "وادي الزناتي", "بوشقوف"] },
    { code: "25", name: "قسنطينة", homeCost: 600, officeCost: 400, communes: ["قسنطينة", "الخروب", "زيغود يوسف"] },
    { code: "26", name: "المدية", homeCost: 600, officeCost: 400, communes: ["المدية", "البرواقية", "قصر البخاري"] },
    { code: "27", name: "مستغانم", homeCost: 650, officeCost: 400, communes: ["مستغانم", "عين تادلس"] },
    { code: "28", name: "المسيلة", homeCost: 650, officeCost: 400, communes: ["المسيلة", "بوسعادة", "سيدي عيسى"] },
    { code: "29", name: "معسكر", homeCost: 650, officeCost: 400, communes: ["معسكر", "سيق", "غريس"] },
    { code: "30", name: "ورقلة", homeCost: 750, officeCost: 450, communes: ["ورقلة", "تقرت", "حاسي مسعود"] },
    { code: "31", name: "وهران", homeCost: 600, officeCost: 400, communes: ["وهران", "السانية", "أرزيو"] },
    { code: "32", name: "البيض", homeCost: 800, officeCost: 500, communes: ["البيض", "بوقطب"] },
    { code: "33", name: "إليزي", homeCost: 1100, officeCost: 700, communes: ["إليزي", "جانت"] },
    { code: "34", name: "برج بوعريريج", homeCost: 600, officeCost: 400, communes: ["برج بوعريريج", "راس الوادي"] },
    { code: "35", name: "بومرداس", homeCost: 500, officeCost: 350, communes: ["بومرداس", "خميس الخشنة", "برج منايل"] },
    { code: "36", name: "الطارف", homeCost: 650, officeCost: 400, communes: ["الطارف", "القالة"] },
    { code: "37", name: "تندوف", homeCost: 1100, officeCost: 700, communes: ["تندوف"] },
    { code: "38", name: "تسمسيلت", homeCost: 650, officeCost: 400, communes: ["تسمسيلت", "ثنية الحد"] },
    { code: "39", name: "الوادي", homeCost: 750, officeCost: 450, communes: ["الوادي", "جامعة", "المغير"] },
    { code: "40", name: "خنشلة", homeCost: 650, officeCost: 400, communes: ["خنشلة", "قايس"] },
    { code: "41", name: "سوق أهراس", homeCost: 650, officeCost: 400, communes: ["سوق أهراس", "سدراتة"] },
    { code: "42", name: "تيبازة", homeCost: 500, officeCost: 350, communes: ["تيبازة", "القليعة", "شرشال"] },
    { code: "43", name: "ميلة", homeCost: 600, officeCost: 400, communes: ["ميلة", "شلغوم العيد", "فرجيوة"] },
    { code: "44", name: "عين الدفلى", homeCost: 600, officeCost: 400, communes: ["عين الدفلى", "خميس مليانة"] },
    { code: "45", name: "النعامة", homeCost: 800, officeCost: 500, communes: ["النعامة", "المشرية"] },
    { code: "46", name: "عين تموشنت", homeCost: 650, officeCost: 400, communes: ["عين تموشنت", "بني صاف"] },
    { code: "47", name: "غرداية", homeCost: 750, officeCost: 450, communes: ["غرداية", "القرارة", "متليلي"] },
    { code: "48", name: "غليزان", homeCost: 650, officeCost: 400, communes: ["غليزان", "وادي ارهيو"] }
];

// Global App States
let WILAYAS = [...DEFAULT_WILAYAS];
let bannerMessages = [];
let heroSlides = [];
let categories = [];
let brands = [];
let products = [];
let orders = [];
let cart = JSON.parse(localStorage.getItem('lb_cart_v7')) || [];
let favorites = JSON.parse(localStorage.getItem('lb_favs_v7')) || [];

let storeSettings = {
    name: 'كوسمتيك عبد الحق',
    slogan: 'يبدو أن أحدهم سينام سعيداً اليوم',
    logoUrl: '',
    pass: 'admin123',
    msgSuccess: 'تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.',
    msgWarning: 'يرجى ملء كافة معلومات الاستمارة الضرورية!'
};

// Realtime Firebase Listeners
function initFirebaseRealtime() {
    db.collection("products").onSnapshot((snapshot) => {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof applyFilters === 'function') applyFilters();
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    db.collection("categories").onSnapshot((snapshot) => {
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    db.collection("brands").onSnapshot((snapshot) => {
        brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof populateAdminDropdowns === 'function') populateAdminDropdowns();
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    db.collection("orders").onSnapshot((snapshot) => {
        orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    db.collection("banners").onSnapshot((snapshot) => {
        bannerMessages = snapshot.docs.map(doc => doc.data().text);
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    db.collection("heroSlides").onSnapshot((snapshot) => {
        heroSlides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderHeroSlider === 'function') renderHeroSlider();
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    db.collection("wilayas").onSnapshot((snapshot) => {
        const fetchedWilayas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (fetchedWilayas.length > 0) {
            WILAYAS = fetchedWilayas;
        } else {
            WILAYAS = [...DEFAULT_WILAYAS];
        }
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
        if (typeof populateWilayas === 'function') populateWilayas();
        if (typeof populateCartWilayas === 'function') populateCartWilayas();
    });

    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            storeSettings = { ...storeSettings, ...doc.data() };
            if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
            if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
        }
    });
}

initFirebaseRealtime();
