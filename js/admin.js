let logoClickCount = 0;
let logoClickTimer = null;

// Triple Click Detection
document.getElementById('logo-trigger').addEventListener('click', () => {
    logoClickCount++;
    if (logoClickCount === 1) {
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1200);
    } else if (logoClickCount === 3) {
        clearTimeout(logoClickTimer);
        logoClickCount = 0;
        document.getElementById('admin-auth-modal').style.display = 'flex';
    }
});

function checkAdminPassword() {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === storeSettings.pass) {
        document.getElementById('admin-auth-modal').style.display = 'none';
        document.getElementById('admin-pass-input').value = '';
        showPage('admin');
    } else {
        alert('كلمة المرور خاطئة!');
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

    document.getElementById('admin-orders-log').innerHTML = orders.length === 0 ? '<p class="text-gray-400">لا توجد طلبات</p>' : 
        orders.map(o => `
            <div class="border-b pb-2 flex justify-between text-sm">
                <div><strong>${o.customer}</strong> (${o.phone}) - ${o.product}</div>
                <div class="text-[#B8860B] font-bold">${o.total.toLocaleString()} دج</div>
            </div>
        `).join('');

    document.getElementById('set-store-name').value = storeSettings.name;
    document.getElementById('set-pass').value = storeSettings.pass;
}

function handleSaveProduct(e) {
    e.preventDefault();
    const newP = {
        id: Date.now(),
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        category: 'المنتجات',
        image: document.getElementById('prod-img').value,
        desc: document.getElementById('prod-desc').value
    };
    products.push(newP);
    localStorage.setItem('lb_products', JSON.stringify(products));
    renderProducts();
    renderAdminDashboard();
    alert('تم حفظ المنتج!');
}

function handleSaveSettings(e) {
    e.preventDefault();
    storeSettings.name = document.getElementById('set-store-name').value;
    storeSettings.pass = document.getElementById('set-pass').value;
    localStorage.setItem('lb_settings', JSON.stringify(storeSettings));
    alert('تم حفظ الإعدادات!');
}
