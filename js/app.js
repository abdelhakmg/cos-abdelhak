let currentBannerIdx = 0;
let currentHeroIdx = 0;
let activeCategoryFilter = 'الجميع';

function startBannerTicker() {
    const bannerEl = document.getElementById('top-announcement-text');
    if (!bannerEl || bannerMessages.length === 0) return;
    
    setInterval(() => {
        bannerEl.style.opacity = '0';
        setTimeout(() => {
            currentBannerIdx = (currentBannerIdx + 1) % bannerMessages.length;
            bannerEl.innerText = bannerMessages[currentBannerIdx];
            bannerEl.style.opacity = '1';
        }, 400);
    }, 4000);
}

function renderHeroSlider() {
    const container = document.getElementById('hero-slider-container');
    const dotsContainer = document.getElementById('hero-slider-dots');
    
    if (!container || heroSlides.length === 0) return;

    const currentSlide = heroSlides[currentHeroIdx];

    container.innerHTML = `
        <div class="space-y-6 text-right">
            <h1 class="text-3xl md:text-5xl font-black leading-tight text-white">
                ${currentSlide.title}
            </h1>
            <p class="text-sm md:text-base text-gray-300 font-light leading-relaxed">
                ${currentSlide.desc}
            </p>
            <button onclick="filterCategory('الجميع')" class="px-8 py-3.5 gold-gradient text-black font-extrabold rounded-xl shadow-lg hover:opacity-90 transition">
                تسوقي الآن <i class="fa-solid fa-arrow-left mr-2"></i>
            </button>
        </div>
        <div class="flex justify-center">
            <div class="w-60 h-60 md:w-72 md:h-72 rounded-3xl gold-gradient p-1 shadow-2xl overflow-hidden">
                <div class="w-full h-full bg-[#121212] rounded-3xl flex items-center justify-center overflow-hidden p-2">
                    <img src="${currentSlide.image}" class="w-full h-full object-cover rounded-2xl" alt="Hero Banner">
                </div>
            </div>
        </div>
    `;

    dotsContainer.innerHTML = heroSlides.map((_, idx) => `
        <button onclick="setHeroSlide(${idx})" class="w-2.5 h-2.5 rounded-full transition-all ${idx === currentHeroIdx ? 'bg-[#D4AF37] w-6' : 'bg-gray-600'}"></button>
    `).join('');
}

function setHeroSlide(idx) {
    currentHeroIdx = idx;
    renderHeroSlider();
}

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin') renderAdminDashboard();
    if (pageId === 'cart') renderCart();
}

function renderSingleProductCard(p) {
    const displayImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/300';
    const isFav = favorites.includes(p.id);

    return `
        <div class="bg-white rounded-2xl border p-4 text-right flex flex-col justify-between shadow-md relative hover:shadow-xl transition group">
            
            <button onclick="toggleFavorite('${p.id}')" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>

            <div>
                <div class="h-44 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center cursor-pointer overflow-hidden" onclick="openLandingPage('${p.id}')">
                    <img src="${displayImg}" class="max-h-full object-contain group-hover:scale-105 transition duration-300">
                </div>

                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="w-2 h-2 rounded-full ${p.inStock ? 'bg-green-500' : 'bg-red-500'}"></span>
                    <span class="text-[10px] font-bold ${p.inStock ? 'text-green-600' : 'text-red-500'}">${p.inStock ? 'متوفر' : 'غير متوفر'}</span>
                </div>

                <h3 class="font-bold text-sm text-gray-900 truncate my-1 cursor-pointer" onclick="openLandingPage('${p.id}')">${p.name}</h3>

                <div class="flex items-center gap-2 mb-1">
                    <span class="font-black text-sm text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</span>
                    ${p.oldPrice ? `<span class="text-[10px] text-gray-400 line-through">${p.oldPrice.toLocaleString()} دج</span>` : ''}
                </div>

                <div class="flex items-center gap-1 text-[#D4AF37] text-xs mb-3">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                </div>
            </div>

            <div class="space-y-2">
                <button onclick="addToCart('${p.id}')" class="w-full py-2 bg-black text-white hover:bg-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف إلى السلة
                </button>
                <button onclick="openLandingPage('${p.id}')" class="w-full py-2 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-sm hover:opacity-90 transition">
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
    applyFilters();
    renderProducts();
}

function addToCart(id) {
    const prod = products.find(p => p.id === id);
    if (prod) {
        cart.push(prod);
        localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
        document.getElementById('cart-badge').innerText = cart.length;
        
        // إشعار غير مزعج بدلاً من نافذة alert
        showToast('تمت إضافة المنتج للسلة بنجاح! 🛍️');
    }
}

function showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.className = 'fixed bottom-5 right-5 bg-black text-[#D4AF37] border border-[#D4AF37]/40 px-5 py-3 rounded-xl shadow-2xl z-50 text-xs font-bold transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-green-400 text-sm"></i> <span>${message}</span>`;
    
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 100);

    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
    }, 2500);
}

function filterCategory(catName) {
    activeCategoryFilter = catName;
    document.getElementById('breadcrumb-current').innerText = catName;
    applyFilters();
    showPage('catalog');
}

function updatePriceFilter(val) {
    document.getElementById('price-range-val').innerText = parseFloat(val).toLocaleString() + ' دج';
    applyFilters();
}

