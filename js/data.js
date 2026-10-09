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

// Global App States
let WILAYAS = [];
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
    socialFb: '',
    socialIg: '',
    socialWa: '',
    socialPhone: '',
    socialEmail: '',
    metaPixel: ''
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
        WILAYAS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            storeSettings = doc.data();
            if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
            if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
            if (typeof injectMetaPixel === 'function') injectMetaPixel();
        }
    });
}

initFirebaseRealtime();
