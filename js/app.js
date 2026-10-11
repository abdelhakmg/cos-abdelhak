let currentBannerIdx = 0;
let currentHeroIdx = 0;
let activeCategoryFilter = 'جميع المنتجات';

let logoClickCount = 0;
let logoClickTimer = null;

// 🌟 شاشة الافتتاح الفاخرة (تعمل مع كل تحديث للصفحة لمدة 4 ثوانٍ وتختفي بسلاسة دون التأثير على محتوى المتجر)
function initLuxurySplashScreen() {
    const splash = document.getElementById('luxury-splash-screen');
    if (!splash) return;

    splash.style.display = 'flex';
    splash.style.opacity = '1';
    splash.style.transition = 'opacity 0.7s ease-in-out';

    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 700);
    }, 3000);
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
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active', 'hidden'));
    document.querySelectorAll('.page-sec').forEach(el => {
        if(el.id !== 'page-' + pageId) el.classList.add('hidden');
    });
    
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (pageId === 'admin' && typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (pageId === 'cart') {
        renderCart();
        populateCartWilayas();
    }
    if (pageId === 'wishlist') renderWishlistPage();
    if (pageId === 'gift-builder') initGiftBuilderUI();
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


// 🌟 GIFT BUILDER INTERACTIVE SYSTEM (نظام تصميم الهدايا المتكامل) 🌟
let giftState = {
    step: 1,
    occasion: 'عيد ميلاد',
    budget: 5000,
    selectedProducts: [],
    selectedBox: null,
    ribbonColor: 'ذهبي',
    recipientName: '',
    senderName: '',
    messageText: ''
};

const defaultOccasions = [
    { name: 'عيد ميلاد', icon: 'fa-cake-candles' },
    { name: 'للحبيبة / الزوجة', icon: 'fa-heart' },
    { name: 'للأم', icon: 'fa-person-breastfeeding' },
    { name: 'للأب / الرجال', icon: 'fa-user-tie' },
    { name: 'تخرج ونجاح', icon: 'fa-graduation-cap' },
    { name: 'مفاجأة خاصة', icon: 'fa-wand-magic-sparkles' }
];

const giftMsgTemplates = [
    "عيد ميلاد سعيد، أتمنى لك أجمل الأيام! 🎉",
    "إلى أغلى إنسانة في حياتي، هدية بسيطة من القلب. ❤️",
    "ألف مبروك النجاح والتخرج، أتمنى لك مستقبلاً رائعاً! 🎓",
    "كل الحب والتقدير، هدية صغيرة لشخص غالٍ. ✨"
];

function initGiftBuilderUI() {
    renderOccasionsGrid();
    renderBudgetOptions();
    renderGiftMsgTemplates();
    populateGiftWilayas();
}

function renderOccasionsGrid() {
    const grid = document.getElementById('gift-occasions-grid');
    if (!grid) return;
    grid.innerHTML = defaultOccasions.map(occ => `
        <button type="button" onclick="selectGiftOccasion('${occ.name}')" class="occ-card border p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer ${giftState.occasion === occ.name ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black/40'}">
            <i class="fa-solid ${occ.icon} text-lg text-[#D4AF37]"></i>
            <span class="text-xs font-bold text-white">${occ.name}</span>
        </button>
    `).join('');
}

function selectGiftOccasion(occName) {
    giftState.occasion = occName;
    renderOccasionsGrid();
}

function renderBudgetOptions() {
    const container = document.getElementById('gift-budget-options');
    if (!container) return;
    const options = [2000, 3000, 5000, 10000];
    container.innerHTML = options.map(b => `
        <button type="button" onclick="setGiftBudget(${b})" class="px-4 py-2 rounded-xl text-xs font-bold border transition ${giftState.budget === b ? 'border-[#D4AF37] gold-gradient text-black' : 'border-gray-800 bg-black text-gray-300'}">
            ${b.toLocaleString()} دج
        </button>
    `).join('');
}

function setGiftBudget(amount) {
    giftState.budget = amount;
    const customInput = document.getElementById('gift-custom-budget');
    if (customInput) customInput.value = '';
    renderBudgetOptions();
}

function setCustomGiftBudget(val) {
    giftState.budget = parseFloat(val) || 0;
    renderBudgetOptions();
}

function goToGiftStep(stepNum) {
    giftState.step = stepNum;
    document.querySelectorAll('.gift-step-content').forEach(el => el.classList.add('hidden'));
    const currentStepEl = document.getElementById(`gift-step-${stepNum}`);
    if (currentStepEl) currentStepEl.classList.remove('hidden');

    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`step-btn-${i}`);
        if (btn) {
            const circle = btn.querySelector('div');
            if (i <= stepNum) {
                circle.className = "w-9 h-9 rounded-full gold-gradient text-black font-black text-xs flex items-center justify-center shadow-md";
            } else {
                circle.className = "w-9 h-9 rounded-full bg-gray-800 text-gray-400 font-black text-xs flex items-center justify-center shadow-md";
            }
        }
    }

    if (stepNum === 2) renderBuilderProducts();
    if (stepNum === 3) renderBuilderBoxes();
    if (stepNum === 5) renderGiftFinalPreview();
}

