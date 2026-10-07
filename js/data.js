// Algerian Wilayas Data
const WILAYAS = [
    { code: '16', name: 'الجزائر العاصمة', communes: ['سيدي امحمد', 'باب الوادي', 'الشراقة'], homeCost: 400, officeCost: 200 },
    { code: '31', name: 'وهران', communes: ['وهران', 'بئر الجير', 'السانية'], homeCost: 600, officeCost: 300 },
    { code: '19', name: 'سطيف', communes: ['سطيف', 'العلمة'], homeCost: 600, officeCost: 300 },
    { code: '17', name: 'الجلفة', communes: ['الجلفة', 'عين وسارة'], homeCost: 700, officeCost: 400 }
];

// Initial App State
let storeSettings = JSON.parse(localStorage.getItem('lb_settings')) || {
    name: 'Luxe Beauty',
    pass: 'admin123'
};

let categories = JSON.parse(localStorage.getItem('lb_categories')) || ['الرئيسية', 'المنتجات', 'العطور', 'المكياج', 'الهدايا'];

let products = JSON.parse(localStorage.getItem('lb_products')) || [
    { id: 1, name: 'عطر ميس ديور أو دو بارفان', price: 5900, oldPrice: 6900, category: 'العطور', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500', desc: 'عطر أنثوي فاخر يجمع بين نفحات الزهور والفاكهة.' },
    { id: 2, name: 'أحمر شفاه مايبيلين', price: 1900, oldPrice: 2200, category: 'المكياج', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500', desc: 'لون ثابت ومظهر مخملي جذاب.' }
];

let orders = JSON.parse(localStorage.getItem('lb_orders')) || [];
