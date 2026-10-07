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
        document.getElementById('admin-auth-modal').style.display = 'flex';
    }
}

function checkAdminPassword() {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === storeSettings.pass) {
        document.getElementById('admin-auth-modal').style.display = 'none';
        document.getElementById('admin-pass-input').value = '';
        showPage('admin');
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-white');
        b.classList.add('bg-gray-800', 'text-gray-300');
    });

    document.getElementById('admin-tab-' + tabName).classList.add('active');
    const btn = document.getElementById('tab-btn-' + tabName);
    btn.classList.remove('bg-gray-800', 'text-gray-300');
    btn.classList.add('bg-black', 'text-white');
}

function renderAdminDashboard() {
    // Analytics
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    document.getElementById('stat-orders-count').innerText = orders.length;
    document.getElementById('stat-avg-order').innerText = orders.length ? Math.round(totalSales / orders.length).toLocaleString() + ' دج' : '0 دج';

    document.getElementById('admin-orders-log').innerHTML = orders.length === 0 ? '<p class="text-gray-400">لا توجد طلبات بعد</p>' : 
        orders.map(o => `
            <div class="border-b pb-3 flex justify-between items-center text-sm">
                <div>
                    <div class="font-bold">${o.customer} (${o.phone})</div>
                    <div class="text-xs text-gray-500">${o.wilaya} - ${o.commune} | ${o.product}</div>
                </div>
                <div class="text-left"><span class="font-black text-[#B8860B]">${o.total.toLocaleString()} دج</span></div>
            </div>
        `).join('');

    // Hero Slides List
    document.getElementById('admin-hero-slides-list').innerHTML = heroSlides.map((slide, idx) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <div class="flex items-center gap-3">
                <img src="${slide.image}" class="w-12 h-12 object-cover rounded-lg border">
                <div>
                    <div class="font-bold">${slide.title}</div>
                    <div class="text-xs text-gray-500 truncate max-w-xs">${slide.desc}</div>
                </div>
            </div>
            <button onclick="deleteHeroSlide(${idx})" class="text-red-500 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg">حذف</button>
        </div>
    `).join('');

    // Select Categories
    document.getElementById('prod-category-select').innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    // Products List in Admin
    document.getElementById('admin-products-tbody').innerHTML = products.map((p) => `
        <tr class="border-b">
            <td class="p-3"><img src="${p.images[0]}" class="w-10 h-10 object-cover rounded-lg"></td>
            <td class="p-3 font-bold">${p.name}</td>
            <td class="p-3 text-xs text-gray-500">${p.category}</td>
            <td class="p-3 font-bold text-[#B8860B]">${p.price.toLocaleString()} دج</td>
            <td class="p-3 font-bold text-xs">${p.inStock ? '🟢 متوفر' : '🔴 غير متوفر'}</td>
            <td class="p-3">
                <button onclick="deleteProduct(${p.id})" class="bg-red-500 text-white text-xs px-3 py-1 rounded-lg">حذف</button>
            </td>
        </tr>
    `).join('');

    // Categories List
    document.getElementById('admin-categories-list').innerHTML = categories.map((c, idx) => `
        <div class="bg-gray-50 rounded-xl border p-3 text-center space-y-2">
            <img src="${c.image}" class="h-20 w-full object-cover rounded-lg">
            <div class="font-bold text-sm">${c.name}</div>
            <button onclick="deleteCategory(${idx})" class="text-red-500 text-xs font-bold">حذف</button>
        </div>
    `).join('');

    // Wilayas List
    document.getElementById('admin-wilayas-list').innerHTML = WILAYAS.map((w, idx) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <div>
                <span class="font-bold">${w.code} - ${w.name}</span>
                <span class="text-xs text-gray-500 block">منزل: ${w.homeCost} دج | مكتب: ${w.officeCost} دج</span>
            </div>
            <button onclick="deleteWilaya(${idx})" class="text-red-500 font-bold">حذف</button>
        </div>
    `).join('');

    // Banners List
    document.getElementById('banner-texts-list').innerHTML = bannerMessages.map((msg, idx) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <span>${msg}</span>
            <button onclick="removeBannerText(${idx})" class="text-red-500 font-bold">حذف</button>
        </div>
    `).join('');

    // Settings
    document.getElementById('set-store-name').value = storeSettings.name;
    document.getElementById('set-store-slogan').value = storeSettings.slogan;
    document.getElementById('set-logo-url').value = storeSettings.logoUrl;
    document.getElementById('set-pass').value = storeSettings.pass;
}

function handleSaveHeroSlide(e) {
    e.preventDefault();
    const newSlide = {
        title: document.getElementById('hero-title-input').value,
        desc: document.getElementById('hero-desc-input').value,
        image: document.getElementById('hero-img-input').value
    };
    heroSlides.push(newSlide);
    localStorage.setItem('lb_hero_slides_v5', JSON.stringify(heroSlides));
    renderHeroSlider();
    renderAdminDashboard();
    alert('تم إضافة الإعلان للبانر بنجاح!');
}

function deleteHeroSlide(idx) {
    heroSlides.splice(idx, 1);
    localStorage.setItem('lb_hero_slides_v5', JSON.stringify(heroSlides));
    renderHeroSlider();
    renderAdminDashboard();
}

function handleSaveProduct(e) {
    e.preventDefault();
    const imgs = [
        document.getElementById('prod-img-main').value,
        document.getElementById('prod-img-2').value,
        document.getElementById('prod-img-3').value,
        document.getElementById('prod-img-4').value,
        document.getElementById('prod-img-5').value
    ].filter(url => url && url.trim() !== '');

    const newP = {
        id: Date.now(),
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        oldPrice: parseFloat(document.getElementById('prod-old-price').value) || null,
        category: document.getElementById('prod-category-select').value,
        brand: document.getElementById('prod-brand-select').value,
        inStock: document.getElementById('prod-in-stock').value === 'true',
        images: imgs,
        desc: document.getElementById('prod-desc').value
    };

    products.push(newP);
    localStorage.setItem('lb_products_v5', JSON.stringify(products));
    renderProducts();
    renderAdminDashboard();
    alert('تم حفظ المنتج بنجاح!');
}

function deleteProduct(id) {
    products = products.filter(p => p.id !== id);
    localStorage.setItem('lb_products_v5', JSON.stringify(products));
    renderProducts();
    renderAdminDashboard();
}

function handleSaveCategory(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name-input').value;
    const img = document.getElementById('cat-img-input').value;

    categories.push({ name, image: img });
    localStorage.setItem('lb_categories_v5', JSON.stringify(categories));
    updateAppHeaderInfo();
    renderAdminDashboard();
    alert('تم حفظ الفئة بنجاح!');
}

function deleteCategory(idx) {
    categories.splice(idx, 1);
    localStorage.setItem('lb_categories_v5', JSON.stringify(categories));
    updateAppHeaderInfo();
    renderAdminDashboard();
}

function handleSaveWilaya(e) {
    e.preventDefault();
    const code = document.getElementById('wilaya-code').value;
    const name = document.getElementById('wilaya-name').value;
    const homeCost = parseFloat(document.getElementById('wilaya-home-cost').value);
    const officeCost = parseFloat(document.getElementById('wilaya-office-cost').value);
    const communesInput = document.getElementById('wilaya-communes-input').value;
    const communes = communesInput ? communesInput.split(',').map(c => c.trim()) : [name];

    WILAYAS.push({ code, name, communes, homeCost, officeCost });
    localStorage.setItem('lb_wilayas_v5', JSON.stringify(WILAYAS));
    renderAdminDashboard();
    alert('تم إضافة الولاية بنجاح!');
}

function deleteWilaya(idx) {
    WILAYAS.splice(idx, 1);
    localStorage.setItem('lb_wilayas_v5', JSON.stringify(WILAYAS));
    renderAdminDashboard();
}

function addBannerText() {
    const txt = document.getElementById('new-banner-text').value;
    if (txt) {
        bannerMessages.push(txt);
        localStorage.setItem('lb_banners_v5', JSON.stringify(bannerMessages));
        document.getElementById('new-banner-text').value = '';
        renderAdminDashboard();
    }
}

function removeBannerText(idx) {
    bannerMessages.splice(idx, 1);
    localStorage.setItem('lb_banners_v5', JSON.stringify(bannerMessages));
    renderAdminDashboard();
}

function handleSaveSettings(e) {
    e.preventDefault();
    storeSettings.name = document.getElementById('set-store-name').value;
    storeSettings.slogan = document.getElementById('set-store-slogan').value;
    storeSettings.logoUrl = document.getElementById('set-logo-url').value;
    storeSettings.pass = document.getElementById('set-pass').value;

    localStorage.setItem('lb_settings_v5', JSON.stringify(storeSettings));
    updateAppHeaderInfo();
    alert('تم حفظ الإعدادات بنجاح!');
}
