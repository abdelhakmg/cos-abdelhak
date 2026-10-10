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

function handleGiftSection() {
    showCustomAlert('هديتك 🎁', 'قريباً! نجهز لكم مفاجآت وقسائم هدايا مميزة لزبائننا الكرام.', true);
}

// دالة التحقق وتقييد كتابة الأرقام الجزائرية فقط (05 / 06 / 07)
function validatePhoneInput(input) {
    let val = input.value.replace(/\D/g, ''); // إزالة الحروف والرموز
    if (val.length > 10) val = val.substring(0, 10);
    input.value = val;
}

function isAlgerianPhoneValid(phone) {
    const regex = /^(05|06|07)[0-9]{8}$/;
    return regex.test(phone);
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
        (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 5);

    let htmlContent = '';
    if (matches.length === 0) {
        htmlContent = '<div class="p-4 text-xs text-amber-400 text-center leading-relaxed">المنتج غير متوفر، تأكد من البحث عنه يدويا من الفئات حسب نوعية المنتج</div>';
    } else {
        htmlContent = matches.map(p => `
            <div onclick="openBottomSheet('${p.id}'); hideAllDropdowns();" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black">
                <div class="text-right">
                    <p class="text-xs font-bold text-white truncate">${p.name}</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">${p.price.toLocaleString()} دج</p>
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
        const found = products.find(p => p.name && p.name.toLowerCase().includes(q));
        hideAllDropdowns();
        if (found) {
            openBottomSheet(found.id);
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
        <div class="relative w-full h-[400px] md:h-[480px] rounded-3xl overflow-hidden group shadow-2xl border border-[#D4AF37]/30">
            <img src="${currentSlide.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Hero Banner">
            
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-center items-center text-center p-6 md:p-12">
                <span class="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold mb-4 backdrop-blur-md">
                    ✨ التشكيلة الحصرية 2026
                </span>
                <h1 class="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-2xl max-w-3xl leading-tight">
                    ${currentSlide.title}
                </h1>
                <p class="text-gray-200 text-sm md:text-lg font-medium max-w-2xl mb-6 drop-shadow-lg">
                    ${currentSlide.desc}
                </p>
                <button onclick="filterCategory('جميع المنتجات')" class="px-8 py-3.5 gold-gradient text-black font-extrabold rounded-full shadow-xl hover:scale-105 transition cursor-pointer">
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

function renderSingleProductCard(p) {
    const displayImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/300';
    const isFav = favorites.includes(p.id);

    return `
        <div class="gold-glow-card rounded-3xl p-4 text-right flex flex-col justify-between group">
            <button onclick="toggleFavorite('${p.id}')" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 border border-[#D4AF37]/30 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-md">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>

            <div>
                <div class="h-48 bg-black/50 rounded-2xl p-2 mb-3 flex items-center justify-center cursor-pointer overflow-hidden border border-gray-800/80" onclick="openBottomSheet('${p.id}')">
                    <img src="${displayImg}" class="max-h-full object-contain group-hover:scale-110 transition duration-500">
                </div>

                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="w-2 h-2 rounded-full ${p.inStock ? 'bg-green-500 animate-ping' : 'bg-red-500'}"></span>
                    <span class="text-[10px] font-bold ${p.inStock ? 'text-green-400' : 'text-red-400'}">${p.inStock ? 'متوفر بالمخزون' : 'غير متوفر'}</span>
                </div>

                <h3 class="font-bold text-sm text-white truncate my-1 cursor-pointer group-hover:text-[#D4AF37] transition" onclick="openBottomSheet('${p.id}')">${p.name}</h3>

                <div class="flex items-center gap-2 mb-2">
                    <span class="font-black text-base gold-text">${p.price ? p.price.toLocaleString() : 0} دج</span>
                    ${p.oldPrice ? `<span class="text-xs text-gray-500 line-through">${p.oldPrice.toLocaleString()} دج</span>` : ''}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <button onclick="openBottomSheet('${p.id}')" class="w-full py-3 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2">
                    شراء سريع الآن ⚡
                </button>
                <button onclick="addToCart('${p.id}')" class="w-full py-2 bg-black border border-[#D4AF37]/30 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف للسلة
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

// السلة المصححة (تأتي بسعر توصيل 0 دج حتى اختيار الولاية)
function renderCart() {
    const cartList = document.getElementById('cart-list');
    const subtotalEl = document.getElementById('subtotal');

    if (!cartList) return;

    populateCartWilayas();

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-center text-gray-400 py-8">سلة التسوق فارغة حالياً.</p>';
        if (subtotalEl) subtotalEl.innerText = '0 دج';
        calculateCartTotal();
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

    if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString() + ' دج';
    calculateCartTotal();
}

function populateCartWilayas() {
    const select = document.getElementById('cart-cust-wilaya');
    if (!select || select.options.length > 1) return;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleCartWilayaChange() {
    const code = document.getElementById('cart-cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeSelect = document.getElementById('cart-cust-commune');
    
    if (wilaya && communeSelect) {
        communeSelect.innerHTML = wilaya.communes.map(c => `<option value="${c}">${c}</option>`).join('');
    } else if (communeSelect) {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
    }
    calculateCartTotal();
}

function calculateCartTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';

    let shipCost = 0;
    if (wilaya) {
        shipCost = shipType === 'home' ? wilaya.homeCost : wilaya.officeCost;
    }

    const shipEl = document.getElementById('shipping-cost');
    const totalEl = document.getElementById('total');

    if (shipEl) shipEl.innerText = wilaya ? shipCost.toLocaleString() + ' دج' : '0 دج (حدد الولاية)';
    if (totalEl) totalEl.innerText = (subtotal + shipCost).toLocaleString() + ' دج';
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

    const name = document.getElementById('cart-cust-name').value.trim();
    const phone = document.getElementById('cart-cust-phone').value.trim();
    const wilayaCode = document.getElementById('cart-cust-wilaya').value;
    const commune = document.getElementById('cart-cust-commune').value;

    if (!name) {
        showCustomAlert('تنبيه', 'يرجى إدخال الاسم واللقب!', false);
        return;
    }

    if (!isAlgerianPhoneValid(phone)) {
        showCustomAlert('رقم هاتف غير صحيح ❌', 'يرجى كتابة رقم هاتف جزائري صحيح يبدأ بـ 05 أو 06 أو 07 ومكون من 10 أرقام.', false);
        return;
    }

    if (!wilayaCode) {
        showCustomAlert('تنبيه', 'يرجى اختيار الولاية!', false);
        return;
    }

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    const shipCost = shipType === 'home' ? wilaya.homeCost : wilaya.officeCost;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalAmount = subtotal + shipCost;

    const productsSummary = cart.map(item => item.name).join(' + ');

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya.name,
        commune: commune,
        product: `سلة متكاملة: (${productsSummary})`,
        total: totalAmount,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        cart = [];
        localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
        updateBadges();
        
        showCustomAlert('تم استلام طلبك! 🎉', 'شكراً لك! تم تسليم طلبيتك بنجاح وسنتصل بك هاتفياً للتأكيد.', true);
        showPage('home');
    });
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

    const catalogGrid = document.getElementById('catalog-products');
    const badge = document.getElementById('products-count-badge');
    
    if (badge) badge.innerText = filtered.length;

    if (catalogGrid) {
        catalogGrid.innerHTML = filtered.length === 0 ? 
            '<p class="col-span-full text-center text-gray-400 py-12">لا توجد منتجات متوفرة في هذا القسم حالياً.</p>' :
            filtered.map(p => renderSingleProductCard(p)).join('');
    }
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

    const navEl = document.getElementById('header-nav');
    if (navEl) {
        navEl.innerHTML = `
            <button onclick="showPage('home')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">الرئيسية</button>
            <button onclick="filterCategory('جميع المنتجات')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">جميع المنتجات</button>
        ` + categories.map(c => `<button onclick="filterCategory('${c.name}')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">${c.name}</button>`).join('');
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

// دالة النافذة المنبثقة التفاعلية (تتنقل بين جميع الطلبيات المسجلة)
function initRealOrdersTicker() {
    const toast = document.getElementById('social-proof-toast');
    const spCustomer = document.getElementById('sp-customer');
    const spProduct = document.getElementById('sp-product');
    if (!toast || !spCustomer || !spProduct) return;

    let orderIndex = 0;

    setInterval(() => {
        if (!orders || orders.length === 0) return;
        
        // التدوير والتنقل بين جميع الزبائن الذين اشتروا
        const currentOrder = orders[orderIndex % orders.length];
        orderIndex++;

        spCustomer.innerText = `${currentOrder.customer || 'زبون'} من ${currentOrder.wilaya || 'الجزائر'}`;
        spProduct.innerText = `اشترى ${currentOrder.product || 'منتج'} منذ قليل`;
        
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
initRealOrdersTicker();
