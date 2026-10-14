// --- ملف js/ui.js ---

import { state, saveFavsToLocal } from './store/state.js';
import { formatPrice, safeCall, showCustomAlert } from './utils/helpers.js';

window.activeCategoryFilter = 'جميع المنتجات';
window.currentHeroIdx = 0;

// ==========================================
// 1. رسم المنتجات والبطاقات
// ==========================================
export function renderSingleProductCard(p) {
    let displayImg = (p.images && p.images[0]) || p.image || 'https://via.placeholder.com/300';
    const isFav = state.favorites.includes(p.id);

    return `
        <div class="bg-white text-gray-900 rounded-2xl border p-4 text-right flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all duration-300 transform hover:-translate-y-2 group relative">
            <button onclick="event.stopPropagation(); safeCall('toggleFavorite', '${p.id}');" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm cursor-pointer">
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
                <button onclick="event.stopPropagation(); safeCall('addToCart', '${p.id}');" class="w-full py-2.5 bg-black text-white hover:bg-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف إلى السلة
                </button>
                <button onclick="event.stopPropagation(); safeCall('openLandingPage', '${p.id}');" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition cursor-pointer">
                    اطلب الآن 🔥
                </button>
            </div>
        </div>
    `;
}

export function renderProducts() {
    const grid = document.getElementById('home-products');
    if (!grid) return;
    let bestSellers = [...state.products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8);
    grid.innerHTML = bestSellers.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">جاري تحميل المنتجات...</p>' : 
        bestSellers.map(renderSingleProductCard).join('');
}

// ==========================================
// 2. القوائم والأقسام العلوية والجانبية
// ==========================================
export function updateAppHeaderInfo() {
    const navEl = document.getElementById('header-nav');
    if (navEl) {
        navEl.innerHTML = `<button onclick="safeCall('filterCategory', 'جميع المنتجات')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">جميع المنتجات</button>` + 
            state.categories.map(c => `<button onclick="safeCall('filterCategory', '${c.name}')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">${c.name}</button>`).join('');
    }

    const mobileListEl = document.getElementById('mobile-drawer-categories');
    if (mobileListEl) {
        mobileListEl.innerHTML = `<button onclick="safeCall('showPage', 'home'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-[#D4AF37] font-bold mb-2">الرئيسية</button>
            <button onclick="safeCall('filterCategory', 'جميع المنتجات'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-white font-bold mb-2">جميع المنتجات</button>` + 
            state.categories.map(c => `<button onclick="safeCall('filterCategory', '${c.name}'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-gray-200 hover:text-[#D4AF37] font-bold mb-2">${c.name}</button>`).join('');
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

export function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

// ==========================================
// 3. نظام البحث المباشر
// ==========================================
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
               skinsStr.toLowerCase().includes(q) || hairsStr.toLowerCase().includes(q);
    }).slice(0, 5);

    let htmlContent = matches.length === 0 ? 
        '<div class="p-4 text-xs text-amber-400 text-center">المنتج غير متوفر، تأكد من البحث عنه يدويا من الفئات.</div>' : 
        matches.map(p => `
            <div onclick="safeCall('openLandingPage', '${p.id}'); safeCall('hideAllDropdowns');" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || p.image || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black" loading="lazy">
                <div class="text-right">
                    <p class="text-xs font-bold text-white truncate">${p.name}</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">${formatPrice(p.price)}</p>
                </div>
            </div>
        `).join('');

    if (dropdown) { dropdown.innerHTML = htmlContent; dropdown.classList.remove('hidden'); }
    if (mobileDropdown) { mobileDropdown.innerHTML = htmlContent; mobileDropdown.classList.remove('hidden'); }
}

export function hideAllDropdowns() {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (mobileDropdown) mobileDropdown.classList.add('hidden');
}

// ==========================================
// 4. الفلاتر والتصنيفات (المفقودة مسبقاً)
// ==========================================
export function filterCategory(catName) {
    window.activeCategoryFilter = catName.trim();
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = window.activeCategoryFilter;

    renderDynamicSidebarFilters();
    applyFilters();
    safeCall('showPage', 'catalog');
}

