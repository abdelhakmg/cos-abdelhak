// js/data.js - قاعدة البيانات والتهيئة

let storeSettings = {
    name: 'كوسمتيك عبد الحق',
    slogan: 'يبدو أن أحدهم سيغدو سعيداً اليوم'
};

let products = [
    {
        id: 'prod_1',
        name: 'عطر ديور سوفاج فاخر (100ml)',
        price: 8500,
        oldPrice: 11000,
        category: 'عطور',
        inStock: true,
        desc: 'عطر رجالي راقي ومركز يدوم طويلاً برائحة خشبية وأصيلة.',
        images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600']
    },
    {
        id: 'prod_2',
        name: 'مجموعة العناية الفائقة بالبشرة',
        price: 4200,
        oldPrice: 5500,
        category: 'عناية بالبشرة',
        inStock: true,
        desc: 'مجموعة ترطيب وتغذية كاملة للبشرة لنضارة طوال اليوم.',
        images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600']
    }
];

let WILAYAS = [
    { code: "01", name: "أدرار", homeCost: 900, officeCost: 500, communes: ["أدرار", "تامست", "فنوغيل"] },
    { code: "16", name: "الجزائر", homeCost: 500, officeCost: 300, communes: ["الجزائر الوسطى", "باب الوادي", "حيدرة", "الشراقة"] },
    { code: "23", name: "عنابة", homeCost: 600, officeCost: 400, communes: ["عنابة", "البوني", "الحجار"] },
    { code: "31", name: "وهران", homeCost: 600, officeCost: 400, communes: ["وهران", "بئر الجير", "السانية"] }
];

let orders = [
    { customer: "أحمد بن علي", wilaya: "عنابة", product: "عطر ديور سوفاج", total: 9100 },
    { customer: "سارة الجزائرية", wilaya: "الجزائر", product: "مجموعة العناية بالبشرة", total: 4700 },
    { customer: "ياسين كريم", wilaya: "وهران", product: "عطر ديور سوفاج", total: 9100 }
];

let cart = JSON.parse(localStorage.getItem('lb_cart_v7')) || [];
let favorites = JSON.parse(localStorage.getItem('lb_favs_v7')) || [];