function renderBuilderProducts(categoryFilter = 'الجميع') {
    const grid = document.getElementById('builder-products-grid');
    const tabs = document.getElementById('builder-cat-filter-tabs');
    if (!grid) return;

    const realAvailableProducts = typeof products !== 'undefined' ? products.filter(p => p.inStock !== false && !p.category?.includes('علب')) : [];

    if (tabs && typeof categories !== 'undefined') {
        const catsList = ['الجميع', ...categories.map(c => c.name)];
        tabs.innerHTML = catsList.map(c => `
            <button type="button" onclick="renderBuilderProducts('${c}')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap transition ${categoryFilter === c ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-gray-400 border-gray-800'}">
                ${c}
            </button>
        `).join('');
    }

    let displayed = realAvailableProducts;
    if (categoryFilter !== 'الجميع') {
        displayed = realAvailableProducts.filter(p => p.category === categoryFilter);
    }

    grid.innerHTML = displayed.map(p => {
        const selectedItem = giftState.selectedProducts.find(sp => sp.product.id === p.id);
        const qty = selectedItem ? selectedItem.quantity : 0;
        const img = (p.images && p.images[0]) || p.image || 'https://via.placeholder.com/150';

        return `
            <div class="bg-[#121212] border border-gray-800 rounded-2xl p-3 text-right flex flex-col justify-between">
                <img src="${img}" class="w-full h-28 object-contain rounded-xl bg-black mb-2">
                <h4 class="text-xs font-bold text-white truncate">${p.name}</h4>
                <p class="text-[11px] gold-text font-black my-1">${p.price.toLocaleString()} دج</p>
                <div class="flex items-center justify-between mt-2 bg-black p-1.5 rounded-xl border border-gray-800">
                    <button type="button" onclick="updateGiftProductQty('${p.id}', -1)" class="w-7 h-7 bg-gray-800 text-white rounded-lg font-bold text-xs">-</button>
                    <span class="text-xs font-black text-white">${qty}</span>
                    <button type="button" onclick="updateGiftProductQty('${p.id}', 1)" class="w-7 h-7 gold-gradient text-black rounded-lg font-bold text-xs">+</button>
                </div>
            </div>
        `;
    }).join('');

    updateLiveBuilderTotal();
}

function updateGiftProductQty(prodId, change) {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    let existing = giftState.selectedProducts.find(sp => sp.product.id === prodId);
    if (existing) {
        existing.quantity += change;
        if (existing.quantity <= 0) {
            giftState.selectedProducts = giftState.selectedProducts.filter(sp => sp.product.id !== prodId);
        }
    } else if (change > 0) {
        giftState.selectedProducts.push({ product: prod, quantity: 1 });
    }

    renderBuilderProducts();
}

function updateLiveBuilderTotal() {
    const totalEl = document.getElementById('builder-live-total');
    const prodsTotal = giftState.selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    if (totalEl) totalEl.innerText = prodsTotal.toLocaleString() + ' دج';
}