export function renderDynamicSidebarFilters() {
    const dynamicContainer = document.getElementById('dynamic-category-filters');
    if (!dynamicContainer) return;

    const activeCat = (window.activeCategoryFilter || 'جميع المنتجات').trim().toLowerCase();
    let html = '';

    const shapes = ["شكل قلب", "شكل مربع", "شكل مستطيل", "شكل رسالة", "شكل دائري", "علب فوركس", "علب زجاج", "صاك كرتون", "صاك شفاف", "PMMA"];
    const makeups = ["فوندوتان", "كونسيلر", "ماسكارا", "طراسور", "روج لافر", "قلوص", "هايلايتر", "كونتور", "بالات", "برايمر", "ليوناغ", "فرشاة", "بونجة", "آلات", "أشفار", "أظافر", "لسقة أشفار", "لسقة أظافر", "فلامينغو", "فارني", "أخرى"];
    const perfumes = ["نساء", "رجال", "أطفال", "للجنسين", "عطور جسم", "عطور غرف", "عطور ملابس", "عطور سيارات"];
    const hairaccs = ["مساك", "شوشو", "كخاب", "بوندانة", "سيغتات", "مناقش", "سنسلة", "خاتم", "قورمات", "خلخال"];
    const gifts = ["رجالية", "نسائية", "بوكي ورد", "بيبي", "تغليف"];

    if (activeCat === 'جميع المنتجات' || activeCat === 'الجميع' || activeCat === '') {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ نوع البشرة</h4>
                <div class="space-y-1 text-xs text-gray-300">
                    ${state.availableSkinTypes.map(st => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${st}" onchange="safeCall('applyFilters')" class="skin-filter-cb accent-[#D4AF37]"> ${st}</label>`).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ نوع الشعر والعلاج</h4>
                <div class="space-y-1 text-xs text-gray-300 max-h-36 overflow-y-auto pr-1">
                    ${state.availableHairTypes.map(ht => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${ht}" onchange="safeCall('applyFilters')" class="hair-filter-cb accent-[#D4AF37]"> ${ht}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat.includes('كوسمتيك')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ منطقة الاستخدام:</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="للوجه" onchange="safeCall('applyFilters')" class="cos-area-cb accent-[#D4AF37]"> للوجه</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="للجسد" onchange="safeCall('applyFilters')" class="cos-area-cb accent-[#D4AF37]"> للجسد</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="للشعر" onchange="safeCall('applyFilters')" class="cos-area-cb accent-[#D4AF37]"> للشعر</label>
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ نوع البشرة:</h4>
                <div class="space-y-1 text-xs text-gray-300">
                    ${state.availableSkinTypes.map(st => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${st}" onchange="safeCall('applyFilters')" class="skin-filter-cb accent-[#D4AF37]"> ${st}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat.includes('بلاكيور') || activeCat.includes('اصي')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">💍 نوع المعدن:</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="بلاكيور أور" onchange="safeCall('applyFilters')" class="metal-cb accent-[#D4AF37]"> بلاكيور أور</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="أسي إينوكسيدابل / Steel" onchange="safeCall('applyFilters')" class="metal-cb accent-[#D4AF37]"> أسي إينوكسيدابل / Steel</label>
                </div>
            </div>
        `;
    } 
    else if (activeCat === 'علب' || activeCat.includes('علب')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🎁 شكل الصندوق:</h4>
                <div class="space-y-1.5 text-xs text-gray-300 max-h-48 overflow-y-auto pr-1">
                    ${shapes.map(sh => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${sh}" onchange="safeCall('applyFilters')" class="giftshape-cb accent-[#D4AF37]"> ${sh}</label>`).join('')}
                </div>
            </div>
        `;
    }
    // يمكنك الاستمرار في إضافة باقي الشروط حسب الأقسام (مكياج، عطور...) بنفس النمط.
    
    dynamicContainer.innerHTML = html;
}

export function applyFilters() {
    if (!state.products || !Array.isArray(state.products)) return;
    let filtered = [...state.products];

    // فلترة القسم النشط
    if (window.activeCategoryFilter && window.activeCategoryFilter !== 'جميع المنتجات') {
        const targetCat = window.activeCategoryFilter.trim().toLowerCase();
        filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(targetCat));
    }

    // فلتر المخزون
    const inStockOnly = document.getElementById('filter-in-stock-only')?.checked;
    if (inStockOnly) filtered = filtered.filter(p => p.inStock === true);

    // فلتر السعر
    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) {
        const maxPrice = parseFloat(priceRangeInput.value) || 20000;
        filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
    }

    // فلاتر الخصائص الديناميكية (Dynamic Checkboxes)
    const selCosAreas = Array.from(document.querySelectorAll('.cos-area-cb:checked')).map(cb => cb.value);
    if (selCosAreas.length > 0) filtered = filtered.filter(p => selCosAreas.includes(p.cosmeticArea));

    const selMetals = Array.from(document.querySelectorAll('.metal-cb:checked')).map(cb => cb.value);
    if (selMetals.length > 0) filtered = filtered.filter(p => selMetals.includes(p.jewelryMetal));

    const selectedSkinTypes = Array.from(document.querySelectorAll('.skin-filter-cb:checked')).map(cb => cb.value);
    if (selectedSkinTypes.length > 0) {
        filtered = filtered.filter(p => {
            const pSkins = Array.isArray(p.skinTypes) ? p.skinTypes : (p.skinType ? [p.skinType] : []);
            return selectedSkinTypes.some(st => pSkins.includes(st));
        });
    }

    // الترتيب (Sorting)
    const sortVal = document.getElementById('sort-select')?.value || 'best';
    if (sortVal === 'low') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortVal === 'high') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    else filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

    // تحديث الواجهة
    const catalogGrid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    if (badge) badge.innerText = filtered.length;

    if (catalogGrid) {
        catalogGrid.innerHTML = filtered.length === 0 ? 
            '<div class="col-span-full text-center py-16 space-y-3"><i class="fa-solid fa-box-open text-4xl text-gray-600"></i><p class="text-gray-400 text-sm">لا توجد منتجات مطابقة.</p></div>' :
            filtered.map(renderSingleProductCard).join('');
    }
}

export function resetFilters() {
    window.activeCategoryFilter = 'جميع المنتجات';
    const inStockCb = document.getElementById('filter-in-stock-only');
    if (inStockCb) inStockCb.checked = false;

    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) priceRangeInput.value = 20000;
    
    updatePriceFilter(20000);
    renderDynamicSidebarFilters();
    applyFilters();
}

export function updatePriceFilter(val) {
    const valEl = document.getElementById('price-range-val');
    if (valEl) valEl.innerText = formatPrice(parseFloat(val));
    applyFilters();
}

// ==========================================
// 5. نظام المفضلة وبانر الإعلانات
// ==========================================
export function toggleFavorite(id) {
    if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(favId => favId !== id);
    } else {
        state.favorites.push(id);
    }
    saveFavsToLocal();
    safeCall('updateBadges');
    applyFilters(); 
    renderProducts();
    const activePage = document.querySelector('.page-sec.active');
    if (activePage && activePage.id === 'page-wishlist') renderWishlistPage();
}

export function renderWishlistPage() {
    const grid = document.getElementById('wishlist-products-grid');
    if (!grid) return;
    const favProducts = state.products.filter(p => state.favorites.includes(p.id));
    grid.innerHTML = favProducts.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">لا توجد منتجات في المفضلة.</p>' : 
        favProducts.map(renderSingleProductCard).join('');
}

export function renderHeroSlider() {
    const container = document.getElementById('hero-slider-container');
    const dotsContainer = document.getElementById('hero-slider-dots');
    if (!container || !state.heroSlides || state.heroSlides.length === 0) return;

    const currentSlide = state.heroSlides[window.currentHeroIdx];

    container.innerHTML = `
        <div class="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden group shadow-2xl border border-[#D4AF37]/30">
            <img src="${currentSlide.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-center items-center text-center p-6 transition-opacity duration-500 pointer-events-none">
                <span class="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs font-bold mb-4">✨ التشكيلة الحصرية</span>
                <h1 class="text-3xl font-black text-white mb-4 drop-shadow-2xl">${currentSlide.title}</h1>
                <p class="text-gray-200 text-sm mb-6 drop-shadow-lg">${currentSlide.desc}</p>
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

// ==========================================
// 6. ربط كافة الدوال بالواجهة (Window Bindings) 
// ==========================================
window.renderSingleProductCard = renderSingleProductCard;
window.renderProducts = renderProducts;
window.updateAppHeaderInfo = updateAppHeaderInfo;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLiveSearch = handleLiveSearch;
window.hideAllDropdowns = hideAllDropdowns;
window.filterCategory = filterCategory;
window.renderDynamicSidebarFilters = renderDynamicSidebarFilters;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.updatePriceFilter = updatePriceFilter;
window.toggleFavorite = toggleFavorite;
window.renderWishlistPage = renderWishlistPage;
window.renderHeroSlider = renderHeroSlider;
window.setHeroSlide = setHeroSlide;
