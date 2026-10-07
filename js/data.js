// Algerian Wilayas Data & Delivery Pricing
const WILAYAS = [
    { code: '16', name: 'الجزائر العاصمة', communes: ['سيدي امحمد', 'باب الوادي', 'الشراقة', 'بئر خادم'], homeCost: 400, officeCost: 200 },
    { code: '31', name: 'وهران', communes: ['وهران', 'بئر الجير', 'السانية'], homeCost: 600, officeCost: 300 },
    { code: '19', name: 'سطيف', communes: ['سطيف', 'العلمة', 'عين أرنات'], homeCost: 600, officeCost: 300 },
    { code: '25', name: 'قسنطينة', communes: ['قسنطينة', 'الخروب', 'زيغود يوسف'], homeCost: 600, officeCost: 300 },
    { code: '17', name: 'الجلفة', communes: ['الجلفة', 'عين وسارة', 'مسعد'], homeCost: 700, officeCost: 400 }
];

// Persistent Settings State
let storeSettings = JSON.parse(localStorage.getItem('lb_settings')) || {
    name: 'Luxe Beauty',
    logoUrl: '',
    email: 'contact@luxebeauty.com',
    pass: 'admin123'
};

let categories = JSON.parse(localStorage.getItem('lb_categories')) || ['الرئيسية', 'المنتجات', 'العطور', 'المكياج', 'الهدايا'];

let products = JSON.parse(localStorage.getItem('lb_products')) || [
    { id: 1, name: 'عطر ميس ديور أو دو بارفان', price: 5900, oldPrice: 6900, category: 'العطور', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500', desc: 'عطر أنثوي فاخر يجمع بين نفحات الزهور والفاكهة مع لمسة من المسك.' },
    { id: 2, name: 'أحمر شفاه مايبيلين', price: 1900, oldPrice: 2200, category: 'المكياج', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500', desc: 'لون ثابت ومظهر مخملي يناسب جميع الإطلالات.' },
    { id: 3, name: 'كريم أساس لوريال باريس', price: 2890, oldPrice: 3200, category: 'المكياج', image: 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=500', desc: 'تغطية مثالية تدوم طوال اليوم لبشرة متألقة.' },
    { id: 4, name: 'بوكس مكياج فاخر', price: 8500, oldPrice: 9800, category: 'الهدايا', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500', desc: 'مجموعة متكاملة ومغلفة بشكل راقٍ ومميز جداً.' }
];

let orders = JSON.parse(localStorage.getItem('lb_orders')) || [];
let cart = [];
