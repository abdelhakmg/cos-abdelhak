let currentBannerIdx = 0;
let currentHeroIdx = 0;
let activeCategoryFilter = 'جميع المنتجات';

let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick(event) {
    logoClickCount++;
    if (logoClickCount === 1) {
        logoClickTimer = setTimeout(() => {
            if (logoClickCount < 3) showPage('home');
            logoClickCount = 0;
        }, 800);
    } else if (logoClickCount === 3) {
        clearTimeout(logoClickTimer);
        logoClickCount = 0;
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        }
    }
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

    const matches = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.skinType && p.skinType.toLowerCase().includes(q)) ||
        (p.hairType && p.hairType.toLowerCase().includes(q)) ||
        (p.colors && p.colors.toLowerCase().includes(q)) ||
        (p.numbers && p.numbers.toLowerCase().includes(q))
    ).slice(0, 5);

    let htmlContent = '';
    if (matches.length === 0) {
        htmlContent = '<div class="p-4 text-xs text-amber-400 text-center leading-relaxed">المنتج غير متوفر، تأكد من البحث عنه يدويا من الفئات حسب نوعية المنتج</div>';
    } else {
        htmlContent = matches.map(p => `
            <div onclick="openLandingPage('${p.id}'); hideAllDropdowns();" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black">
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
        const found = products.find(p => 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.hairType && p.hairType.toLowerCase().includes(q)) ||
            (p.skinType && p.skinType.toLowerCase().includes(q))
        );
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

function initBannerRealtimeSync() {
    const bannerEl = document.getElementById('top-announcement-text');
    if (!bannerEl) return;

    db.collection("settings").doc("main").onSnapshot((doc) => {
        if (doc.exists && doc.data().bannerMessages && doc.data().bannerMessages.length > 0) {
            bannerMessages = doc.data().bannerMessages;
        } else {
            bannerMessages = ["🚚 التوصيل متوفر لجميع الولايات والدفع عند الاستلام"];
        }

        if (currentBannerIdx >= bannerMessages.length) {
            currentBannerIdx = 0;
        }

        bannerEl.innerText = bannerMessages[currentBannerIdx];
        startBannerTicker();

        if (typeof renderBannerTextsList === 'function') {
            renderBannerTextsList();
        }
    });
}

function startBannerTicker() {
    const bannerEl = document.getElementById('top-announcement-text');
    if (!bannerEl) return;

    if (window.bannerTickerTimer) {
        clearInterval(window.bannerTickerTimer);
    }

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
                <span class="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold mb-4 backdrop-blur-md">
                    ✨ التشكيلة الحصرية 2026
                </span>
                <h1 class="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-2xl max-w-3xl leading-tight">
                    ${currentSlide.title}
                </h1>
                <p class="text-gray-200 text-sm md:text-lg font-medium max-w-2xl mb-6 drop-shadow-lg">
                    ${currentSlide.desc}
                </p>
                <button onclick="filterCategory('جميع المنتجات')" class="pointer-events-auto px-8 py-3.5 gold-gradient text-black font-extrabold rounded-full shadow-xl hover:scale-105 transition cursor-pointer">
                    تسوقي الآن 🔥
                </button>
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
    if (drawer) {
        drawer.classList.toggle('hidden');
    }
}

function renderSingleProductCard(p) {
    const displayImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/300';
    const isFav = favorites.includes(p.id);

    return `
        <div class="bg-white text-gray-900 rounded-2xl border p-4 text-right flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/20 transition-all duration-300 transform hover:-translate-y-2 group relative">
            <button onclick="toggleFavorite('${p.id}')" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>

            <div>
                <div class="h-48 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center cursor-pointer overflow-hidden" onclick="openLandingPage('${p.id}')">
                    <img src="${displayImg}" class="max-h-full object-contain group-hover:scale-105 transition duration-500">
                </div>

                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="w-2 h-2 rounded-full ${p.inStock ? 'bg-green-500 animate-ping' : 'bg-red-500'}"></span>
                    <span class="text-[10px] font-bold ${p.inStock ? 'text-green-600' : 'text-red-500'}">${p.inStock ? 'متوفر' : 'غير متوفر'}</span>
                </div>

                <h3 class="font-bold text-sm text-gray-900 truncate my-1 cursor-pointer group-hover:text-[#B8860B] transition" onclick="openLandingPage('${p.id}')">${p.name}</h3>

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

            <div class="space-y-2">
                <button onclick="addToCart('${p.id}')" class="w-full py-2.5 bg-black text-white hover:bg-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف إلى السلة
                </button>
                <button onclick="openLandingPage('${p.id}')" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition">
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
    if (favProducts.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-12">لم تقم بإضافة أي منتج للمفضلة بعد.</p>';
    } else {
        grid.innerHTML = favProducts.map(p => renderSingleProductCard(p)).join('');
    }
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
        const img = (prod.images && prod.images[0]) || 'https://via.placeholder.com/100';
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

function filterCategory(catName) {
    activeCategoryFilter = catName.trim();
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = activeCategoryFilter;
    
    applyFilters();
    showPage('catalog');
}

// دالة التصفية الشاملة المحدثة
function applyFilters() {
    let filtered = [...products];

    // 1. فلترة الفئة / القسم
    if (activeCategoryFilter && activeCategoryFilter !== 'جميع المنتجات' && activeCategoryFilter !== 'الجميع') {
        filtered = filtered.filter(p => p.category && p.category.trim().toLowerCase() === activeCategoryFilter.toLowerCase());
    }

    // 2. فلترة التوفر بالمخزون فقط
    const inStockOnly = document.getElementById('filter-in-stock-only')?.checked;
    if (inStockOnly) {
        filtered = filtered.filter(p => p.inStock === true);
    }

    // 3. فلترة أنواع البشرة المحددة
    const selectedSkinTypes = Array.from(document.querySelectorAll('.skin-filter-cb:checked')).map(cb => cb.value);
    if (selectedSkinTypes.length > 0) {
        filtered = filtered.filter(p => p.skinType && selectedSkinTypes.includes(p.skinType));
    }

    // 4. فلترة أنواع الشعر المحددة
    const selectedHairTypes = Array.from(document.querySelectorAll('.hair-filter-cb:checked')).map(cb => cb.value);
    if (selectedHairTypes.length > 0) {
        filtered = filtered.filter(p => p.hairType && selectedHairTypes.includes(p.hairType));
    }

    // 5. فلترة السعر الأقصى
    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) {
        const maxPrice = parseFloat(priceRangeInput.value) || 20000;
        filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
    }

    // 6. الترتيب
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
            '<p class="col-span-full text-center text-gray-400 py-12">لا توجد منتجات مطابقة لهذه الخيارات حالياً.</p>' :
            filtered.map(p => renderSingleProductCard(p)).join('');
    }
}