function validateAndGoToStep(targetStep) {
    if (giftState.selectedProducts.length === 0) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('تنبيه 🎁', 'يرجى اختيار منتج واحد على الأقل لإضافته إلى هديتك!', false);
        } else {
            alert('يرجى اختيار منتج واحد على الأقل!');
        }
        return;
    }
    goToGiftStep(targetStep);
}

function renderBuilderBoxes() {
    const grid = document.getElementById('builder-boxes-grid');
    if (!grid) return;

    const realBoxes = products.filter(p => p.category && p.category.includes('علب'));
    let boxesToDisplay = realBoxes.length > 0 ? realBoxes : [
        { id: 'box-black', name: 'علبة الفخامة السوداء والذهبية', price: 600, image: 'https://via.placeholder.com/150' },
        { id: 'box-white', name: 'علبة الأميرة البيضاء الناعمة', price: 500, image: 'https://via.placeholder.com/150' },
        { id: 'box-pink', name: 'علبة وردية مع شريط ستان', price: 500, image: 'https://via.placeholder.com/150' }
    ];

    if (!giftState.selectedBox && boxesToDisplay.length > 0) {
        giftState.selectedBox = boxesToDisplay[0];
    }

    grid.innerHTML = boxesToDisplay.map(box => {
        const isSelected = giftState.selectedBox && giftState.selectedBox.id === box.id;
        const img = (box.images && box.images[0]) || box.image;
        return `
            <div onclick="selectGiftBox('${box.id}')" class="border p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black/40'}">
                <img src="${img}" class="w-14 h-14 object-contain bg-black rounded-xl border border-gray-800">
                <div class="text-right flex-1">
                    <h4 class="text-xs font-bold text-white">${box.name}</h4>
                    <p class="text-[11px] gold-text font-black mt-1">${box.price.toLocaleString()} دج</p>
                </div>
            </div>
        `;
    }).join('');
}

function selectGiftBox(boxId) {
    const realBox = products.find(p => p.id === boxId);
    if (realBox) {
        giftState.selectedBox = realBox;
    } else {
        giftState.selectedBox = { id: boxId, name: 'علبة فاخرة مخصصة', price: 500, image: 'https://via.placeholder.com/150' };
    }
    renderBuilderBoxes();
}

function selectRibbonColor(colorName) {
    giftState.ribbonColor = colorName;
    if (typeof showCustomAlert === 'function') {
        showCustomAlert('تم الاختيار 🎀', `تم اختيار لون الشريط: ${colorName}`, true);
    }
}

function renderGiftMsgTemplates() {
    const container = document.getElementById('gift-msg-templates');
    if (!container) return;
    container.innerHTML = giftMsgTemplates.map(tmpl => `
        <button type="button" onclick="applyGiftMsgTemplate('${tmpl}')" class="text-[10px] bg-black border border-gray-800 hover:border-[#D4AF37] text-gray-300 p-2 rounded-xl text-right">
            ${tmpl}
        </button>
    `).join('');
}

function applyGiftMsgTemplate(tmpl) {
    const txtArea = document.getElementById('gift-message-text');
    if (txtArea) {
        txtArea.value = tmpl;
        updateMsgCharCount(tmpl);
    }
}

function updateMsgCharCount(val) {
    giftState.messageText = val;
    const cnt = document.getElementById('msg-char-count');
    if (cnt) cnt.innerText = val.length;
}

