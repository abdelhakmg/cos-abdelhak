let currentBannerIdx = 0;

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

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin') renderAdminDashboard();
    if (pageId === 'cart') renderCart();
}

function filterCategory(catName) {
    if (catName === 'الرئيسية' || catName === 'الجميع') {
        showPage('home');
        return;
    }
    
    document.getElementById('catalog-category-title').innerText = 'قسم: ' + catName;
    const filtered = products.filter(p => p.category === catName);
    
    const catGrid = document.getElementById('catalog-products');
    catGrid.innerHTML = filtered.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-10">لا توجد منتجات في هذه الفئة حالياً</p>' : 
        filtered.map(p => renderSingleProductCard(p)).join('');
    
    showPage('catalog');
}

function renderSingleProductCard(p) {
    const displayImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/300';
    return `
        <div class="bg-white rounded-2xl border p-4 text-right flex flex-col justify-between shadow-sm">
            <div class="h-44 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center cursor-pointer" onclick="openLandingPage(${p.id})">
                <img src="${displayImg}" class="max-h-full object-contain">
            </div>
            <div>
                <span class="text-[10px] bg-gold-500/10 text-[#B8860B] font-bold px-2 py-0.5 rounded">${p.category}</span>
                <h3 class="font-bold text-sm my-1 truncate">${p.name}</h3>
                <div class="font-black text-[#B8860B] mb-3">${p.price.toLocaleString()} دج</div>
            </div>
            <button onclick="openLandingPage(${p.id})" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-md">اطلب الآن 🔥</button>
        </div>
    `;
}

function updateAppHeaderInfo() {
    document.getElementById('site-title').innerText = storeSettings.name + ' | المتجر الفاخر';
    document.getElementById('store-name-display').innerText = storeSettings.name;
    document.getElementById('store-slogan-display').innerText = `"${storeSettings.slogan}"`;
    document.getElementById('hero-slogan-display').innerText = `"${storeSettings.slogan}"`;
    
    if (storeSettings.logoUrl) {
        document.getElementById('store-logo-img').src = storeSettings.logoUrl;
        document.getElementById('store-logo-img').classList.remove('hidden');
        document.getElementById('store-logo-icon').classList.add('hidden');
    }

    // Dynamic Header Categories Links
    const navEl = document.getElementById('header-nav');
    navEl.innerHTML = `<button onclick="filterCategory('الرئيسية')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">الرئيسية</button>` +
        categories.map(c => `<button onclick="filterCategory('${c.name}')" class="text-gray-300 hover:text-[#D4AF37] transition font-bold">${c.name}</button>`).join('');

    // Home Category Cards
    document.getElementById('home-category-cards').innerHTML = categories.map(c => `
        <div onclick="filterCategory('${c.name}')" class="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl p-4 text-center cursor-pointer hover:border-[#D4AF37] transition flex flex-col items-center justify-between">
            <img src="${c.image}" class="w-20 h-20 object-cover rounded-xl mb-3 border border-[#D4AF37]/20">
            <h3 class="text-white font-bold text-sm">${c.name}</h3>
        </div>
    `).join('');
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
        subtotal += item.price;
        const img = (item.images && item.images.length > 0) ? item.images[0] : '';
        return `
            <div class="flex items-center justify-between border-b pb-4">
                <div class="flex items-center gap-4">
                    <img src="${img}" class="w-16 h-16 object-cover rounded-lg border">
                    <div class="text-right">
                        <h4 class="font-bold text-sm">${item.name}</h4>
                        <span class="text-xs text-[#B8860B] font-bold">${item.price.toLocaleString()} دج</span>
                    </div>
                </div>
                <button onclick="cart.splice(${idx},1); renderCart();" class="text-red-500 text-xs font-bold">حذف</button>
            </div>
        `;
    }).join('');
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + ' دج';
    document.getElementById('total').innerText = Math.max(0, subtotal + 500 - 1000).toLocaleString() + ' دج';
    document.getElementById('cart-badge').innerText = cart.length;
}

// Initial Run Sequence
updateAppHeaderInfo();
renderProducts();
startBannerTicker();