function updatePriceFilter(val) {
    const valEl = document.getElementById('price-range-val');
    if (valEl) valEl.innerText = parseFloat(val).toLocaleString() + ' دج';
    applyFilters();
}

function resetFilters() {
    activeCategoryFilter = 'جميع المنتجات';
    
    const inStockCb = document.getElementById('filter-in-stock-only');
    if (inStockCb) inStockCb.checked = false;

    document.querySelectorAll('.skin-filter-cb, .hair-filter-cb').forEach(cb => cb.checked = false);

    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) priceRangeInput.value = 20000;
    
    updatePriceFilter(20000);
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
            <button onclick="showPage('home')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">الرئيسية</button>
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
        
        if (currentOrderTickerIndex >= orders.length) {
            currentOrderTickerIndex = 0;
        }

        const currentOrder = orders[currentOrderTickerIndex];

        spCustomer.innerText = `${currentOrder.customer || 'زبون'} من ${currentOrder.wilaya || 'الجزائر'}`;
        spProduct.innerText = `اشترى ${currentOrder.product || 'منتج'} منذ قليل`;
        
        toast.classList.remove('translate-y-28', 'opacity-0');

        setTimeout(() => {
            toast.classList.add('translate-y-28', 'opacity-0');
        }, 4500);

        currentOrderTickerIndex++;
    }, 12000);
}

updateAppHeaderInfo();
updateBadges();
renderHeroSlider();
renderProducts();
initBannerRealtimeSync();
initRealOrdersTicker();
