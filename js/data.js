// Firebase Configuration extracted directly from your project credentials
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
let products = [];
let orders = [];
let cart = JSON.parse(localStorage.getItem('lb_cart_v6')) || [];
let favorites = JSON.parse(localStorage.getItem('lb_favs_v6')) || [];

let storeSettings = {
    name: 'كوسمتيك عبد الحق',
    slogan: 'يبدو أن أحدهم سينام سعيداً اليوم',
    logoUrl: '',
    pass: 'admin123'
};

// Realtime Firebase Listeners (التزامن اللحظي بين كافة الأجهزة)
function initFirebaseRealtime() {
    // Products Realtime
    db.collection("products").onSnapshot((snapshot) => {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderProducts === 'function') renderProducts();
        if (typeof applyFilters === 'function') applyFilters();
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    // Categories Realtime
    db.collection("categories").onSnapshot((snapshot) => {
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    // Orders Realtime
    db.collection("orders").onSnapshot((snapshot) => {
        orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    // Top Banners Realtime
    db.collection("banners").onSnapshot((snapshot) => {
        bannerMessages = snapshot.docs.map(doc => doc.data().text);
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    // Hero Slides Realtime
    db.collection("heroSlides").onSnapshot((snapshot) => {
        heroSlides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderHeroSlider === 'function') renderHeroSlider();
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    // Wilayas Realtime
    db.collection("wilayas").onSnapshot((snapshot) => {
        WILAYAS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    });

    // Settings Realtime
    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists) {
            storeSettings = doc.data();
            if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
            if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
        }
    });
}

initFirebaseRealtime();
