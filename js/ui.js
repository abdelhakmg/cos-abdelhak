// --- ملف js/ui.js ---

import { state, saveFavsToLocal } from './store/state.js';
import { formatPrice, safeCall, showCustomAlert } from './utils/helpers.js';

window.activeCategoryFilter = 'جميع المنتجات';
window.currentHeroIdx = 0;
let categoriesSwiperInstance = null;

// ==========================================
// 1. رسم المنتجات والبطاقات
// ==========================================
export function renderSingleProductCard(p) {
    let displayImg = (p.images && p.images[0]) || p.image || 'https://via.placeholder.com/300';
    const isFav = state.favorites.includes(p.id);
    const inStock = p.inStock !== false;

    return `
        <div class="bg-[#121212] rounded-2xl border border-[#D4AF37]/20 p-3 text-right flex flex-col justify-between shadow-lg hover:border-[#D4AF37] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            
            <!-- زر المفضلة -->
            <button onclick="event.stopPropagation(); safeCall('toggleFavorite', '${p.id}');" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm cursor-pointer border border-gray-700 hover:border-red-500">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'} text-sm"></i>
            </button>

            <!-- محتوى البطاقة القابل للنقر -->
            <div class="cursor-pointer" onclick="${inStock ? `safeCall('openLandingPage', '${p.id}')` : ''}">
                
                <!-- صورة المنتج -->
                <div class="h-36 sm:h-48 bg-black rounded-xl p-2 mb-3 flex items-center justify-center overflow-hidden relative border border-gray-800">
                    <img src="${displayImg}" loading="lazy" class="max-h-full object-contain group-hover:scale-110 transition duration-500 ${!inStock ? 'opacity-50 grayscale' : ''}">
                    ${!inStock ? '<div class="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"><span class="bg-red-600 text-white font-black px-3 py-1.5 rounded-lg text-xs transform -rotate-12 shadow-lg border border-red-400">نفدت الكمية</span></div>' : ''}
                </div>
                
                <!-- حالة التوفر واسم المنتج -->
                <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-2 h-2 rounded-full ${inStock ? 'bg-green-500 animate-pulse' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.5)]"></span>
                    <span class="text-[10px] font-bold ${inStock ? 'text-green-500' : 'text-red-500'} tracking-wide">${inStock ? 'متوفر في المخزون' : 'غير متوفر حالياً'}</span>
                </div>
                
                <h3 class="font-bold text-xs sm:text-sm text-gray-200 line-clamp-2 my-1.5 group-hover:text-[#D4AF37] transition leading-snug">${p.name || 'منتج'}</h3>
                
                <!-- السعر -->
                <div class="flex items-center gap-2 mb-2">
                    <span class="font-black text-base sm:text-lg text-[#D4AF37]">${formatPrice(p.price)}</span>
                    ${p.oldPrice ? `<span class="text-[10px] text-gray-500 line-through">${formatPrice(p.oldPrice)}</span>` : ''}
                </div>
            </div>

            <!-- الأزرار -->
            <div class="mt-auto flex gap-2">
                ${inStock ? `
                    <button onclick="event.stopPropagation(); safeCall('openLandingPage', '${p.id}');" class="flex-1 py-2 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-bolt"></i> اطلب الآن
                    </button>
                    <button onclick="event.stopPropagation(); safeCall('addToCart', '${p.id}');" class="w-10 h-10 flex items-center justify-center bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold rounded-xl transition cursor-pointer group-hover:border-[#D4AF37]" title="أضف للسلة">
                        <i class="fa-solid fa-cart-plus text-sm"></i>
                    </button>
                ` : `
                    <button disabled class="w-full py-2 bg-[#1a1a1a] text-gray-500 font-bold text-xs rounded-xl border border-gray-800 flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <i class="fa-solid fa-bell"></i> أعلمني عند التوفر
                    </button>
                `}
            </div>
        </div>
    `;
}

