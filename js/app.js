let currentBannerIdx = 0;
let currentHeroIdx = 0;
let activeCategoryFilter = 'جميع المنتجات';

let logoClickCount = 0;
let logoClickTimer = null;

// 🌟 دالة إظهار وإخفاء شاشة الافتتاح الفاخرة (تظهر مرة واحدة لكل جلسة)
function initLuxurySplashScreen() {
    const splash = document.getElementById('luxury-splash-screen');
    if (!splash) return;

    const hasSeenSplash = sessionStorage.getItem('has_seen_splash');

    if (hasSeenSplash) {
        splash.style.display = 'none';
    } else {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                sessionStorage.setItem('has_seen_splash', 'true');
            }, 700);
        }, 1800);
    }
}

// دالة نقر الشعار لفتح النافذة
function handleLogoClick(event) {
    if (event) event.preventDefault();
    logoClickCount++;
    
    if (logoClickTimer) clearTimeout(logoClickTimer);

    if (logoClickCount >= 3) {
        logoClickCount = 0;
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        } else {
            showPage('admin');
        }
        return;
    }

    logoClickTimer = setTimeout(() => {
        if (logoClickCount < 3) {
            showPage('home');
        }
        logoClickCount = 0;
    }, 600);
}

function handleLiveSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    
    const q = query.trim().toLowerCase();
    if (!q) {
        if (dropdown) dropdown.classList.add('hidden');
        if (mobileDropdown) mobileDropdown.classList.add('hidden');
        return;
    }

    const matches = products.filter(p => {
        const skinsStr = Array.isArray(p.skinTypes) ? p.skinTypes.join(' ') : (p.skinType || '');
        const hairsStr = Array.isArray(p.hairTypes) ? p.hairTypes.join(' ') : (p.hairType || '');
        
        return (p.name && p.name.toLowerCase().includes(q)) || 
               (p.category && p.category.toLowerCase().includes(q)) ||
               (p.brand && p.brand.toLowerCase().includes(q)) ||
               skinsStr.toLowerCase().includes(q) ||
               hairsStr.toLowerCase().includes(q) ||
               (p.colors && p.colors.toLowerCase().includes(q)) ||
               (p.numbers && p.numbers.toLowerCase().includes(q));
    }).slice(0, 5);

    let htmlContent = '';
    if (matches.length === 0) {
        htmlContent = '<div class="p-4 text-xs text-amber-400 text-center leading-relaxed">المنتج غير متوفر، تأكد من البحث عنه يدويا من الفئات حسب نوعية المنتج</div>';
    } else {
        htmlContent = matches.map(p => `
            <div onclick="openLandingPage('${p.id}'); hideAllDropdowns();" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || p.image || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black">
                <div class="text-right">
                    <p class="text-xs font-bold text-white truncate">${p.name}</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">${(p.price || 0).toLocaleString()} دج</p>
                </div>
            </div>
        `).join('');
    }

    if (dropdown) {
        dropdown.innerHTML = htmlContent;
        dropdown.classList.remove('hidden');
    }
    if (mobileDropdown) {
        mobileDropdown.innerHTML = htmlContent;
        mobileDropdown.classList.remove('hidden');
    }
}

function handleSearchKeydown(event, query) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const q = query.trim().toLowerCase();
        if (!q) return;
        const found = products.find(p => (p.name && p.name.toLowerCase().includes(q)));
        hideAllDropdowns();
        if (found) {
            openLandingPage(found.id);
        } else {
            showCustomAlert('غير متوفر', 'المنتج غير متوفر، تأكد من البحث عنه يدويا من الفئات حسب نوعية المنتج', false);
        }
    }
}

function hideAllDropdowns() {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (mobileDropdown) mobileDropdown.classList.add('hidden');
}

