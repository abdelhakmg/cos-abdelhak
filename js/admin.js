let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick(event) {
    logoClickCount++;
    if (logoClickCount === 1) {
        logoClickTimer = setTimeout(() => {
            if (logoClickCount < 3) {
                showPage('home');
            }
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
        b.classList.add('bg-gray-200', 'text-gray-700');
    });

    document.getElementById('admin-tab-' + tabName).classList.add('active');
    const btn = document.getElementById('tab-btn-' + tabName);
    btn.classList.remove('bg-gray-200', 'text-gray-700');
    btn.classList.add('bg-black', 'text-white');
}

function renderAdminDashboard() {
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    document.getElementById('stat-orders-count').innerText = orders.length;
    document.getElementById('stat-avg-order').innerText = orders.length ? Math.round(totalSales / orders.length).toLocaleString() + ' دج' : '0 دج';

    document.getElementById('admin-orders-log').innerHTML = orders.length === 0 ? '<p class="text-gray-400">لا توجد طلبات واردة بعد</p>' : 
        orders.map(o => `
            <div class="border-b pb-3 flex justify-between items-center text-sm">
                <div>
                    <div class="font-bold">${o.customer} (${o.phone})</div>
                    <div class="text-xs text-gray-500">${o.wilaya} - ${o.commune} | ${o.product}</div>
                </div>
                <div class="text-left"><span class="font-black text-[#B8860B]">${o.total.toLocaleString()} دج</span><span class="block text-[10px] text-gray-400">${o.date}</span></div>
            </div>
        `).join('');

    // Render Banner Messages list in admin
    document.getElementById('banner-texts-list').innerHTML = bannerMessages.map((msg, idx) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <span>${msg}</span>
            <button onclick="removeBannerText(${idx})" class="text-red-500 font-bold hover:text-red-700">حذف</button>
        </div>
    `).join('');

    document.getElementById('prod-category-select').innerHTML = categories.filter(c => c !== 'الرئيسية').map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('set-store-name').value = storeSettings.name;
    document.getElementById('set-store-slogan').value = storeSettings.slogan;
    document.getElementById('set-logo-url').value = storeSettings.logoUrl;
    document.getElementById('set-pass').value = storeSettings.pass;
}

function addBannerText() {
    const txt = document.getElementById('new-banner-text').value;
    if (txt) {
        bannerMessages.push(txt);
        localStorage.setItem('lb_banners', JSON.stringify(bannerMessages));
        document.getElementById('new-banner-text').value = '';
        renderAdminDashboard();
    }
}

function removeBannerText(idx) {
    bannerMessages.splice(idx, 1);
    localStorage.setItem('lb_banners', JSON.stringify(bannerMessages));
    renderAdminDashboard();
}

function handleSaveProduct(e) {
    e.preventDefault();
    const newP = {
        id: Date.now(),
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        oldPrice: parseFloat(document.getElementById('prod-old-price').value) || null,
        category: document.getElementById('prod-category-select').value,
        image: document.getElementById('prod-img').value,
        desc: document.getElementById('prod-desc').value
    };
    products.push(newP);
    localStorage.setItem('lb_products', JSON.stringify(products));
    renderProducts();
    renderAdminDashboard();
    alert('تم حفظ المنتج بنجاح!');
}

function handleSaveSettings(e) {
    e.preventDefault();
    storeSettings.name = document.getElementById('set-store-name').value;
    storeSettings.slogan = document.getElementById('set-store-slogan').value;
    storeSettings.logoUrl = document.getElementById('set-logo-url').value;
    storeSettings.pass = document.getElementById('set-pass').value;
    localStorage.setItem('lb_settings', JSON.stringify(storeSettings));
    updateAppHeaderInfo();
    alert('تم حفظ الإعدادات بنجاح!');
}
