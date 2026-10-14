// --- ملف js/ui.js ---

import { state, saveFavsToLocal } from './store/state.js';
import { formatPrice, safeCall, showCustomAlert } from './utils/helpers.js';

// 1. تصميم ورسم بطاقة المنتج (Product Card)
export function renderSingleProductCard(p) {
    let displayImg = (p.images && p.images[0]) || p.image || 'https://via.placeholder.com/300';
    const isFav = state.favorites.includes(p.id);

    return `
        <div class="bg-white text-gray-900 rounded-2xl border p-4 text-right flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all duration-300 transform hover:-translate-y-2 group relative">
            <button onclick="event.stopPropagation(); toggleFavorite('${p.id}');" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm cursor-pointer">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>

            <div class="cursor-pointer" onclick="safeCall('openLandingPage', '${p.id}')">
                <div class="h-48 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center overflow-hidden">
                    <img src="${displayImg}" loading="lazy" class="max-h-full object-contain group-hover:scale-105 transition duration-500">
                </div>
                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="w-2 h-2 rounded-full ${p.inStock !== false ? 'bg-green-500 animate-ping' : 'bg-red-500'}"></span>
                    <span class="text-[10px] font-bold ${p.inStock !== false ? 'text-green-600' : 'text-red-500'}">${p.inStock !== false ? 'متوفر' : 'غير متوفر'}</span>
                </div>
                <h3 class="font-bold text-sm text-gray-900 truncate my-1 group-hover:text-[#B8860B] transition">${p.name || 'منتج'}</h3>
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-black text-base text-[#B8860B]">${formatPrice(p.price)}</span>
                    ${p.oldPrice ? `<span class="text-xs text-gray-400 line-through">${formatPrice(p.oldPrice)}</span>` : ''}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <button onclick="event.stopPropagation(); addToCart('${p.id}');" class="w-full py-2.5 bg-black text-white hover:bg-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف إلى السلة
                </button>
                <button onclick="event.stopPropagation(); safeCall('openLandingPage', '${p.id}');" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition cursor-pointer">
                    اطلب الآن 🔥
                </button>
            </div>
        </div>
    `;
}

// 2. عرض المنتجات في الصفحة الرئيسية (الأكثر مبيعاً)
export function renderProducts() {
    const grid = document.getElementById('home-products');
    if (!grid) return;

    let bestSellers = [...state.products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8);
    grid.innerHTML = bestSellers.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">جاري تحميل المنتجات...</p>' : 
        bestSellers.map(renderSingleProductCard).join('');
}

// 3. نظام المفضلة (Wishlist)
export function toggleFavorite(id) {
    if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(favId => favId !== id);
    } else {
        state.favorites.push(id);
    }
    saveFavsToLocal();
    safeCall('updateBadges');
    renderProducts();
    const activePage = document.querySelector('.page-sec.active');
    if (activePage && activePage.id === 'page-wishlist') {
        safeCall('renderWishlistPage');
    }
}

export function renderWishlistPage() {
    const grid = document.getElementById('wishlist-products-grid');
    if (!grid) return;
    const favProducts = state.products.filter(p => state.favorites.includes(p.id));
    grid.innerHTML = favProducts.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">لم تقم بإضافة أي منتج للمفضلة بعد.</p>' : 
        favProducts.map(renderSingleProductCard).join('');
}

// 4. نظام البحث المباشر السريع (Live Search)
export function handleLiveSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    
    const q = query.trim().toLowerCase();
    if (!q) {
        if (dropdown) dropdown.classList.add('hidden');
        if (mobileDropdown) mobileDropdown.classList.add('hidden');
        return;
    }

    const matches = state.products.filter(p => {
        const skinsStr = Array.isArray(p.skinTypes) ? p.skinTypes.join(' ') : (p.skinType || '');
        const hairsStr = Array.isArray(p.hairTypes) ? p.hairTypes.join(' ') : (p.hairType || '');
        
        return (p.name && p.name.toLowerCase().includes(q)) || 
               (p.category && p.category.toLowerCase().includes(q)) ||
               (p.brand && p.brand.toLowerCase().includes(q)) ||
               skinsStr.toLowerCase().includes(q) ||
               hairsStr.toLowerCase().includes(q);
    }).slice(0, 5);

    let htmlContent = '';
    if (matches.length === 0) {
        htmlContent = '<div class="p-4 text-xs text-amber-400 text-center">المنتج غير متوفر، تأكد من البحث يدوياً في الفئات.</div>';
    } else {
        htmlContent = matches.map(p => `
            <div onclick="safeCall('openLandingPage', '${p.id}'); hideAllDropdowns();" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || p.image || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black" loading="lazy">
                <div class="text-right">
                    <p class="text-xs font-bold text-white truncate">${p.name}</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">${formatPrice(p.price)}</p>
                </div>
            </div>
        `).join('');
    }

    if (dropdown) { dropdown.innerHTML = htmlContent; dropdown.classList.remove('hidden'); }
    if (mobileDropdown) { mobileDropdown.innerHTML = htmlContent; mobileDropdown.classList.remove('hidden'); }
}

export function hideAllDropdowns() {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (mobileDropdown) mobileDropdown.classList.add('hidden');
}

// 5. ربط الدوال بالواجهة
window.renderSingleProductCard = renderSingleProductCard;
window.renderProducts = renderProducts;
window.toggleFavorite = toggleFavorite;
window.renderWishlistPage = renderWishlistPage;
window.handleLiveSearch = handleLiveSearch;
window.hideAllDropdowns = hideAllDropdowns;
// --- تابع لملف js/ui.js (وظائف الأقسام والفلاتر والبانر) ---

window.activeCategoryFilter = 'جميع المنتجات';
window.currentHeroIdx = 0;

