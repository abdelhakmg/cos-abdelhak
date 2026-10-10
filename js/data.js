// js/data.js - قاعدة البيانات والتهيئة الرئيسية للمتجر

let storeSettings = {
    name: 'كوسمتيك عبد الحق',
    slogan: 'يبدو أن أحدهم سيغدو سعيداً اليوم',
    logoUrl: '',
    metaPixelId: ''
};

let bannerMessages = [
    "🚚 التوصيل متوفر لجميع الولايات والدفع عند الاستلام",
    "✨ منتجات أصلية 100% وبأفضل الأسعار",
    "🎁 هدايا وعروض حصرية بمناسبة الافتتاح"
];

let heroSlides = [
    {
        title: "كوسمتيك عبد الحق - الفخامة والأناقة",
        desc: "أفضل منتجات التجميل والعناية بالبشرة الأصلية بين يديك",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200"
    },
    {
        title: "عروض خاصة وعطور فاخرة",
        desc: "توصيل سريع لـ 58 ولاية والدفع عند الاستلام",
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200"
    }
];

let categories = [
    { id: '1', name: 'عطور', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=300' },
    { id: '2', name: 'مكياج', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=300' },
    { id: '3', name: 'عناية بالبشرة', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=300' },
    { id: '4', name: 'عناية بالشعر', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=300' }
];

let brands = [
    { id: '1', name: 'Dior' },
    { id: '2', name: 'Chanel' },
    { id: '3', name: 'L\'Oréal' },
    { id: '4', name: 'Nivea' }
];

let products = [
    {
        id: 'prod_1',
        name: 'عطر ديور سوفاج فاخر (100ml)',
        price: 8500,
        oldPrice: 11000,
        category: 'عطور',
        brand: 'Dior',
        inStock: true,
        desc: 'عطر رجالي راقي ومركز يدوم طويلاً برائحة خشبية وأصيلة.',
        images: [
            'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600'
        ]
    },
    {
        id: 'prod_2',
        name: 'مجموعة العناية الفائقة بالبشرة',
        price: 4200,
        oldPrice: 5500,
        category: 'عناية بالبشرة',
        brand: 'L\'Oréal',
        inStock: true,
        desc: 'مجموعة ترطيب وتغذية كاملة للبشرة لنضارة طوال اليوم.',
        images: [
            'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600'
        ]
    }
];

let WILAYAS = [
    { code: "01", name: "أدرار", homeCost: 900, officeCost: 500, communes: ["أدرار", "تامست", "فنوغيل"] },
    { code: "16", name: "الجزائر", homeCost: 500, officeCost: 300, communes: ["الجزائر الوسطى", "باب الوادي", "حيدرة", "الشراقة"] },
    { code: "23", name: "عنابة", homeCost: 600, officeCost: 400, communes: ["عنابة", "البوني", "الحجار"] },
    { code: "31", name: "وهران", homeCost: 600, officeCost: 400, communes: ["وهران", "بئر الجير", "السانية"] }
];

let orders = [
    { id: '1', customer: "أحمد بن علي", phone: "0661234567", wilaya: "عنابة", commune: "البوني", product: "عطر ديور سوفاج", total: 9100, status: "جديد" },
    { id: '2', customer: "سارة الجزائرية", phone: "0559876543", wilaya: "الجزائر", commune: "حيدرة", product: "مجموعة العناية بالبشرة", total: 4700, status: "مؤكد" },
    { id: '3', customer: "ياسين كريم", phone: "0770112233", wilaya: "وهران", commune: "بئر الجير", product: "عطر ديور سوفاج", total: 9100, status: "مكتملاً" }
];

let cart = JSON.parse(localStorage.getItem('lb_cart_v7')) || [];
let favorites = JSON.parse(localStorage.getItem('lb_favs_v7')) || [];

// تهيئة Firebase الاحتياطية بدون التسبب في إيقاف الموقع
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyDummyKey",
            authDomain: "store.firebaseapp.com",
            projectId: "store",
            storageBucket: "store.appspot.com",
            messagingSenderId: "123456789",
            appId: "1:123456789:web:abc"
        };
        firebase.initializeApp(firebaseConfig);
        var db = firebase.firestore();
    } catch(e) {
        console.log('Firebase fallback mode enabled');
    }
}