export function renderProducts() {
    const grid = document.getElementById('home-products');
    if (!grid) return;
    let bestSellers = [...state.products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8);
    grid.innerHTML = bestSellers.length === 0 ? 
        const skeletonHtml = Array(4).fill(0).map(() => `
        <div class="bg-[#121212] rounded-2xl border border-gray-800 p-3 space-y-3 animate-pulse">
            <div class="h-36 sm:h-48 bg-gray-800/60 rounded-xl"></div>
            <div class="h-3 bg-gray-800 rounded w-1/3"></div>
            <div class="h-4 bg-gray-800 rounded w-3/4"></div>
            <div class="h-5 bg-[#D4AF37]/20 rounded w-1/2"></div>
            <div class="h-9 bg-gray-800 rounded-xl w-full"></div>
        </div>
    `).join(''); 
        bestSellers.map(renderSingleProductCard).join('');
}

// ==========================================
// 2. القوائم والأقسام العلوية والجانبية
// ==========================================
export function updateAppHeaderInfo() {
    const navEl = document.getElementById('header-nav');
    if (navEl) {
        navEl.innerHTML = `
            <button onclick="safeCall('showPage', 'home')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">الرئيسية</button>
            
            <div class="relative group py-2">
                <button class="flex items-center gap-1.5 text-gray-300 group-hover:text-[#D4AF37] transition font-bold cursor-pointer">
                    <i class="fa-solid fa-list-ul"></i> تصفح الأقسام <i class="fa-solid fa-chevron-down text-[10px] transition-transform group-hover:rotate-180"></i>
                </button>
                
                <!-- القائمة المنسدلة -->
                <div class="absolute top-full right-0 w-52 bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 z-50 flex flex-col py-2">
                    <button onclick="safeCall('filterCategory', 'جميع المنتجات')" class="text-right px-4 py-2.5 text-white hover:bg-[#1e1e1e] hover:text-[#D4AF37] transition font-bold text-xs border-b border-gray-800 flex items-center gap-2">
                        <i class="fa-solid fa-border-all text-[#D4AF37]"></i> جميع المنتجات
                    </button>
                    ${state.categories.map(c => {
                        const safeName = (c.name || '').replace(/'/g, "\\'");
                        return `
                        <button onclick="safeCall('filterCategory', '${safeName}')" class="text-right px-4 py-2.5 text-gray-300 hover:bg-[#1e1e1e] hover:text-[#D4AF37] transition font-bold text-xs flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-gray-600"></span> ${c.name}
                        </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    const mobileListEl = document.getElementById('mobile-drawer-categories');
    if (mobileListEl) {
        mobileListEl.innerHTML = `<button onclick="safeCall('showPage', 'home'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-[#D4AF37] font-bold mb-2">الرئيسية</button>
            <button onclick="safeCall('filterCategory', 'جميع المنتجات'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-white font-bold mb-2">جميع المنتجات</button>` + 
            state.categories.map(c => {
                const safeName = (c.name || '').replace(/'/g, "\\'");
                return `<button onclick="safeCall('filterCategory', '${safeName}'); safeCall('toggleMobileMenu');" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-gray-200 hover:text-[#D4AF37] font-bold mb-2">${c.name}</button>`;
            }).join('');
    }

    const homeCatGrid = document.getElementById('home-category-cards');
    if (homeCatGrid) {
        homeCatGrid.innerHTML = state.categories.map(c => {
            const safeName = (c.name || '').replace(/'/g, "\\'");
            return `
            <div onclick="safeCall('filterCategory', '${safeName}')" class="swiper-slide bg-[#121212] border border-[#D4AF37]/30 rounded-2xl p-4 text-center cursor-pointer hover:border-[#D4AF37] transition flex flex-col items-center justify-center space-y-2 shadow-lg group">
                <div class="w-14 h-14 rounded-2xl p-0.5 gold-gradient overflow-hidden shadow-md group-hover:scale-105 transition">
                    <img src="${c.image}" class="w-full h-full object-cover rounded-xl bg-black" loading="lazy">
                </div>
                <h3 class="text-white font-bold text-sm tracking-wide group-hover:text-[#D4AF37]">${c.name}</h3>
            </div>
            `;
        }).join('');

        // 🌟 تصحيح: تدمير نسخة Swiper السابقة إن وجدت لمنع ثقل الصفحة وتداخل الحركة
        setTimeout(() => {
            if (typeof Swiper !== 'undefined') {
                if (categoriesSwiperInstance) {
                    categoriesSwiperInstance.destroy(true, true);
                }
                categoriesSwiperInstance = new Swiper('.categories-swiper', {
                    slidesPerView: 2.5,
                    spaceBetween: 10,
                    navigation: {
                        nextEl: '.swiper-btn-next',
                        prevEl: '.swiper-btn-prev',
                    },
                    breakpoints: {
                        640: { slidesPerView: 4, spaceBetween: 15 },
                        1024: { slidesPerView: 6, spaceBetween: 15 },
                        1280: { slidesPerView: 8, spaceBetween: 15 },
                    }
                });
            }
        }, 100);
    }

    // تحديث قائمة الماركات في الفلتر الجانبي
    renderBrandsFilterSidebar();
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
    const q = (query || '').trim().toLowerCase();
    
    if (!q) {
        if (dropdown) dropdown.classList.add('hidden');
        if (mobileDropdown) mobileDropdown.classList.add('hidden');
        return;
    }

    const matches = state.products.filter(p => {
        if (p.inStock === false) return false;
        
        const skinsStr = Array.isArray(p.skinTypes) ? p.skinTypes.join(' ') : (p.skinType || '');
        const hairsStr = Array.isArray(p.hairTypes) ? p.hairTypes.join(' ') : (p.hairType || '');
        const attrsStr = p.attributes ? Object.values(p.attributes).flat().join(' ') : '';

        return (p.name && p.name.toLowerCase().includes(q)) || 
               (p.category && p.category.toLowerCase().includes(q)) ||
               (p.brand && p.brand.toLowerCase().includes(q)) ||
               skinsStr.toLowerCase().includes(q) || 
               hairsStr.toLowerCase().includes(q) ||
               attrsStr.toLowerCase().includes(q);
    }).slice(0, 5);

    let htmlContent = matches.length === 0 ? 
        '<div class="p-4 text-xs text-amber-400 text-center">المنتج غير متوفر، تأكد من البحث عنه يدوياً من الفئات.</div>' : 
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

// 🌟 الدالة التي كانت مفقودة وتسبب خطأ عند الكتابة في حقل البحث
export function handleSearchKeydown(event, query) {
    if (!event) return;
    if (event.key === 'Escape') {
        hideAllDropdowns();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        const q = (query || '').trim().toLowerCase();
        if (!q) return;
        const firstMatch = state.products.find(p => p.inStock !== false && (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.brand && p.brand.toLowerCase().includes(q))
        ));
        if (firstMatch) {
            hideAllDropdowns();
            safeCall('openLandingPage', firstMatch.id);
        }
    }
}

export function hideAllDropdowns() {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (mobileDropdown) mobileDropdown.classList.add('hidden');
}

// ==========================================
// 4. نظام الفلاتر الديناميكي والماركات للزبائن 🚀
// ==========================================
export function filterCategory(catName) {
    window.activeCategoryFilter = (catName || 'جميع المنتجات').trim();
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = window.activeCategoryFilter;

    renderDynamicSidebarFilters();
    renderBrandsFilterSidebar();
    applyFilters();
    safeCall('showPage', 'catalog');
}

// 🌟 تفعيل فلتر العلامات التجارية (الماركات) في الكتالوج
export function renderBrandsFilterSidebar() {
    const brandsContainer = document.getElementById('filter-brands-list');
    if (!brandsContainer) return;

    const brandsFromState = (state.brands || []).map(b => typeof b === 'object' ? b.name : b);
    const brandsFromProducts = (state.products || []).map(p => p.brand).filter(Boolean);
    const allBrands = [...new Set([...brandsFromState, ...brandsFromProducts])].filter(Boolean);

    if (allBrands.length === 0) {
        brandsContainer.innerHTML = '<p class="text-[11px] text-gray-500">لا توجد علامات تجارية محددة.</p>';
        return;
    }

    brandsContainer.innerHTML = allBrands.map(brand => `
        <label class="flex items-center gap-2 cursor-pointer py-0.5 hover:text-white transition">
            <input type="checkbox" value="${brand}" onchange="window.applyFilters()" class="brand-filter-cb accent-[#D4AF37] w-3.5 h-3.5 cursor-pointer rounded">
            <span>${brand}</span>
        </label>
    `).join('');
}

export function renderDynamicSidebarFilters() {
    const dynamicContainer = document.getElementById('dynamic-category-filters');
    if (!dynamicContainer) return;

    const activeCat = (window.activeCategoryFilter || 'جميع المنتجات').trim();
    let html = '';

    const buildFilterGroup = (title, items, attrName) => {
        if (!items || items.length === 0) return '';
        return `
        <div class="space-y-3">
            <h4 class="font-bold text-xs text-[#D4AF37]"><i class="fa-solid fa-caret-left"></i> ${title}</h4>
            <div class="space-y-1 text-xs text-gray-300 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                ${items.map(item => `
                <label class="flex items-center gap-2 cursor-pointer py-0.5 hover:text-white transition">
                    <input type="checkbox" value="${item}" data-filter-name="${attrName}" onchange="window.applyFilters()" class="dynamic-customer-cb accent-[#D4AF37] w-3 h-3 cursor-pointer"> 
                    <span>${item}</span>
                </label>`).join('')}
            </div>
        </div><hr class="border-gray-800">`;
    };

    if (state.categoryFilters && state.categoryFilters[activeCat] && state.categoryFilters[activeCat].length > 0) {
        state.categoryFilters[activeCat].forEach(filter => {
            html += buildFilterGroup(filter.name, filter.options, filter.name);
        });
    } else if (activeCat === 'جميع المنتجات') {
        html += '<p class="text-[10px] text-gray-500 text-center py-4 bg-black/40 rounded-xl border border-gray-800">يرجى تحديد قسم من الأعلى لظهور فلاتر البحث الدقيقة الخاصة به.</p>';
    }

    dynamicContainer.innerHTML = html;
}

export function applyFilters() {
    if (!state.products || !Array.isArray(state.products)) return;
    let filtered = [...state.products];

    // 1. فلترة القسم
    if (window.activeCategoryFilter && window.activeCategoryFilter !== 'جميع المنتجات') {
        const targetCat = window.activeCategoryFilter.trim().toLowerCase();
        filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(targetCat));
    }

    // 2. فلتر المخزون
    const inStockOnly = document.getElementById('filter-in-stock-only')?.checked;
    if (inStockOnly) filtered = filtered.filter(p => p.inStock !== false);

    // 3. فلتر السعر
    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) {
        const maxPrice = parseFloat(priceRangeInput.value) || 20000;
        filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
    }

    // 4. فلتر الماركات (العلامة التجارية)
    const checkedBrands = Array.from(document.querySelectorAll('.brand-filter-cb:checked')).map(cb => cb.value);
    if (checkedBrands.length > 0) {
        filtered = filtered.filter(p => p.brand && checkedBrands.includes(p.brand));
    }

    // 5. الفلاتر الديناميكية للأقسام
    const dynamicCheckboxes = document.querySelectorAll('.dynamic-customer-cb:checked');
    if (dynamicCheckboxes.length > 0) {
        const selectedFilters = {};
        dynamicCheckboxes.forEach(cb => {
            const attrName = cb.getAttribute('data-filter-name');
            if (!selectedFilters[attrName]) selectedFilters[attrName] = [];
            selectedFilters[attrName].push(cb.value);
        });

        filtered = filtered.filter(p => {
            if (!p.attributes) return false;
            return Object.keys(selectedFilters).every(attrName => {
                const productAttrValues = p.attributes[attrName] || [];
                return selectedFilters[attrName].some(val => productAttrValues.includes(val));
            });
        });
    }

    // 6. الترتيب (Sorting)
    const sortVal = document.getElementById('sort-select')?.value || 'best';
    if (sortVal === 'low') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortVal === 'high') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    else filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

    // تحديث الواجهة والعداد
    const catalogGrid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    if (badge) badge.innerText = filtered.length;

    if (catalogGrid) {
        catalogGrid.innerHTML = filtered.length === 0 ? 
            '<div class="col-span-full text-center py-16 space-y-3"><i class="fa-solid fa-box-open text-4xl text-gray-600"></i><p class="text-gray-400 text-sm">لا توجد منتجات مطابقة لخيارات الفلترة.</p></div>' :
            filtered.map(renderSingleProductCard).join('');
    }
}