function renderGiftFinalPreview() {
    giftState.recipientName = document.getElementById('gift-recipient-name')?.value.trim() || 'أغلى الناس';
    giftState.senderName = document.getElementById('gift-sender-name')?.value.trim() || 'صديق مخلص';

    document.getElementById('preview-to-name').innerText = giftState.recipientName;
    document.getElementById('preview-from-name').innerText = giftState.senderName;
    document.getElementById('preview-card-body').innerText = giftState.messageText || 'أتمنى لك أجمل الأيام واللحظات السعيدة!';
    document.getElementById('preview-occasion-badge').innerText = giftState.occasion;
    document.getElementById('preview-ribbon-text').innerText = giftState.ribbonColor;

    if (giftState.selectedBox) {
        const boxImg = (giftState.selectedBox.images && giftState.selectedBox.images[0]) || giftState.selectedBox.image;
        document.getElementById('preview-box-img').src = boxImg;
    }

    const prodsPreviewContainer = document.getElementById('preview-products-list');
    if (prodsPreviewContainer) {
        prodsPreviewContainer.innerHTML = giftState.selectedProducts.map(sp => {
            const pImg = (sp.product.images && sp.product.images[0]) || sp.product.image;
            return `
                <div class="bg-gray-900 border border-gray-800 p-1.5 rounded-xl flex items-center gap-1.5">
                    <img src="${pImg}" class="w-6 h-6 object-contain rounded-md bg-black">
                    <span class="text-[10px] font-bold text-white">${sp.product.name} (x${sp.quantity})</span>
                </div>
            `;
        }).join('');
    }

    const prodsTotal = giftState.selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const boxCost = giftState.selectedBox ? giftState.selectedBox.price : 500;

    document.getElementById('summary-prods-price').innerText = prodsTotal.toLocaleString() + ' دج';
    document.getElementById('summary-box-price').innerText = boxCost.toLocaleString() + ' دج';
    document.getElementById('summary-grand-total').innerText = (prodsTotal + boxCost).toLocaleString() + ' دج';
}

function populateGiftWilayas() {
    const select = document.getElementById('gift-cust-wilaya');
    if (!select || typeof WILAYAS === 'undefined') return;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleGiftWilayaChange() {
    const code = document.getElementById('gift-cust-wilaya').value;
    const wilaya = typeof WILAYAS !== 'undefined' ? WILAYAS.find(w => w.code === code) : null;
    const communeSelect = document.getElementById('gift-cust-commune');
    if (wilaya && communeSelect) {
        const communesList = wilaya.communesData || [];
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>' + 
            communesList.map(c => `<option value="${c.name}">${c.name} (${c.cost} دج)</option>`).join('');
    }
}

function submitGiftOrder() {
    const name = document.getElementById('gift-cust-name')?.value.trim();
    const phone = document.getElementById('gift-cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('gift-cust-wilaya')?.value;
    const commune = document.getElementById('gift-cust-commune')?.value;

    if (!name || !wilayaCode || !phone) {
        alert('يرجى كتابة كافة معلومات اسمك ورقم الهاتف والولاية لتأكيد التسليم!');
        return;
    }

    const btn = document.getElementById('submit-gift-order-btn');
    if (btn) { btn.disabled = true; btn.innerText = 'جاري إرسال طلب الهدية... ⏳'; }

    const wilaya = typeof WILAYAS !== 'undefined' ? WILAYAS.find(w => w.code === wilayaCode) : null;
    const communeObj = (wilaya?.communesData || []).find(c => c.name === commune);
    const shipCost = communeObj ? communeObj.cost : (wilaya?.officeCost || 0);

    const prodsTotal = giftState.selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const boxCost = giftState.selectedBox ? giftState.selectedBox.price : 500;
    const grandTotal = prodsTotal + boxCost + shipCost;

    const prodsSummaryStr = giftState.selectedProducts.map(sp => `${sp.product.name} (x${sp.quantity})`).join(', ');

    const newGiftOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: commune || 'المكتب',
        product: `🎁 هدية مخصصة (${giftState.occasion}): [منتجات: ${prodsSummaryStr}] - [العلبة: ${giftState.selectedBox?.name || 'فاخرة'}] - [شريط: ${giftState.ribbonColor}] - [رسالة من ${giftState.senderName} إلى ${giftState.recipientName}: "${giftState.messageText}"]`,
        total: grandTotal,
        status: 'جديد',
        isGiftOrder: true,
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    if (typeof db !== 'undefined') {
        db.collection("orders").add(newGiftOrder).then(() => {
            alert('شكرًا لك! تم استلام طلب هديتك بنجاح وسنقوم بتجهيزها بعناية فائقة.');
            if (typeof showPage === 'function') showPage('home');
        }).catch(err => {
            alert('تعذر إرسال الطلب: ' + err.message);
        }).finally(() => {
            if (btn) { btn.disabled = false; btn.innerText = 'تأكيد طلب الهدية الآن (الدفع عند الاستلام) 🎁'; }
        });
    }
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
