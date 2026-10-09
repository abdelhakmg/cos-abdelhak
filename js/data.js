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
    passHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 for default admin123
    metaPixelId: ''
};

// Meta Pixel Initialization Dynamic Helper
function initMetaPixel(pixelId) {
    if (!pixelId || window.fbq) return;
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', pixelId);
    fbq('track', 'PageView');
}

function trackPixelEvent(eventName, params = {}) {
    if (window.fbq) {
        fbq('track', eventName, params);
    }
}

// Simple Helper Hash Function (SHA-256)
async function hashPassword(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
            storeSettings = { ...storeSettings, ...doc.data() };
            if (storeSettings.metaPixelId) {
                initMetaPixel(storeSettings.metaPixelId);
            }
            if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
            if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
        }
    });
}

initFirebaseRealtime();