export function resetFilters() {
    window.activeCategoryFilter = 'جميع المنتجات';
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = 'جميع المنتجات';

    const inStockCb = document.getElementById('filter-in-stock-only');
    if (inStockCb) inStockCb.checked = false;

    document.querySelectorAll('.brand-filter-cb').forEach(cb => cb.checked = false);

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

    if (window.currentHeroIdx >= state.heroSlides.length) {
        window.currentHeroIdx = 0;
    }

    const currentSlide = state.heroSlides[window.currentHeroIdx];
    if (!currentSlide) return;

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

    // 🌟 تشغيل التقليب التلقائي للبانر الإعلاني كل 5 ثوانٍ إذا كان هناك أكثر من شريحة
    if (window.heroSliderTimer) clearInterval(window.heroSliderTimer);
    if (state.heroSlides.length > 1) {
        window.heroSliderTimer = setInterval(() => {
            window.currentHeroIdx = (window.currentHeroIdx + 1) % state.heroSlides.length;
            renderHeroSlider();
        }, 5000);
    }
}

export function setHeroSlide(idx) {
    window.currentHeroIdx = idx;
    renderHeroSlider();
}

export function startBannerTicker() {
    const bannerEl = document.getElementById('top-announcement-text');
    if (!bannerEl || !state.bannerMessages || state.bannerMessages.length === 0) return;
    
    if (window.bannerTickerTimer) clearInterval(window.bannerTickerTimer);
    
    window.currentBannerIdx = 0;
    bannerEl.innerText = state.bannerMessages[window.currentBannerIdx];

    window.bannerTickerTimer = setInterval(() => {
        bannerEl.style.opacity = '0';
        setTimeout(() => {
            window.currentBannerIdx = (window.currentBannerIdx + 1) % state.bannerMessages.length;
            bannerEl.innerText = state.bannerMessages[window.currentBannerIdx];
            bannerEl.style.opacity = '1';
        }, 300);
    }, 3000);
}

