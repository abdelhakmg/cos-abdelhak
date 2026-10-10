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

// قائمة افتراضية دقيقة للولايات والبلديات مع تسعير مستقل للمكتب ولكل بلدية
const DEFAULT_WILAYAS = [
    { 
        code: "17", 
        name: "الجلفة", 
        officeCost: 800, 
        communesData: [
            { name: "الجلفة (المركز)", cost: 400 },
            { name: "دار الشيوخ", cost: 500 },
            { name: "عين المعبد", cost: 300 },
            { name: "حاسي بحبح", cost: 450 },
            { name: "مسعد", cost: 500 },
            { name: "عين وسارة", cost: 500 }
        ]
    },
    { 
        code: "16", 
        name: "الجزائر العاصمة", 
        officeCost: 300, 
        communesData: [
            { name: "الجزائر الوسطى", cost: 400 },
            { name: "باب الزوار", cost: 400 },
            { name: "الشراقة", cost: 450 },
            { name: "الرويبة", cost: 450 }
        ]
    },
    { 
        code: "31", 
        name: "وهران", 
        officeCost: 400, 
        communesData: [
            { name: "وهران المركز", cost: 500 },
            { name: "السانية", cost: 550 },
            { name: "أرزيو", cost: 600 }
        ]
    }
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
    msgWarning: 'يرجى إدخال اسمك ورقم هاتف جزائري صحيح مكون من 10 أرقام (05/06/07) واختيار الولاية!'
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
