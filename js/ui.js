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
    let displayImg = p.image || (Array.isArray(p.images) && p.images[0]) || (Array.isArray(p.variants) && p.variants[0]?.image) || 'https://via.placeholder.com/300';
    const isFav = state.favorites.includes(p.id);
    const inStock = p.inStock !== false;

    return `
        <div class="bg-[#121212] rounded-2xl border border-[#D4AF37]/20 p-3 text-right flex flex-col justify-between shadow-lg hover:border-[#D4AF37] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <button onclick="event.stopPropagation(); safeCall('toggleFavorite', '${p.id}');" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm cursor-pointer border border-gray-700 hover:border-red-500">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'} text-sm"></i>
            </button>

            <div class="cursor-pointer" onclick="${inStock ? `safeCall('openLandingPage', '${p.id}')` : ''}">
                <!-- 🌟 تم إصلاح ظهور الصورة وطبقة نفدت الكمية -->
                <div class="h-36 sm:h-48 bg-black rounded-xl p-2 mb-3 flex items-center justify-center overflow-hidden relative border border-gray-800">
                    <img src="${displayImg}" loading="lazy" class="max-h-full object-contain group-hover:scale-110 transition duration-500">
                    ${!inStock ? '<div class="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10"><span class="bg-red-600 text-white font-black px-4 py-1.5 rounded-lg text-xs transform -rotate-12 shadow-lg border border-red-400">نفدت الكمية</span></div>' : ''}
                </div>

                <div class="flex items-center gap-1.5 mb-1">
                    <span class="w-2 h-2 rounded-full ${inStock ? 'bg-green-500 animate-pulse' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.5)]"></span>
                    <span class="text-[10px] font-bold ${inStock ? 'text-green-500' : 'text-red-500'} tracking-wide">${inStock ? 'متوفر في المخزون' : 'غير متوفر حالياً'}</span>
                </div>

                <h3 class="font-bold text-xs sm:text-sm text-gray-200 line-clamp-2 my-1.5 group-hover:text-[#D4AF37] transition leading-snug">${p.name || 'منتج'}</h3>

                <div class="flex items-center gap-2 mb-2">
                    <span class="font-black text-base sm:text-lg text-[#D4AF37]">${formatPrice(p.price)}</span>
                    ${p.oldPrice ? `<span class="text-[10px] text-gray-500 line-through">${formatPrice(p.oldPrice)}</span>` : ''}
                </div>
            </div>

            <div class="mt-auto flex gap-2">
                ${inStock ? `
                    <button onclick="event.stopPropagation(); safeCall('openLandingPage', '${p.id}');" class="flex-1 py-2 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-bolt"></i> اطلب الآن
                    </button>
                    <button onclick="event.stopPropagation(); safeCall('addToCart', '${p.id}');" class="w-10 h-10 flex items-center justify-center bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold rounded-xl transition cursor-pointer group-hover:border-[#D4AF37]" title="أضف للسلة">
                        <i class="fa-solid fa-cart-plus text-sm"></i>
                    </button>
                ` : `
                    <!-- 🌟 تم تغيير الزر إلى غير متوفر -->
                    <button disabled class="w-full py-2 bg-[#1a1a1a] text-red-500 font-bold text-xs rounded-xl border border-red-900/50 flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <i class="fa-solid fa-ban"></i> غير متوفر
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
    
    const skeletonHtml = Array(4).fill(0).map(() => `
        <div class="bg-[#121212] rounded-2xl border border-gray-800 p-3 space-y-3 animate-pulse">
            <div class="h-36 sm:h-48 bg-gray-800/60 rounded-xl"></div>
            <div class="h-3 bg-gray-800 rounded w-1/3"></div>
            <div class="h-4 bg-gray-800 rounded w-3/4"></div>
            <div class="h-5 bg-[#D4AF37]/20 rounded w-1/2"></div>
            <div class="h-9 bg-gray-800 rounded-xl w-full"></div>
        </div>
    `).join('');

    grid.innerHTML = bestSellers.length === 0 ? skeletonHtml : bestSellers.map(renderSingleProductCard).join('');
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
let searchTimeout = null;
export function handleLiveSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    const q = (query || '').trim();
    
    if (!q) {
        if (dropdown) dropdown.classList.add('hidden');
        if (mobileDropdown) mobileDropdown.classList.add('hidden');
        return;
    }

    if (searchTimeout) clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
        try {
            const qLower = q.toLowerCase();
            // 1. البحث الفوري الشامل في الفهرس الكلي أو المنتجات المحملة
            const sourcePool = (window.localSearchIndex && window.localSearchIndex.length > 0) 
                ? window.localSearchIndex 
                : (state.products || []);

            let matches = sourcePool.filter(p => p.inStock !== false && (
                (p.name && p.name.toLowerCase().includes(qLower)) || 
                (p.category && p.category.toLowerCase().includes(qLower)) ||
                (p.brand && p.brand.toLowerCase().includes(qLower)) ||
                (p.keywords && p.keywords.includes(qLower))
            )).slice(0, 6);

            // 2. إذا لم يكن الفهرس محملاً بعد ولم نجد في الدفعة الأولى، نبحث في Firebase
            if (matches.length === 0 && typeof window.db !== 'undefined') {
                const snapshot = await window.db.collection('products')
                    .where('name', '>=', q)
                    .where('name', '<=', q + '\uf8ff')
                    .limit(5).get();
                snapshot.forEach(doc => matches.push({ id: doc.id, ...doc.data() }));
            }

            // 🌟 ضمان وجود المنتجات المطابقة في state.products لكي تفتح فوراً عند النقر
            matches.forEach(mp => {
                if (!state.products.some(p => p.id === mp.id)) {
                    state.products.push(mp);
                }
            });

            let htmlContent = matches.length === 0 ? 
                '<div class="p-4 text-xs text-amber-400 text-center">لا توجد نتائج مطابقة، جرب كتابة كلمة أخرى.</div>' : 
                matches.map(p => {
                    const img = p.image || (Array.isArray(p.images) && p.images[0]) || 'https://via.placeholder.com/50';
                    return `
                    <div onclick="safeCall('openLandingPage', '${p.id}'); safeCall('hideAllDropdowns');" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                        <img src="${img}" class="w-10 h-10 object-contain rounded-lg bg-black" loading="lazy">
                        <div class="text-right">
                            <p class="text-xs font-bold text-white truncate">${p.name}</p>
                            <p class="text-[10px] text-[#D4AF37] font-bold">${formatPrice(p.price)}</p>
                        </div>
                    </div>
                `}).join('');

            if (dropdown) { dropdown.innerHTML = htmlContent; dropdown.classList.remove('hidden'); }
            if (mobileDropdown) { mobileDropdown.innerHTML = htmlContent; mobileDropdown.classList.remove('hidden'); }
        } catch (error) {
            console.error("Search error:", error);
        }
    }, 300); 
}