// ==========================================
// 6. التحكم الديناميكي بشاشة الافتتاح (Admin)
// ==========================================
export function saveSplashSettings() {
    const title = document.getElementById('admin-splash-title')?.value.trim() || '';
    const subtitle = document.getElementById('admin-splash-subtitle')?.value.trim() || '';
    
    if (typeof window.db !== 'undefined') {
        window.db.collection('settings').doc('main').set({
            splashTitle: title,
            splashSubtitle: subtitle
        }, { merge: true }).then(() => {
            showCustomAlert('تم الحفظ بنجاح 👑', 'تم تغيير نصوص شاشة البداية بنجاح وسيراها جميع الزوار فوراً.', true);
        }).catch(err => console.error("Error saving splash settings:", err));
    }
}

export function updateSplashScreenText() {
    if (!state.storeSettings) return;
    
    const titleEl = document.getElementById('splash-title-display');
    const subEl = document.getElementById('splash-subtitle-display');
    if (titleEl && state.storeSettings.splashTitle) titleEl.innerText = state.storeSettings.splashTitle;
    if (subEl && state.storeSettings.splashSubtitle) subEl.innerText = state.storeSettings.splashSubtitle;

    const adminTitleInput = document.getElementById('admin-splash-title');
    const adminSubInput = document.getElementById('admin-splash-subtitle');
    if (adminTitleInput && state.storeSettings.splashTitle) adminTitleInput.value = state.storeSettings.splashTitle;
    if (adminSubInput && state.storeSettings.splashSubtitle) adminSubInput.value = state.storeSettings.splashSubtitle;
}

// ==========================================
// 7. ربط كافة الدوال بالواجهة (Window Bindings) 
// ==========================================
window.renderSingleProductCard = renderSingleProductCard;
window.renderProducts = renderProducts;
window.updateAppHeaderInfo = updateAppHeaderInfo;
window.toggleMobileMenu = toggleMobileMenu;
window.handleLiveSearch = handleLiveSearch;
window.handleSearchKeydown = handleSearchKeydown;
window.hideAllDropdowns = hideAllDropdowns;
window.filterCategory = filterCategory;
window.renderBrandsFilterSidebar = renderBrandsFilterSidebar;
window.renderDynamicSidebarFilters = renderDynamicSidebarFilters;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.updatePriceFilter = updatePriceFilter;
window.toggleFavorite = toggleFavorite;
window.renderWishlistPage = renderWishlistPage;
window.renderHeroSlider = renderHeroSlider;
window.setHeroSlide = setHeroSlide;
window.startBannerTicker = startBannerTicker;
window.saveSplashSettings = saveSplashSettings;
window.updateSplashScreenText = updateSplashScreenText;
