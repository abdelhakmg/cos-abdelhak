// Wilayas Data Engine
let WILAYAS = JSON.parse(localStorage.getItem('lb_wilayas_v5')) || [
    { code: '16', name: 'الجزائر العاصمة', communes: ['سيدي امحمد', 'باب الوادي', 'الشراقة', 'بئر خادم'], homeCost: 400, officeCost: 200 },
    { code: '31', name: 'وهران', communes: ['وهران', 'بئر الجير', 'السانية'], homeCost: 600, officeCost: 300 },
    { code: '19', name: 'سطيف', communes: ['سطيف', 'العلمة', 'عين أرنات'], homeCost: 600, officeCost: 300 },
    { code: '25', name: 'قسنطينة', communes: ['قسنطينة', 'الخروب', 'زيغود يوسف'], homeCost: 600, officeCost: 300 },
    { code: '17', name: 'الجلفة', communes: ['الجلفة', 'عين وسارة', 'مسعد'], homeCost: 700, officeCost: 400 }
];

// Top Yellow Banner Messages
let bannerMessages = JSON.parse(localStorage.getItem('lb_banners_v5')) || [
    "🚚 التوصيل متوفر لجميع الولايات والدفع عند الاستلام 100% مضمون",
    "✨ عروض حصريّة وخاصة هذا الأسبوع - كوسمتيك عبد الحق",
    "❤️ يبدو أن أحدهم سينام سعيداً اليوم..."
];

// Hero Slider Ads List
let heroSlides = JSON.parse(localStorage.getItem('lb_hero_slides_v5')) || [
    {
        title: "اكتشفي لمستك الخاصة",
        desc: "عطور • جمال • هدايا • عناية ... كل ما تحتاجينه لإطلالة ساحرة ومثالية",
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500"
    }
];

// Store Settings
let storeSettings = JSON.parse(localStorage.getItem('lb_settings_v5')) || {
    name: 'كوسمتيك عبد الحق',
    slogan: 'يبدو أن أحدهم سينام سعيداً اليوم',
    logoUrl: '',
    pass: 'admin123'
};

// Categories Store
let categories = JSON.parse(localStorage.getItem('lb_categories_v5')) || [
    { name: 'مكياج الوجه', image: 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=300' },
    { name: 'مكياج العيون', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300' },
    { name: 'مكياج الشفاه', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
    { name: 'مستحضرات التجميل', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300' }
];

// Products Base (مع التوفر المضيء + العلامات التجارية + أزرار الإضافة للسلة والطلب السريع)
let products = JSON.parse(localStorage.getItem('lb_products_v5')) || [
    { 
        id: 1, 
        name: 'كريم أساس لوريال باريس', 
        price: 2890, 
        oldPrice: 3200, 
        category: 'مكياج الوجه', 
        brand: "L'Oréal",
        inStock: true,
        images: ['https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=500'], 
        desc: 'تغطية مثالية تدوم طوال اليوم لبشرة متألقة.' 
    },
    { 
        id: 2, 
        name: 'أحمر شفاه مايبيلين', 
        price: 1900, 
        oldPrice: 2200, 
        category: 'مكياج الشفاه', 
        brand: "Maybelline",
        inStock: true,
        images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500'], 
        desc: 'لون ثابت ومظهر مخملي يناسب جميع الإطلالات.' 
    },
    { 
        id: 3, 
        name: 'ماسكارا لانكوم', 
        price: 2690, 
        oldPrice: 2900, 
        category: 'مكياج العيون', 
        brand: "NYX",
        inStock: true,
        images: ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500'], 
        desc: 'كثافة وطول استثنائي للرموش.' 
    },
    { 
        id: 4, 
        name: 'بودرة مضغوطة', 
        price: 1850, 
        oldPrice: 2100, 
        category: 'مكياج الوجه', 
        brand: "Essence",
        inStock: false,
        images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500'], 
        desc: 'مظهر طبيعي بدون تكتل.' 
    }
];

let orders = JSON.parse(localStorage.getItem('lb_orders_v5')) || [];
let cart = JSON.parse(localStorage.getItem('lb_cart_v5')) || [];
let favorites = JSON.parse(localStorage.getItem('lb_favs_v5')) || [];
