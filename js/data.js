// Algerian Wilayas & Communes Pricing Engine
let WILAYAS = JSON.parse(localStorage.getItem('lb_wilayas')) || [
    { code: '16', name: 'الجزائر العاصمة', communes: ['سيدي امحمد', 'باب الوادي', 'الشراقة', 'بئر خادم'], homeCost: 400, officeCost: 200 },
    { code: '31', name: 'وهران', communes: ['وهران', 'بئر الجير', 'السانية'], homeCost: 600, officeCost: 300 },
    { code: '19', name: 'سطيف', communes: ['سطيف', 'العلمة', 'عين أرنات'], homeCost: 600, officeCost: 300 },
    { code: '25', name: 'قسنطينة', communes: ['قسنطينة', 'الخروب', 'زيغود يوسف'], homeCost: 600, officeCost: 300 },
    { code: '17', name: 'الجلفة', communes: ['الجلفة', 'عين وسارة', 'مسعد'], homeCost: 700, officeCost: 400 }
];

// Dynamic Top Yellow Ticker Messages
let bannerMessages = JSON.parse(localStorage.getItem('lb_banners')) || [
    "🚚 التوصيل متوفر لجميع الولايات والدفع عند الاستلام 100% مضمون",
    "✨ عروض حصريّة وخاصة هذا الأسبوع - كوسمتيك عبد الحق",
    "❤️ يبدو أن أحدهم سينام سعيداً اليوم..."
];

// Store Full Settings
let storeSettings = JSON.parse(localStorage.getItem('lb_settings')) || {
    name: 'كوسمتيك عبد الحق',
    slogan: 'يبدو أن أحدهم سينام سعيداً اليوم',
    logoUrl: '',
    phone: '0655000000',
    whatsapp: '0655000000',
    instagram: 'abdelhak_cosmetics',
    facebook: 'abdelhak.cosmetics',
    pass: 'admin123'
};

// Categories Store (مع الصور)
let categories = JSON.parse(localStorage.getItem('lb_categories_v2')) || [
    { name: 'العطور', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300' },
    { name: 'المكياج', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
    { name: 'الهدايا', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300' }
];

// Products Database (تستوعب 5 صور لكل منتج)
let products = JSON.parse(localStorage.getItem('lb_products_v2')) || [
    { 
        id: 1, 
        name: 'عطر ميس ديور أو دو بارفان', 
        price: 5900, 
        oldPrice: 6900, 
        category: 'العطور', 
        images: [
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500',
            'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
            'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500',
            'https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=500'
        ], 
        desc: 'عطر أنثوي فاخر يجمع بين نفحات الزهور والفاكهة مع لمسة من المسك.' 
    },
    { 
        id: 2, 
        name: 'أحمر شفاه مايبيلين', 
        price: 1900, 
        oldPrice: 2200, 
        category: 'المكياج', 
        images: [
            'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500'
        ], 
        desc: 'لون ثابت ومظهر مخملي يناسب جميع الإطلالات.' 
    }
];

let orders = JSON.parse(localStorage.getItem('lb_orders')) || [];
let cart = [];