// 1. رسم الأقسام في القائمة العلوية والجانبية والصفحة الرئيسية
export function updateAppHeaderInfo() {
    const navEl = document.getElementById('header-nav');
    if (navEl) {
        navEl.innerHTML = `<button onclick="safeCall('filterCategory', 'جميع المنتجات')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">جميع المنتجات</button>` 
            + state.categories.map(c => `<button onclick="safeCall('filterCategory', '${c.name}')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">${c.name}</button>`).join('');
    }

    const mobileListEl = document.getElementById('mobile-drawer-categories');
    if (mobileListEl) {
        mobileListEl.innerHTML = `<button onclick="safeCall('showPage', 'home'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-[#D4AF37] font-bold mb-2">الرئيسية</button>
            <button onclick="safeCall('filterCategory', 'جميع المنتجات'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-white font-bold mb-2">جميع المنتجات</button>` 
            + state.categories.map(c => `<button onclick="safeCall('filterCategory', '${c.name}'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-gray-200 hover:text-[#D4AF37] font-bold mb-2">${c.name}</button>`).join('');
    }

    const homeCatGrid = document.getElementById('home-category-cards');
    if (homeCatGrid) {
        homeCatGrid.innerHTML = state.categories.map(c => `
            <div onclick="safeCall('filterCategory', '${c.name}')" class="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl p-4 text-center cursor-pointer hover:border-[#D4AF37] transition flex flex-col items-center justify-center space-y-2 shadow-lg group">
                <div class="w-14 h-14 rounded-2xl p-0.5 gold-gradient overflow-hidden shadow-md group-hover:scale-105 transition">
                    <img src="${c.image}" class="w-full h-full object-cover rounded-xl bg-black" loading="lazy">
                </div>
                <h3 class="text-white font-bold text-sm tracking-wide group-hover:text-[#D4AF37]">${c.name}</h3>
            </div>
        `).join('');
    }
}

// 2. التحكم في القائمة الجانبية للهاتف
export function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

// 3. فلترة المنتجات حسب القسم عند الضغط عليه
export function filterCategory(catName) {
    window.activeCategoryFilter = catName.trim();
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = window.activeCategoryFilter;

    safeCall('applyFilters');
    safeCall('showPage', 'catalog');
}

// 4. تطبيق الفلاتر وعرض النتائج في صفحة "جميع المنتجات"
export function applyFilters() {
    if (!state.products) return;
    let filtered = [...state.products];

    // فلترة حسب القسم
    if (window.activeCategoryFilter && window.activeCategoryFilter !== 'جميع المنتجات') {
        const targetCat = window.activeCategoryFilter.toLowerCase();
        filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(targetCat));
    }

    // فلترة المتوفر في المخزون فقط
    const inStockOnly = document.getElementById('filter-in-stock-only')?.checked;
    if (inStockOnly) {
        filtered = filtered.filter(p => p.inStock === true);
    }

    const catalogGrid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    if (badge) badge.innerText = filtered.length;

    if (catalogGrid) {
        catalogGrid.innerHTML = filtered.length === 0 ? 
            '<div class="col-span-full text-center py-16 space-y-3"><i class="fa-solid fa-box-open text-4xl text-gray-600"></i><p class="text-gray-400 text-sm">لا توجد منتجات مطابقة لهذا القسم حالياً.</p><button onclick="safeCall(\'filterCategory\', \'جميع المنتجات\')" class="text-xs text-[#D4AF37] underline font-bold cursor-pointer">عرض جميع المنتجات</button></div>' :
            filtered.map(renderSingleProductCard).join('');
    }
}

// 5. رسم البانر الإعلاني (Hero Slider)
export function renderHeroSlider() {
    const container = document.getElementById('hero-slider-container');
    const dotsContainer = document.getElementById('hero-slider-dots');
    if (!container || !state.heroSlides || state.heroSlides.length === 0) return;

    const currentSlide = state.heroSlides[window.currentHeroIdx];

    container.innerHTML = `
        <div class="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden group shadow-2xl border border-[#D4AF37]/30">
            <img src="${currentSlide.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-center items-center text-center p-6 md:p-12 transition-opacity duration-500 group-hover:opacity-0 pointer-events-none">
                <span class="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold mb-4 backdrop-blur-md">✨ التشكيلة الحصرية</span>
                <h1 class="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-2xl">${currentSlide.title}</h1>
                <p class="text-gray-200 text-sm md:text-lg mb-6 drop-shadow-lg">${currentSlide.desc}</p>
                <button onclick="safeCall('filterCategory', 'جميع المنتجات')" class="pointer-events-auto px-8 py-3.5 gold-gradient text-black font-extrabold rounded-full shadow-xl hover:scale-105 transition cursor-pointer">تسوقي الآن 🔥</button>
            </div>
        </div>
    `;

    if (dotsContainer) {
        dotsContainer.innerHTML = state.heroSlides.map((_, idx) => `
            <button onclick="safeCall('setHeroSlide', ${idx})" class="h-2.5 rounded-full transition-all duration-300 ${idx === window.currentHeroIdx ? 'bg-[#D4AF37] w-8' : 'bg-gray-600 w-2.5'}"></button>
        `).join('');
    }
}

export function setHeroSlide(idx) {
    window.currentHeroIdx = idx;
    renderHeroSlider();
}

// 6. ربط الدوال الجديدة بالواجهة لتعمل الأزرار
window.updateAppHeaderInfo = updateAppHeaderInfo;
window.toggleMobileMenu = toggleMobileMenu;
window.filterCategory = filterCategory;
window.applyFilters = applyFilters;
window.renderHeroSlider = renderHeroSlider;
window.setHeroSlide = setHeroSlide;
