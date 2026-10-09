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

// 🔍 دالة البحث المباشر في الوقت الفعلي
function handleLiveSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    const q = query.trim().toLowerCase();
    if (!q) {
        dropdown.classList.add('hidden');
        return;
    }

    const matches = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 5);

    if (matches.length === 0) {
        dropdown.innerHTML = '<div class="p-4 text-xs text-gray-400 text-center">لا توجد نتائج مطابقة</div>';
    } else {
        dropdown.innerHTML = matches.map(p => `
            <div onclick="openLandingPage('${p.id}'); document.getElementById('search-results-dropdown').classList.add('hidden');" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black">
                <div class="text-right">
                    <p class="text-xs font-bold text-white truncate">${p.name}</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">${p.price.toLocaleString()} دج</p>
                </div>
            </div>
        `).join('');
    }
    dropdown.classList.remove('hidden');
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
    if (pageId === 'cart' && typeof renderCart === 'function') renderCart();
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
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('تمت الإضافة! 🛍️', `تمت إضافة "${prod.name}" إلى السلة بنجاح.`, true);
        }
    }
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');

    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-center text-gray-400 py-8">سلة التسوق فارغة حالياً.</p>';
        if (subtotalEl) subtotalEl.innerText = '0 دج';
        if (totalEl) totalEl.innerText = '0 دج';
        return;
    }

    let subtotal = 0;
    cartList.innerHTML = cart.map((prod, idx) => {
        subtotal += (prod.price || 0);
        const img = (prod.images && prod.images[0]) || 'https://via.placeholder.com/100';
        return `
            <div class="flex items-center justify-between border-b border-gray-800 pb-4">
                <div class="flex items-center gap-4">
                    <img src="${img}" class="w-16 h-16 object-contain rounded-xl bg-black border border-gray-800">
                    <div>
                        <h4 class="font-bold text-sm text-white">${prod.name}</h4>
                        <span class="text-xs text-[#D4AF37] font-bold">${prod.price ? prod.price.toLocaleString() : 0} دج</span>
                    </div>
                </div>
                <button onclick="removeFromCart(${idx})" class="text-red-500 hover:text-red-400 font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                    <i class="fa-solid fa-trash-can"></i> حذف
                </button>
            </div>
        `;
    }).join('');

    const shipping = 500;
    if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString() + ' دج';
    if (totalEl) totalEl.innerText = (subtotal + shipping).toLocaleString() + ' دج';
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
    showCustomAlert('طلب جاري!', 'لإكمال الشراء بسرعة والدفع عند الاستلام، يرجى الاستمرار من صفحة المنتج المباشرة.', true);
}

function filterCategory(catName) {
    activeCategoryFilter = catName.trim();
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.innerText = activeCategoryFilter;
    
    applyFilters();
    showPage('catalog');
}

function applyFilters() {
    let filtered = [...products];

    if (activeCategoryFilter && activeCategoryFilter !== 'جميع المنتجات' && activeCategoryFilter !== 'الجميع') {
        filtered = filtered.filter(p => p.category && p.category.trim().toLowerCase() === activeCategoryFilter.toLowerCase());
    }

    const priceRangeInput = document.getElementById('filter-price-range');
    if (priceRangeInput) {
        const maxPrice = parseFloat(priceRangeInput.value) || 20000;
        filtered = filtered.filter(p => p.price <= maxPrice);
    }

    const sortSelect = document.getElementById('sort-select');
    const sortVal = sortSelect ? sortSelect.value : 'best';

    if (sortVal === 'low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'high') {
        filtered.sort((a, b) => b.price - a.price);
    } else {
        filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }

    const catalogGrid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    
    if (badge) badge.innerText = filtered.length;

    if (catalogGrid) {
        catalogGrid.innerHTML = filtered.length === 0 ? 
            '<p class="col-span-full text-center text-gray-400 py-12">لا توجد منتجات متوفرة في هذا القسم حالياً.</p>' :
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

// 📣 إشعارات الشراء التلقائية لبناء الثقة
function initSocialProofTicker() {
    const toast = document.getElementById('social-proof-toast');
    const spText = document.getElementById('sp-text');
    if (!toast || !spText) return;

    const names = ['فاطمة من الجزائر', 'مريم من وهران', 'ياسمين من قسنطينة', 'حنان من سطيف', 'أسماء من البليدة', 'إيمان من عنابة'];
    
    setInterval(() => {
        if (!products || products.length === 0) return;
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomProd = products[Math.floor(Math.random() * products.length)];

        spText.innerText = `طلبية جديدة: ${randomName}`;
        toast.classList.remove('translate-y-28', 'opacity-0');

        setTimeout(() => {
            toast.classList.add('translate-y-28', 'opacity-0');
        }, 4500);
    }, 15000);
}

updateAppHeaderInfo();
updateBadges();
renderHeroSlider();
renderProducts();
initBannerRealtimeSync();
initSocialProofTicker();