export function handleSearchKeydown(event, query) {
    if (!event) return;
    if (event.key === 'Escape') {
        hideAllDropdowns();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        const q = (query || '').trim();
        if (!q) return;
        hideAllDropdowns();
        if (typeof window.performAdvancedSearch === 'function') {
            window.performAdvancedSearch(q);
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
window.catalogRenderCount = 30;
window.currentFilteredCatalog = [];

export async function filterCategory(catName) {
    window.activeCategoryFilter = (catName || 'جميع المنتجات').trim();
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = window.activeCategoryFilter;

    // 🌟 تصفير حقول البحث والفلاتر الجانبية القديمة حتى لا تتسبب في إخفاء منتجات القسم الجديد (0 منتج)!
    const desktopSearch = document.getElementById('customer-search-input');
    const mobileSearch = document.getElementById('customer-search-input-mobile');
    if (desktopSearch) desktopSearch.value = '';
    if (mobileSearch) mobileSearch.value = '';

    document.querySelectorAll('.brand-filter-cb').forEach(cb => cb.checked = false);
    document.querySelectorAll('.dynamic-customer-cb').forEach(cb => cb.checked = false);

    safeCall('showPage', 'catalog');

    const step = window.activeCategoryFilter === 'جميع المنتجات' ? 30 : 16;
    window.catalogRenderCount = step;

    // فحص المنتجات الموجودة محلياً لهذا القسم
    const existingForCat = window.activeCategoryFilter === 'جميع المنتجات'
        ? state.products
        : state.products.filter(p => (p.category || '').trim() === window.activeCategoryFilter);

    renderDynamicSidebarFilters();
    renderBrandsFilterSidebar();

    if (existingForCat.length > 0) {
        applyFilters(false);
    } else {
        const catalogGrid = document.getElementById('catalog-products');
        if (catalogGrid) {
            catalogGrid.innerHTML = '<div class="col-span-full text-center py-16"><i class="fa-solid fa-spinner fa-spin text-4xl text-[#D4AF37]"></i><p class="text-gray-400 text-sm mt-4">جاري جلب منتجات القسم...</p></div>';
        }
    }

    // 🌟 جلب الدفعة من قاعدة البيانات إذا لم يُجلب القسم من قبل أو كان عدد منتجاته المحلية 0
    const hasCursor = window.categoryCursors && window.categoryCursors[window.activeCategoryFilter];
    if (!hasCursor || existingForCat.length === 0) {
        await window.loadProducts(false, window.activeCategoryFilter);
    }
}

// 🌟 دالة فتح وإغلاق قوائم الفلاتر المنسدلة (Accordion)
export function toggleFilterAccordion(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    if (!content) return;

    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}
window.toggleFilterAccordion = toggleFilterAccordion;

export function renderBrandsFilterSidebar() {
    const brandsContainer = document.getElementById('filter-brands-list');
    if (!brandsContainer) return;

    // إخفاء العنوان النصي الثابت فوق الماركات في HTML إن وجد لكي لا يتكرر مع الزر المنسدل
    const parentBox = brandsContainer.parentElement;
    if (parentBox) {
        const staticHeader = parentBox.querySelector('h4, h3');
        if (staticHeader && staticHeader.innerText.includes('العلامة التجارية')) {
            staticHeader.style.display = 'none';
        }
    }

    const brandsFromState = (state.brands || []).map(b => typeof b === 'object' ? b.name : b);
    const brandsFromProducts = (state.products || []).map(p => p.brand).filter(Boolean);
    const allBrands = [...new Set([...brandsFromState, ...brandsFromProducts])].filter(Boolean);

    if (allBrands.length === 0) {
        brandsContainer.innerHTML = '<p class="text-[11px] text-gray-500">لا توجد علامات تجارية محددة.</p>';
        return;
    }

    brandsContainer.className = 'w-full';
    brandsContainer.innerHTML = `
        <div class="border border-gray-800 bg-black/50 rounded-xl overflow-hidden">
            <button type="button" onclick="window.toggleFilterAccordion('acc-brands-body', 'acc-brands-icon')" class="w-full flex items-center justify-between p-3 text-xs font-bold text-[#D4AF37] hover:bg-[#1a1a1a] transition cursor-pointer">
                <span class="flex items-center gap-2"><i class="fa-solid fa-tags text-[11px]"></i> العلامة التجارية (${allBrands.length})</span>
                <i id="acc-brands-icon" class="fa-solid fa-chevron-down text-[11px] text-gray-400 transition-transform duration-300"></i>
            </button>
            <div id="acc-brands-body" class="hidden px-3 pb-3 pt-2 border-t border-gray-800/80 space-y-1.5 text-xs text-gray-300 max-h-40 overflow-y-auto custom-scrollbar">
                ${allBrands.map(brand => `
                    <label class="flex items-center justify-between gap-2 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-white/5 hover:text-white transition">
                        <span class="truncate">${brand}</span>
                        <input type="checkbox" value="${brand}" onchange="window.applyFilters(false)" class="brand-filter-cb accent-[#D4AF37] w-4 h-4 cursor-pointer rounded shrink-0">
                    </label>
                `).join('')}
            </div>
        </div>
    `;
}

export function renderDynamicSidebarFilters() {
    const dynamicContainer = document.getElementById('dynamic-category-filters');
    if (!dynamicContainer) return;

    const activeCat = (window.activeCategoryFilter || 'جميع المنتجات').trim();
    let html = '';

    const buildFilterGroup = (title, items, attrName, idx) => {
        if (!items || items.length === 0) return '';
        const bodyId = `acc-dyn-body-${idx}`;
        const iconId = `acc-dyn-icon-${idx}`;
        return `
        <div class="border border-gray-800 bg-black/50 rounded-xl overflow-hidden mb-2">
            <button type="button" onclick="window.toggleFilterAccordion('${bodyId}', '${iconId}')" class="w-full flex items-center justify-between p-3 text-xs font-bold text-[#D4AF37] hover:bg-[#1a1a1a] transition cursor-pointer">
                <span class="flex items-center gap-2"><i class="fa-solid fa-Sliders text-[11px]"></i> ${title}</span>
                <i id="${iconId}" class="fa-solid fa-chevron-down text-[11px] text-gray-400 transition-transform duration-300"></i>
            </button>
            <div id="${bodyId}" class="hidden px-3 pb-3 pt-2 border-t border-gray-800/80 space-y-1.5 text-xs text-gray-300 max-h-40 overflow-y-auto custom-scrollbar">
                ${items.map(item => `
                <label class="flex items-center justify-between gap-2 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-white/5 hover:text-white transition">
                    <span class="truncate">${item}</span>
                    <input type="checkbox" value="${item}" data-filter-name="${attrName}" onchange="window.applyFilters(false)" class="dynamic-customer-cb accent-[#D4AF37] w-4 h-4 cursor-pointer rounded shrink-0"> 
                </label>`).join('')}
            </div>
        </div>`;
    };

    if (state.categoryFilters && state.categoryFilters[activeCat] && state.categoryFilters[activeCat].length > 0) {
        state.categoryFilters[activeCat].forEach((filter, idx) => {
            html += buildFilterGroup(filter.name, filter.options, filter.name, idx);
        });
    } else if (activeCat === 'جميع المنتجات') {
        html += '<p class="text-[10px] text-gray-500 text-center py-3 bg-black/40 rounded-xl border border-gray-800">اختر قسماً من الأعلى لظهور فلاتره الخاصة.</p>';
    }

    dynamicContainer.innerHTML = html;
}
export function applyFilters(preserveCount = false) {
    const activeCat = (window.activeCategoryFilter || 'جميع المنتجات').trim();
    let baseProducts = state.products || [];
    
    if (activeCat !== 'جميع المنتجات') {
        baseProducts = baseProducts.filter(p => (p.category || '').trim() === activeCat);
    }
    
    let filtered = [...baseProducts];

    const inStockOnly = document.getElementById('filter-in-stock-only')?.checked;
    if (inStockOnly) filtered = filtered.filter(p => p.inStock !== false);

    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) {
        const sliderMax = parseFloat(priceRangeInput.max) || 20000;
        const maxPrice = parseFloat(priceRangeInput.value) || sliderMax;
        // إذا كان السلايدر في أقصى قيمة له، لا نستبعد المنتجات الأغلى من السقف الافتراضي
        if (maxPrice < sliderMax) {
            filtered = filtered.filter(p => (Number(p.price) || 0) <= maxPrice);
        }
    }

    const checkedBrands = Array.from(document.querySelectorAll('.brand-filter-cb:checked')).map(cb => cb.value.trim());
    if (checkedBrands.length > 0) {
        filtered = filtered.filter(p => p.brand && checkedBrands.includes(p.brand.trim()));
    }

    const dynamicCheckboxes = document.querySelectorAll('.dynamic-customer-cb:checked');
    if (dynamicCheckboxes.length > 0) {
        const selectedFilters = {};
        dynamicCheckboxes.forEach(cb => {
            const attrName = cb.getAttribute('data-filter-name');
            if (!selectedFilters[attrName]) selectedFilters[attrName] = [];
            selectedFilters[attrName].push(cb.value);
        });

        // 🌟 جعل الفلترة مرنة ومنطقية: المنتج يظهر إذا تطابق مع أي خيار تم تحديده
        filtered = filtered.filter(p => {
            if (!p.attributes) return false;
            return Object.keys(selectedFilters).every(attrName => {
                const productAttrValues = p.attributes[attrName] || [];
                // استخدام .some بين الخيارات حتى لو حدد الزبون/المدير أكثر من خيار
                return selectedFilters[attrName].some(val => productAttrValues.includes(val));
            });
        });
    }

    const sortVal = document.getElementById('sort-select')?.value || 'best';
    if (sortVal === 'low') filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    else if (sortVal === 'high') filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    else filtered.sort((a, b) => (Number(b.salesCount) || 0) - (Number(a.salesCount) || 0));

    window.currentFilteredCatalog = filtered;
    renderCatalogProducts(false, preserveCount);
}
export function renderCatalogProducts(isLoadMoreLocal = false, preserveCount = false) {
    const grid = document.getElementById('catalog-products');
    const loadMoreBtn = document.getElementById('load-more-catalog-btn');
    const badge = document.getElementById('products-count-badge');
    
    const activeCat = (window.activeCategoryFilter || 'جميع المنتجات').trim();
    const step = activeCat === 'جميع المنتجات' ? 30 : 16;
    
    if (isLoadMoreLocal) {
        window.catalogRenderCount = (window.catalogRenderCount || step) + step;
    } else if (preserveCount) {
        // 🌟 عند جلب دفعة جديدة من Firebase، نوسع العداد ليعرض الدفعة الجديدة فوراً!
        window.catalogRenderCount = (window.loadedCountsPerCategory && window.loadedCountsPerCategory[activeCat]) || ((window.catalogRenderCount || step) + step);
    } else {
        window.catalogRenderCount = (window.loadedCountsPerCategory && window.loadedCountsPerCategory[activeCat]) || step;
    }
    
    const toRender = window.currentFilteredCatalog.slice(0, window.catalogRenderCount);
    
    if (grid) {
        grid.innerHTML = toRender.length === 0 ? 
            '<div class="col-span-full text-center py-16 space-y-3"><i class="fa-solid fa-box-open text-4xl text-gray-600"></i><p class="text-gray-400 text-sm">لا توجد منتجات مطابقة لخيارات الفلترة.</p></div>' :
            toRender.map(renderSingleProductCard).join('');
    }
    
    // عرض العدد الكلي الدقيق
    if (badge) {
        if (activeCat === 'جميع المنتجات' && window.totalStoreProductsCount && window.currentFilteredCatalog.length >= 30) {
            badge.innerText = window.totalStoreProductsCount;
        } else {
            badge.innerText = window.currentFilteredCatalog.length;
        }
    }

    const hasMoreLocal = window.catalogRenderCount < window.currentFilteredCatalog.length;
    const hasMoreFirebase = window.categoryHasMore && window.categoryHasMore[activeCat] !== false;

    if (loadMoreBtn) {
        if (hasMoreLocal) {
            loadMoreBtn.style.display = 'inline-flex';
            loadMoreBtn.onclick = () => renderCatalogProducts(true, false);
            loadMoreBtn.innerHTML = `عرض المزيد من المنتجات (${step}) <i class="fa-solid fa-angle-down mr-2"></i>`;
        } else if (hasMoreFirebase) {
            loadMoreBtn.style.display = 'inline-flex';
            loadMoreBtn.onclick = () => window.loadProducts(true, activeCat);
            loadMoreBtn.innerHTML = `عرض المزيد من المنتجات <i class="fa-solid fa-angle-down mr-2"></i>`;
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}
window.renderCatalogProducts = renderCatalogProducts;

export function resetFilters() {
    window.activeCategoryFilter = 'جميع المنتجات';
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = 'جميع المنتجات';

    const inStockCb = document.getElementById('filter-in-stock-only');
    if (inStockCb) inStockCb.checked = false;

    document.querySelectorAll('.brand-filter-cb').forEach(cb => cb.checked = false);
    document.querySelectorAll('.dynamic-customer-cb').forEach(cb => cb.checked = false);

    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) priceRangeInput.value = 20000;
    
    updatePriceFilter(20000);
    renderDynamicSidebarFilters();
    applyFilters(false);
}

export function updatePriceFilter(val) {
    const valEl = document.getElementById('price-range-val');
    if (valEl) valEl.innerText = formatPrice(parseFloat(val));
    applyFilters(false);
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

    if (typeof window.currentHeroIdx !== 'number' || window.currentHeroIdx >= state.heroSlides.length) {
        window.currentHeroIdx = 0;
    }

    const currentSlide = state.heroSlides[window.currentHeroIdx];
    if (!currentSlide) return;

    const prevIdx = (window.currentHeroIdx - 1 + state.heroSlides.length) % state.heroSlides.length;
    const nextIdx = (window.currentHeroIdx + 1) % state.heroSlides.length;

    const hasTitle = currentSlide.title && currentSlide.title.trim() !== '';
    const hasDesc = currentSlide.desc && currentSlide.desc.trim() !== '';
    const hasAnyText = hasTitle || hasDesc;

    container.innerHTML = `
        <div class="relative w-full aspect-[16/10] sm:aspect-[16/8] md:h-[460px] rounded-3xl overflow-hidden group shadow-2xl border border-[#D4AF37]/40 bg-[#080808]">
            
            <!-- خلفية مضببة من نفس الصورة لملء أي فراغات بشكل سينمائي فاخر -->
            <img src="${currentSlide.image}" class="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none">
            
            <!-- الصورة الأساسية كاملة 100% بدون قص الأطراف على الهاتف -->
            <img src="${currentSlide.image}" class="relative z-10 w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-700" loading="lazy">
            
            <!-- تدرج سفلي يظهر فقط عند وجود نص، مع بقاء زر تسوق الآن -->
            <div class="absolute inset-0 z-20 ${hasAnyText ? 'bg-gradient-to-t from-black/95 via-black/30 to-transparent' : ''} flex flex-col justify-end items-center text-center p-4 sm:p-8 pointer-events-none">
                ${hasTitle ? `<h1 class="text-lg sm:text-2xl md:text-4xl font-black text-white mb-1 sm:mb-2 drop-shadow-2xl line-clamp-1">${currentSlide.title}</h1>` : ''}
                ${hasDesc ? `<p class="text-gray-300 text-[11px] sm:text-sm mb-3 sm:mb-5 drop-shadow-lg max-w-xl line-clamp-2">${currentSlide.desc}</p>` : ''}
                <button onclick="safeCall('filterCategory', 'جميع المنتجات')" class="pointer-events-auto px-6 py-2 sm:px-8 sm:py-3 gold-gradient text-black text-xs sm:text-sm font-extrabold rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105 transition cursor-pointer">
                    تسوق الآن 🔥
                </button>
            </div>

            ${state.heroSlides.length > 1 ? `
                <!-- أزرار تقليب سريع يمين ويسار -->
                <button onclick="safeCall('setHeroSlide', ${prevIdx})" class="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition cursor-pointer backdrop-blur-sm">
                    <i class="fa-solid fa-chevron-right text-xs sm:text-sm"></i>
                </button>
                <button onclick="safeCall('setHeroSlide', ${nextIdx})" class="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition cursor-pointer backdrop-blur-sm">
                    <i class="fa-solid fa-chevron-left text-xs sm:text-sm"></i>
                </button>
            ` : ''}
        </div>
    `;

    if (dotsContainer) {
        dotsContainer.innerHTML = state.heroSlides.map((_, idx) => `
            <button onclick="safeCall('setHeroSlide', ${idx})" class="h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === window.currentHeroIdx ? 'bg-[#D4AF37] w-8' : 'bg-gray-600 w-2'}"></button>
        `).join('');
    }

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