function resetFilters() {
    activeCategoryFilter = 'الجميع';
    document.getElementById('filter-price-range').value = 10000;
    document.getElementById('price-range-val').innerText = '10,000 دج';
    document.querySelectorAll('.brand-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.cat-checkbox').forEach(cb => cb.checked = false);
    applyFilters();
}

function updateBrandsListUI() {
    const container = document.getElementById('filter-brands-list');
    if (!container) return;

    if (brands.length === 0) {
        container.innerHTML = '<span class="text-gray-500 text-[11px]">لا توجد ماركات مضافة</span>';
        return;
    }

    container.innerHTML = brands.map(b => `
        <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" onchange="applyFilters()" value="${b.name}" class="brand-checkbox accent-[#D4AF37]">
            ${b.name}
        </label>
    `).join('');
}

function applyFilters() {
    let result = [...products];

    // Category Filter
    const selectedCats = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => cb.value);
    if (selectedCats.length > 0) {
        result = result.filter(p => selectedCats.includes(p.category));
    } else if (activeCategoryFilter !== 'الجميع') {
        result = result.filter(p => p.category === activeCategoryFilter);
    }

    // Price Filter
    const maxPrice = parseFloat(document.getElementById('filter-price-range').value);
    result = result.filter(p => (p.price || 0) <= maxPrice);

    // Brand Filter
    const selectedBrands = Array.from(document.querySelectorAll('.brand-checkbox:checked')).map(cb => cb.value);
    if (selectedBrands.length > 0) {
        result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Sorting
    const sortVal = document.getElementById('sort-select').value;
    if (sortVal === 'low') result.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortVal === 'high') result.sort((a, b) => (b.price || 0) - (a.price || 0));

    // Update Catalog
    document.getElementById('products-count-badge').innerText = result.length;
    const catalogGrid = document.getElementById('catalog-products');
    
    catalogGrid.innerHTML = result.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">لا توجد منتجات تطابق اختياراتك</p>' :
        result.map(p => renderSingleProductCard(p)).join('');
}

function updateAppHeaderInfo() {
    document.getElementById('site-title').innerText = storeSettings.name + ' | المتجر الفاخر';
    document.getElementById('store-name-display').innerText = storeSettings.name;
    document.getElementById('store-slogan-display').innerText = `"${storeSettings.slogan}"`;
    
    if (storeSettings.logoUrl) {
        document.getElementById('store-logo-img').src = storeSettings.logoUrl;
        document.getElementById('store-logo-img').classList.remove('hidden');
        document.getElementById('store-logo-icon').classList.add('hidden');
    }

    // Header Links
    const navEl = document.getElementById('header-nav');
    navEl.innerHTML = `<button onclick="filterCategory('الجميع')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">الرئيسية</button>` +
        categories.map(c => `<button onclick="filterCategory('${c.name}')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">${c.name}</button>`).join('');

    // Filter Categories
    document.getElementById('filter-categories-list').innerHTML = categories.map(c => `
        <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" value="${c.name}" onchange="applyFilters()" class="cat-checkbox accent-[#D4AF37]">
            ${c.name}
        </label>
    `).join('');

    // Home Category Cards
    document.getElementById('home-category-cards').innerHTML = categories.map(c => `
        <div onclick="filterCategory('${c.name}')" class="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl p-4 text-center cursor-pointer hover:border-[#D4AF37] transition flex flex-col items-center justify-center space-y-2 shadow-lg">
            <div class="w-14 h-14 rounded-2xl p-0.5 gold-gradient overflow-hidden shadow-md">
                <img src="${c.image}" class="w-full h-full object-cover rounded-xl bg-black">
            </div>
            <h3 class="text-white font-bold text-sm tracking-wide">${c.name}</h3>
        </div>
    `).join('');

    updateBrandsListUI();
}

function renderProducts() {
    const grid = document.getElementById('home-products');
    if (grid) grid.innerHTML = products.map(p => renderSingleProductCard(p)).join('');
}

function renderCart() {
    const container = document.getElementById('cart-list');
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">السلة فارغة حالياً</p>';
        document.getElementById('subtotal').innerText = '0 دج';
        document.getElementById('total').innerText = '0 دج';
        return;
    }
    let subtotal = 0;
    container.innerHTML = cart.map((item, idx) => {
        subtotal += item.price || 0;
        const img = (item.images && item.images.length > 0) ? item.images[0] : '';
        return `
            <div class="flex items-center justify-between border-b pb-4">
                <div class="flex items-center gap-4">
                    <img src="${img}" class="w-16 h-16 object-cover rounded-lg border">
                    <div class="text-right">
                        <h4 class="font-bold text-sm">${item.name}</h4>
                        <span class="text-xs text-[#B8860B] font-bold">${item.price ? item.price.toLocaleString() : 0} دج</span>
                    </div>
                </div>
                <button onclick="cart.splice(${idx},1); localStorage.setItem('lb_cart_v7', JSON.stringify(cart)); renderCart();" class="text-red-500 text-xs font-bold">حذف</button>
            </div>
        `;
    }).join('');
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + ' دج';
    document.getElementById('total').innerText = Math.max(0, subtotal + 500 - 1000).toLocaleString() + ' دج';
    document.getElementById('cart-badge').innerText = cart.length;
}

// Run Initializer
updateAppHeaderInfo();
renderHeroSlider();
renderProducts();
applyFilters();
startBannerTicker();