function renderDynamicSidebarFilters() {
    const dynamicContainer = document.getElementById('dynamic-category-filters');
    if (!dynamicContainer) return;

    const activeCat = (activeCategoryFilter || 'جميع المنتجات').trim().toLowerCase();
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
                    ${availableSkinTypes.map(st => `
                        <label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${st}" onchange="applyFilters()" class="skin-filter-cb accent-[#D4AF37]"> ${st}</label>
                    `).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ نوع الشعر والعلاج</h4>
                <div class="space-y-1 text-xs text-gray-300 max-h-36 overflow-y-auto pr-1">
                    ${availableHairTypes.map(ht => `
                        <label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${ht}" onchange="applyFilters()" class="hair-filter-cb accent-[#D4AF37]"> ${ht}</label>
                    `).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">💍 نوع المعدن والقطعة</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="بلاكيور أور" onchange="applyFilters()" class="metal-cb accent-[#D4AF37]"> بلاكيور أور</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="أسي إينوكسيدابل / Steel" onchange="applyFilters()" class="metal-cb accent-[#D4AF37]"> أسي إينوكسيدابل / Steel</label>
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🎁 أشكال العلب</h4>
                <div class="space-y-1 text-xs text-gray-300 max-h-32 overflow-y-auto pr-1">
                    ${shapes.map(sh => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${sh}" onchange="applyFilters()" class="giftshape-cb accent-[#D4AF37]"> ${sh}</label>`).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">💄 المايكاب</h4>
                <div class="space-y-1 text-xs text-gray-300 max-h-32 overflow-y-auto pr-1">
                    ${makeups.map(mk => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${mk}" onchange="applyFilters()" class="makeup-cb accent-[#D4AF37]"> ${mk}</label>`).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🌸 العطور</h4>
                <div class="space-y-1 text-xs text-gray-300">
                    ${perfumes.map(pf => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${pf}" onchange="applyFilters()" class="perfume-cb accent-[#D4AF37]"> ${pf}</label>`).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🎀 إكسسوارات الشعر</h4>
                <div class="space-y-1 text-xs text-gray-300 max-h-32 overflow-y-auto pr-1">
                    ${hairaccs.map(ha => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${ha}" onchange="applyFilters()" class="hairacc-cb accent-[#D4AF37]"> ${ha}</label>`).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🎁 الهدايا</h4>
                <div class="space-y-1 text-xs text-gray-300">
                    ${gifts.map(g => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${g}" onchange="applyFilters()" class="gift-cb accent-[#D4AF37]"> ${g}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat.includes('كوسمتيك')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ منطقة الاستخدام:</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="للوجه" onchange="applyFilters()" class="cos-area-cb accent-[#D4AF37]"> للوجه</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="للجسد" onchange="applyFilters()" class="cos-area-cb accent-[#D4AF37]"> للجسد</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="للشعر" onchange="applyFilters()" class="cos-area-cb accent-[#D4AF37]"> للشعر</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="للتدليك والعناية" onchange="applyFilters()" class="cos-area-cb accent-[#D4AF37]"> للتدليك والعناية</label>
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ نوع البشرة:</h4>
                <div class="space-y-1 text-xs text-gray-300">
                    ${availableSkinTypes.map(st => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${st}" onchange="applyFilters()" class="skin-filter-cb accent-[#D4AF37]"> ${st}</label>`).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ نوع الشعر:</h4>
                <div class="space-y-1 text-xs text-gray-300">
                    ${availableHairTypes.map(ht => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${ht}" onchange="applyFilters()" class="hair-filter-cb accent-[#D4AF37]"> ${ht}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat.includes('بلاكيور') || activeCat.includes('اصي')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">💍 نوع المعدن:</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="بلاكيور أور" onchange="applyFilters()" class="metal-cb accent-[#D4AF37]"> بلاكيور أور</label>
                    <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="أسي إينوكسيدابل / Steel" onchange="applyFilters()" class="metal-cb accent-[#D4AF37]"> أسي إينوكسيدابل / Steel</label>
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">💍 نوع القطعة:</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    ${["سلسلة", "خاتم", "قورمات", "بارور", "مناقش", "خلخال"].map(pt => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${pt}" onchange="applyFilters()" class="jewelry-type-cb accent-[#D4AF37]"> ${pt}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat === 'علب' || activeCat.includes('علب')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🎁 شكل ومادة الصندوق:</h4>
                <div class="space-y-1.5 text-xs text-gray-300 max-h-48 overflow-y-auto pr-1">
                    ${shapes.map(sh => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${sh}" onchange="applyFilters()" class="giftshape-cb accent-[#D4AF37]"> ${sh}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat.includes('مايكاب')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">💄 نوع منتج المايكاب:</h4>
                <div class="space-y-1.5 text-xs text-gray-300 max-h-52 overflow-y-auto pr-1">
                    ${makeups.map(mk => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${mk}" onchange="applyFilters()" class="makeup-cb accent-[#D4AF37]"> ${mk}</label>`).join('')}
                </div>
            </div>
            <hr class="border-gray-800">
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">✨ نوع البشرة:</h4>
                <div class="space-y-1 text-xs text-gray-300">
                    ${availableSkinTypes.map(st => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${st}" onchange="applyFilters()" class="skin-filter-cb accent-[#D4AF37]"> ${st}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat.includes('عطور')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🌸 فئة العطر والاستخدام:</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    ${perfumes.map(pf => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${pf}" onchange="applyFilters()" class="perfume-cb accent-[#D4AF37]"> ${pf}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat.includes('اكسسوارات شعر')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🎀 نوع الإكسسوار:</h4>
                <div class="space-y-1.5 text-xs text-gray-300 max-h-48 overflow-y-auto pr-1">
                    ${hairaccs.map(ha => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${ha}" onchange="applyFilters()" class="hairacc-cb accent-[#D4AF37]"> ${ha}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else if (activeCat === 'هدايا' || activeCat.includes('هدايا')) {
        html = `
            <div class="space-y-3">
                <h4 class="font-bold text-xs text-[#D4AF37]">🎁 نوع الهدية:</h4>
                <div class="space-y-1.5 text-xs text-gray-300">
                    ${gifts.map(g => `<label class="flex items-center gap-2 cursor-pointer py-0.5"><input type="checkbox" value="${g}" onchange="applyFilters()" class="gift-cb accent-[#D4AF37]"> ${g}</label>`).join('')}
                </div>
            </div>
        `;
    } 
    else {
        html = '';
    }

    dynamicContainer.innerHTML = html;
}

function applyFilters() {
    if (!products || !Array.isArray(products)) return;

    let filtered = [...products];

    if (activeCategoryFilter && activeCategoryFilter !== 'جميع المنتجات' && activeCategoryFilter !== 'الجميع') {
        const targetCat = activeCategoryFilter.trim().toLowerCase();
        filtered = filtered.filter(p => {
            const pCat = (p.category || '').trim().toLowerCase();
            return pCat === targetCat || pCat.includes(targetCat) || targetCat.includes(pCat);
        });
    }

    const inStockOnly = document.getElementById('filter-in-stock-only')?.checked;
    if (inStockOnly) {
        filtered = filtered.filter(p => p.inStock === true);
    }

    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) {
        const maxPrice = parseFloat(priceRangeInput.value) || 20000;
        filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
    }

    const selCosAreas = Array.from(document.querySelectorAll('.cos-area-cb:checked')).map(cb => cb.value);
    if (selCosAreas.length > 0) filtered = filtered.filter(p => selCosAreas.includes(p.cosmeticArea));

    const selMetals = Array.from(document.querySelectorAll('.metal-cb:checked')).map(cb => cb.value);
    if (selMetals.length > 0) filtered = filtered.filter(p => selMetals.includes(p.jewelryMetal));

    const selJewelryTypes = Array.from(document.querySelectorAll('.jewelry-type-cb:checked')).map(cb => cb.value);
    if (selJewelryTypes.length > 0) filtered = filtered.filter(p => selJewelryTypes.includes(p.jewelryType));

    const selGiftShapes = Array.from(document.querySelectorAll('.giftshape-cb:checked')).map(cb => cb.value);
    if (selGiftShapes.length > 0) filtered = filtered.filter(p => selGiftShapes.includes(p.giftboxShape));

    const selMakeups = Array.from(document.querySelectorAll('.makeup-cb:checked')).map(cb => cb.value);
    if (selMakeups.length > 0) filtered = filtered.filter(p => selMakeups.includes(p.makeupType));

    const selPerfumes = Array.from(document.querySelectorAll('.perfume-cb:checked')).map(cb => cb.value);
    if (selPerfumes.length > 0) filtered = filtered.filter(p => selPerfumes.includes(p.perfumeTarget));

    const selHairaccs = Array.from(document.querySelectorAll('.hairacc-cb:checked')).map(cb => cb.value);
    if (selHairaccs.length > 0) filtered = filtered.filter(p => selHairaccs.includes(p.hairaccType));

    const selGifts = Array.from(document.querySelectorAll('.gift-cb:checked')).map(cb => cb.value);
    if (selGifts.length > 0) filtered = filtered.filter(p => selGifts.includes(p.giftOccasion));

    const selectedSkinTypes = Array.from(document.querySelectorAll('.skin-filter-cb:checked')).map(cb => cb.value);
    if (selectedSkinTypes.length > 0) {
        filtered = filtered.filter(p => {
            const pSkins = Array.isArray(p.skinTypes) ? p.skinTypes : (p.skinType ? [p.skinType] : []);
            return selectedSkinTypes.some(st => pSkins.includes(st));
        });
    }

    const selectedHairTypes = Array.from(document.querySelectorAll('.hair-filter-cb:checked')).map(cb => cb.value);
    if (selectedHairTypes.length > 0) {
        filtered = filtered.filter(p => {
            const pHairs = Array.isArray(p.hairTypes) ? p.hairTypes : (p.hairType ? [p.hairType] : []);
            return selectedHairTypes.some(ht => pHairs.includes(ht));
        });
    }

    const sortSelect = document.getElementById('sort-select');
    const sortVal = sortSelect ? sortSelect.value : 'best';

    if (sortVal === 'low') {
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortVal === 'high') {
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
        filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }

    const catalogGrid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    if (badge) badge.innerText = filtered.length;

    if (catalogGrid) {
        catalogGrid.innerHTML = filtered.length === 0 ? 
            '<div class="col-span-full text-center py-16 space-y-3"><i class="fa-solid fa-box-open text-4xl text-gray-600"></i><p class="text-gray-400 text-sm">لا توجد منتجات مطابقة لهذه الخيارات حالياً.</p><button onclick="filterCategory(\'جميع المنتجات\')" class="text-xs text-[#D4AF37] underline font-bold cursor-pointer">عرض جميع المنتجات</button></div>' :
            filtered.map(p => renderSingleProductCard(p)).join('');
    }
}

function filterCategory(catName) {
    activeCategoryFilter = catName.trim();
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = activeCategoryFilter;

    renderDynamicSidebarFilters();
    applyFilters();
    showPage('catalog');
}

function resetFilters() {
    activeCategoryFilter = 'جميع المنتجات';
    const inStockCb = document.getElementById('filter-in-stock-only');
    if (inStockCb) inStockCb.checked = false;

    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) priceRangeInput.value = 20000;
    
    updatePriceFilter(20000);
    renderDynamicSidebarFilters();
    applyFilters();
}

function initBannerRealtimeSync() {
    const bannerEl = document.getElementById('top-announcement-text');
    if (!bannerEl) return;

    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists && doc.data().bannerMessages && doc.data().bannerMessages.length > 0) {
            bannerMessages = doc.data().bannerMessages;
        } else {
            bannerMessages = ["🚚 التوصيل متوفر لجميع الولايات والدفع عند الاستلام"];
        }

        if (currentBannerIdx >= bannerMessages.length) currentBannerIdx = 0;
        bannerEl.innerText = bannerMessages[currentBannerIdx];
        startBannerTicker();
    });
}

function startBannerTicker() {
    const bannerEl = document.getElementById('top-announcement-text');
    if (!bannerEl) return;
    if (window.bannerTickerTimer) clearInterval(window.bannerTickerTimer);

    window.bannerTickerTimer = setInterval(() => {
        if (!bannerMessages || bannerMessages.length === 0) return;
        bannerEl.style.opacity = '0';
        setTimeout(() => {
            currentBannerIdx = (currentBannerIdx + 1) % bannerMessages.length;
            bannerEl.innerText = bannerMessages[currentBannerIdx];
            bannerEl.style.opacity = '1';
        }, 300);
    }, 3000);
}

function renderHeroSlider() {
    const container = document.getElementById('hero-slider-container');
    const dotsContainer = document.getElementById('hero-slider-dots');
    if (!container || !heroSlides || heroSlides.length === 0) return;

    const currentSlide = heroSlides[currentHeroIdx];

    container.innerHTML = `
        <div class="relative w-full h-[450px] md:h-[500px] rounded-3xl overflow-hidden group shadow-2xl border border-[#D4AF37]/30">
            <img src="${currentSlide.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Hero Banner">
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-center items-center text-center p-6 md:p-12 transition-opacity duration-500 group-hover:opacity-0 pointer-events-none">
                <span class="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold mb-4 backdrop-blur-md">✨ التشكيلة الحصرية 2026</span>
                <h1 class="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-2xl max-w-3xl leading-tight">${currentSlide.title}</h1>
                <p class="text-gray-200 text-sm md:text-lg font-medium max-w-2xl mb-6 drop-shadow-lg">${currentSlide.desc}</p>
                <button onclick="filterCategory('جميع المنتجات')" class="pointer-events-auto px-8 py-3.5 gold-gradient text-black font-extrabold rounded-full shadow-xl hover:scale-105 transition cursor-pointer">تسوقي الآن 🔥</button>
            </div>
        </div>
    `;

    if (dotsContainer) {
        dotsContainer.innerHTML = heroSlides.map((_, idx) => `
            <button onclick="setHeroSlide(${idx})" class="h-2.5 rounded-full transition-all duration-300 ${idx === currentHeroIdx ? 'bg-[#D4AF37] w-8' : 'bg-gray-600 w-2.5'}"></button>
        `).join('');
    }
}

function setHeroSlide(idx) {
    currentHeroIdx = idx;
    renderHeroSlider();
}

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin' && typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (pageId === 'cart') {
        renderCart();
        populateCartWilayas();
    }
    if (pageId === 'wishlist') renderWishlistPage();
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

function renderSingleProductCard(p) {
    let displayImg = 'https://via.placeholder.com/300';
    if (p.images && Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
        displayImg = p.images[0];
    } else if (p.image) {
        displayImg = p.image;
    }

    const isFav = Array.isArray(favorites) && favorites.includes(p.id);

    return `
        <div class="bg-white text-gray-900 rounded-2xl border p-4 text-right flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all duration-300 transform hover:-translate-y-2 group relative">
            <button onclick="event.stopPropagation(); toggleFavorite('${p.id}');" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm cursor-pointer">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>

            <div class="cursor-pointer" onclick="openLandingPage('${p.id}')">
                <div class="h-48 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center overflow-hidden">
                    <img src="${displayImg}" class="max-h-full object-contain group-hover:scale-105 transition duration-500" onerror="this.src='https://via.placeholder.com/300'">
                </div>

                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="w-2 h-2 rounded-full ${p.inStock !== false ? 'bg-green-500 animate-ping' : 'bg-red-500'}"></span>
                    <span class="text-[10px] font-bold ${p.inStock !== false ? 'text-green-600' : 'text-red-500'}">${p.inStock !== false ? 'متوفر' : 'غير متوفر'}</span>
                </div>

                <h3 class="font-bold text-sm text-gray-900 truncate my-1 group-hover:text-[#B8860B] transition">${p.name || 'منتج'}</h3>

                <div class="flex items-center gap-2 mb-1">
                    <span class="font-black text-base text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</span>
                    ${p.oldPrice ? `<span class="text-xs text-gray-400 line-through">${p.oldPrice.toLocaleString()} دج</span>` : ''}
                </div>

                <div class="flex items-center gap-1 text-amber-400 text-xs mb-3">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <button onclick="event.stopPropagation(); addToCart('${p.id}');" class="w-full py-2.5 bg-black text-white hover:bg-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف إلى السلة
                </button>
                <button onclick="event.stopPropagation(); openLandingPage('${p.id}');" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition cursor-pointer">
                    اطلب الآن 🔥
                </button>
            </div>
        </div>
    `;
}

function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('lb_favs_v7', JSON.stringify(favorites));
    updateBadges();
    if (typeof applyFilters === 'function') applyFilters();
    renderProducts();
    if (document.getElementById('page-wishlist').classList.contains('active')) renderWishlistPage();
}

function renderWishlistPage() {
    const grid = document.getElementById('wishlist-products-grid');
    if (!grid) return;
    const favProducts = products.filter(p => favorites.includes(p.id));
    grid.innerHTML = favProducts.length === 0 ? '<p class="col-span-full text-center text-gray-400 py-12">لم تقم بإضافة أي منتج للمفضلة بعد.</p>' : favProducts.map(p => renderSingleProductCard(p)).join('');
}

function updateBadges() {
    const cartBadge = document.getElementById('cart-badge');
    const wishBadge = document.getElementById('wishlist-badge');
    if (cartBadge) cartBadge.innerText = cart.length;
    if (wishBadge) wishBadge.innerText = favorites.length;
}

function addToCart(id) {
    const prod = products.find(p => p.id === id);
    if (prod) {
        cart.push(prod);
        localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
        updateBadges();
        showCustomAlert('تمت الإضافة! 🛍️', `تمت إضافة "${prod.name}" إلى السلة بنجاح.`, true);
    }
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-center text-gray-400 py-8">سلة التسوق فارغة حالياً.</p>';
        updateCartCalculations();
        return;
    }

    cartList.innerHTML = cart.map((prod, idx) => {
        const img = (prod.images && prod.images[0]) || prod.image || 'https://via.placeholder.com/100';
        return `
            <div class="flex items-center justify-between border-b border-gray-800 pb-4">
                <div class="flex items-center gap-4">
                    <img src="${img}" class="w-16 h-16 object-contain rounded-xl bg-black border border-gray-800">
                    <div>
                        <h4 class="font-bold text-sm text-white">${prod.name}</h4>
                        <span class="text-xs text-[#D4AF37] font-bold">${(prod.price || 0).toLocaleString()} دج</span>
                    </div>
                </div>
                <button onclick="removeFromCart(${idx})" class="text-red-500 hover:text-red-400 font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                    <i class="fa-solid fa-trash-can"></i> حذف
                </button>
            </div>
        `;
    }).join('');

    updateCartCalculations();
}

function populateCartWilayas() {
    const select = document.getElementById('cart-cust-wilaya');
    if (!select) return;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleCartWilayaChange() {
    const code = document.getElementById('cart-cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeSelect = document.getElementById('cart-cust-commune');
    
    if (wilaya && communeSelect) {
        const communesList = wilaya.communesData || [];
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>' + 
            communesList.map(c => `<option value="${c.name}">${c.name} (${c.cost} دج)</option>`).join('');
    } else if (communeSelect) {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
    }
    updateCartCalculations();
}

function updateCartCalculations() {
    const subtotalEl = document.getElementById('subtotal');
    const shipCostEl = document.getElementById('cart-shipping-cost');
    const totalEl = document.getElementById('total');

    let subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);

    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const communeName = document.getElementById('cart-cust-commune')?.value;
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';

    let shipCost = 0;
    if (wilaya) {
        if (shipType === 'office') {
            shipCost = wilaya.officeCost || 0;
        } else {
            const communeObj = (wilaya.communesData || []).find(c => c.name === communeName);
            shipCost = communeObj ? communeObj.cost : (wilaya.communesData && wilaya.communesData[0] ? wilaya.communesData[0].cost : 0);
        }
    }

    if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString() + ' دج';
    if (shipCostEl) shipCostEl.innerText = wilaya ? (shipCost.toLocaleString() + ' دج') : 'حدد الولاية والبلدية';
    
    const grandTotal = subtotal + shipCost;
    if (totalEl) totalEl.innerText = grandTotal.toLocaleString() + ' دج';
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
    updateBadges();
    renderCart();
}

function submitCartCheckout() {
    if (cart.length === 0) {
        showCustomAlert('السلة فارغة!', 'يرجى إضافة منتجات للسلة أولاً.', false);
        return;
    }

    const name = document.getElementById('cart-cust-name')?.value.trim();
    const phone = document.getElementById('cart-cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const commune = document.getElementById('cart-cust-commune')?.value;

    if (!name || !wilayaCode) {
        showCustomAlert('تنبيه هام!', storeSettings.msgWarning || 'يرجى ملء كافة معلومات الاستمارة الضرورية!', false);
        return;
    }

    if (typeof isValidDzPhone === 'function' && !isValidDzPhone(phone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام ويبدأ بـ 05 أو 06 أو 07.', false);
        return;
    }

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    
    let shipCost = 0;
    if (wilaya) {
        if (shipType === 'office') {
            shipCost = wilaya.officeCost || 0;
        } else {
            const communeObj = (wilaya.communesData || []).find(c => c.name === commune);
            shipCost = communeObj ? communeObj.cost : (wilaya.officeCost || 0);
        }
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const itemsNames = cart.map(item => item.name).join(' + ');

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: commune || 'المكتب',
        product: `طلبية سلة: (${itemsNames})`,
        total: subtotal + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        cart = [];
        localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
        updateBadges();
        renderCart();
        showCustomAlert('تم استلام الطلب الكامل! 🎉', storeSettings.msgSuccess || 'تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.', true);
        showPage('home');
    }).catch(err => {
        showCustomAlert('خطأ', 'حدث خطأ أثناء إرسال الطلب: ' + err.message, false);
    });
}

function updatePriceFilter(val) {
    const valEl = document.getElementById('price-range-val');
    if (valEl) valEl.innerText = parseFloat(val).toLocaleString() + ' دج';
    applyFilters();
}

function renderProducts() {
    const grid = document.getElementById('home-products');
    if (!grid) return;

    let bestSellers = [...products];
    bestSellers.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    const homeList = bestSellers.slice(0, 8);

    grid.innerHTML = homeList.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">جاري تحميل المنتجات...</p>' :
        homeList.map(p => renderSingleProductCard(p)).join('');
}

function updateAppHeaderInfo() {
    const titleEl = document.getElementById('site-title');
    if (titleEl) titleEl.innerText = (storeSettings.name || 'كوسمتيك عبد الحق') + ' | المتجر الفاخر';

    const nameEl = document.getElementById('store-name-display');
    if (nameEl) nameEl.innerText = storeSettings.name || 'كوسمتيك عبد الحق';

    const sloganEl = document.getElementById('store-slogan-display');
    if (sloganEl && storeSettings.slogan) {
        sloganEl.innerText = `"${storeSettings.slogan}"`;
    }

    const logoImg = document.getElementById('store-logo-img');
    const logoIcon = document.getElementById('store-logo-icon');
    if (logoImg && storeSettings.logoUrl) {
        logoImg.src = storeSettings.logoUrl;
        logoImg.classList.remove('hidden');
        if (logoIcon) logoIcon.classList.add('hidden');
    }

    const navEl = document.getElementById('header-nav');
    if (navEl) {
        navEl.innerHTML = `
            <button onclick="filterCategory('جميع المنتجات')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">جميع المنتجات</button>
        ` + categories.map(c => `<button onclick="filterCategory('${c.name}')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">${c.name}</button>`).join('');
    }

    const mobileListEl = document.getElementById('mobile-drawer-categories');
    if (mobileListEl) {
        mobileListEl.innerHTML = `
            <button onclick="showPage('home'); toggleMobileMenu();" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-[#D4AF37] font-bold mb-2">الرئيسية</button>
            <button onclick="filterCategory('جميع المنتجات'); toggleMobileMenu();" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-white font-bold mb-2">جميع المنتجات</button>
        ` + categories.map(c => `<button onclick="filterCategory('${c.name}'); toggleMobileMenu();" class="w-full text-right p-3 rounded-xl bg-[#1e1e1e] text-gray-200 hover:text-[#D4AF37] font-bold mb-2">${c.name}</button>`).join('');
    }

    const homeCatGrid = document.getElementById('home-category-cards');
    if (homeCatGrid) {
        homeCatGrid.innerHTML = categories.map(c => `
            <div onclick="filterCategory('${c.name}')" class="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl p-4 text-center cursor-pointer hover:border-[#D4AF37] transition flex flex-col items-center justify-center space-y-2 shadow-lg group">
                <div class="w-14 h-14 rounded-2xl p-0.5 gold-gradient overflow-hidden shadow-md group-hover:scale-105 transition">
                    <img src="${c.image}" class="w-full h-full object-cover rounded-xl bg-black">
                </div>
                <h3 class="text-white font-bold text-sm tracking-wide group-hover:text-[#D4AF37]">${c.name}</h3>
            </div>
        `).join('');
    }
}

let currentOrderTickerIndex = 0;
function initRealOrdersTicker() {
    const toast = document.getElementById('social-proof-toast');
    const spCustomer = document.getElementById('sp-customer');
    const spProduct = document.getElementById('sp-product');
    if (!toast || !spCustomer || !spProduct) return;

    if (window.ordersTickerTimer) clearInterval(window.ordersTickerTimer);

    window.ordersTickerTimer = setInterval(() => {
        if (!orders || orders.length === 0) return;
        if (currentOrderTickerIndex >= orders.length) currentOrderTickerIndex = 0;

        const currentOrder = orders[currentOrderTickerIndex];
        spCustomer.innerText = `${currentOrder.customer || 'زبون'} من ${currentOrder.wilaya || 'الجزائر'}`;
        spProduct.innerText = `اشترى ${currentOrder.product || 'منتج'} منذ قليل`;
        
        toast.classList.remove('translate-y-28', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-28', 'opacity-0'), 4500);

        currentOrderTickerIndex++;
    }, 12000);
}

document.addEventListener('DOMContentLoaded', () => {
    initLuxurySplashScreen();
    safeCall('updateAppHeaderInfo');
    safeCall('updateBadges');
    safeCall('renderHeroSlider');
    safeCall('renderProducts');
    safeCall('initBannerRealtimeSync');
    safeCall('initRealOrdersTicker');
    safeCall('renderDynamicSidebarFilters');
});
