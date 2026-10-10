// js/admin.js - إدارة لوحة التحكم والتحقق المباشر من الأمان

// كلمة المرور الافتراضية (123456) أو المسجلة سابقاً
let adminPassword = localStorage.getItem('lb_admin_pass_v7') || '123456';

// التحقق الفوري من كلمة المرور
function checkAdminPassword() {
    const inputEl = document.getElementById('admin-pass-input');
    if (!inputEl) {
        alert('حدث خطأ: حقل كلمة المرور غير موجود');
        return;
    }

    const inputVal = inputEl.value ? inputEl.value.trim() : '';

    if (inputVal === adminPassword) {
        // كلمة المرور صحيحة - إغلاق النافذة والدخول
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
        inputEl.value = ''; // مسح الحقل للأمان
        
        // فتح صفحة التحكم
        showPage('admin');
        if (typeof renderAdminDashboard === 'function') {
            renderAdminDashboard();
        }
    } else {
        // كلمة المرور خاطئة
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('خطأ في الدخول ❌', 'كلمة المرور غير صحيحة! جرب كلمة السر الافتراضية: 123456', false);
        } else {
            alert('كلمة المرور غير صحيحة! كلمة السر الافتراضية هي: 123456');
        }
    }
}

// تشغيل زر Enter عند كتابة كلمة السر
document.addEventListener('DOMContentLoaded', () => {
    const passInput = document.getElementById('admin-pass-input');
    if (passInput) {
        passInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAdminPassword();
            }
        });
    }
});

// التنقل بين تبويبات لوحة التحكم
function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-black', 'text-white');
        btn.classList.add('bg-gray-800', 'text-gray-300');
    });

    const targetTab = document.getElementById('admin-tab-' + tabName);
    const targetBtn = document.getElementById('tab-btn-' + tabName);

    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) {
        targetBtn.classList.remove('bg-gray-800', 'text-gray-300');
        targetBtn.classList.add('bg-black', 'text-white');
    }
}

// عرض الإحصائيات والبيانات
function renderAdminDashboard() {
    renderAnalyticsStats();
    renderOrdersLog();
    renderAdminProducts();
    renderAdminBrands();
    renderAdminCategories();
    renderAdminWilayas();
    renderSettingsTab();
}

function renderAnalyticsStats() {
    let totalSales = 0;
    let ordersCount = typeof orders !== 'undefined' ? orders.length : 0;
    let completedOrders = 0;

    if (typeof orders !== 'undefined') {
        orders.forEach(o => {
            if (o.status === 'مكتملاً' || o.status === 'مؤكد') {
                totalSales += (o.total || 0);
                completedOrders++;
            }
        });
    }

    const avgOrder = ordersCount > 0 ? Math.round(totalSales / ordersCount) : 0;
    const successRate = ordersCount > 0 ? Math.round((completedOrders / ordersCount) * 100) : 0;

    const salesEl = document.getElementById('stat-total-sales');
    const countEl = document.getElementById('stat-orders-count');
    const avgEl = document.getElementById('stat-avg-order');
    const rateEl = document.getElementById('stat-success-rate');

    if (salesEl) salesEl.innerText = totalSales.toLocaleString() + ' دج';
    if (countEl) countEl.innerText = ordersCount;
    if (avgEl) avgEl.innerText = avgOrder.toLocaleString() + ' دج';
    if (rateEl) rateEl.innerText = successRate + '%';
}

function renderOrdersLog() {
    const tbody = document.getElementById('admin-orders-log');
    const filterStatus = document.getElementById('order-status-filter')?.value || 'الجميع';
    if (!tbody || typeof orders === 'undefined') return;

    let filteredOrders = [...orders];

    if (filterStatus !== 'الجميع') {
        filteredOrders = filteredOrders.filter(o => o.status === filterStatus);
    }

    if (filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">لا توجد طلبيات مسجلة حالياً.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredOrders.map((o, idx) => `
        <tr class="border-b hover:bg-gray-50 text-xs text-gray-900">
            <td class="p-3">
                <p class="font-bold">${o.customer || 'غير محدد'}</p>
                <p class="text-gray-500 font-mono">${o.phone || ''}</p>
            </td>
            <td class="p-3">
                <p class="font-bold">${o.wilaya || ''}</p>
                <p class="text-gray-500">${o.commune || ''}</p>
            </td>
            <td class="p-3">
                <p class="font-bold text-blue-900">${o.product || ''}</p>
                <p class="font-black text-[#B8860B]">${o.total ? o.total.toLocaleString() : 0} دج</p>
            </td>
            <td class="p-3">
                <select onchange="updateOrderStatus('${o.id || idx}', this.value)" class="border p-1.5 rounded-lg text-xs font-bold bg-white">
                    <option value="جديد" ${o.status === 'جديد' ? 'selected' : ''}>🟡 جديد</option>
                    <option value="مؤكد" ${o.status === 'مؤكد' ? 'selected' : ''}>🔵 مؤكد</option>
                    <option value="قيد الشحن" ${o.status === 'قيد الشحن' ? 'selected' : ''}>🟣 قيد الشحن</option>
                    <option value="مكتملاً" ${o.status === 'مكتملاً' ? 'selected' : ''}>🟢 مكتمل</option>
                    <option value="ملغى" ${o.status === 'ملغى' ? 'selected' : ''}>🔴 ملغى</option>
                </select>
            </td>
            <td class="p-3 flex items-center gap-2 pt-4">
                <a href="tel:${o.phone}" class="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700" title="اتصال">
                    <i class="fa-solid fa-phone"></i>
                </a>
                <button onclick="deleteOrder('${o.id || idx}')" class="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700" title="حذف">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, newStatus) {
    if (typeof db !== 'undefined') {
        db.collection("orders").doc(orderId).update({ status: newStatus }).then(() => {
            renderAdminDashboard();
        });
    }
}

function deleteOrder(orderId) {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذه الطلبية؟')) {
        if (typeof db !== 'undefined') {
            db.collection("orders").doc(orderId).delete().then(() => {
                renderAdminDashboard();
            });
        }
    }
}

function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');
    const catSelect = document.getElementById('prod-category-select');
    const brandSelect = document.getElementById('prod-brand-select');

    if (catSelect && typeof categories !== 'undefined') {
        catSelect.innerHTML = '<option value="">اختر الفئة... *</option>' + 
            categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }

    if (brandSelect && typeof brands !== 'undefined') {
        brandSelect.innerHTML = '<option value="">اختر الماركة (اختياري)...</option>' + 
            brands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
    }

    if (!tbody || typeof products === 'undefined') return;

    tbody.innerHTML = products.map((p) => `
        <tr class="border-b text-xs text-gray-900">
            <td class="p-3"><img src="${(p.images && p.images[0]) || 'https://via.placeholder.com/40'}" class="w-10 h-10 object-contain rounded-lg bg-black"></td>
            <td class="p-3 font-bold">${p.name}</td>
            <td class="p-3 text-gray-500">${p.category || '-'}</td>
            <td class="p-3 text-gray-500">${p.brand || '-'}</td>
            <td class="p-3 font-bold text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
            <td class="p-3"><span class="px-2 py-1 rounded-full text-[10px] font-bold ${p.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${p.inStock ? 'متوفر' : 'غير متوفر'}</span></td>
            <td class="p-3">
                <button onclick="editProduct('${p.id}')" class="bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-700 ml-1">تعديل</button>
                <button onclick="deleteProduct('${p.id}')" class="bg-red-600 text-white px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-700">حذف</button>
            </td>
        </tr>
    `).join('');
}

function handleSaveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('editing-product-id').value;
    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value) || 0;
    const oldPrice = parseFloat(document.getElementById('prod-old-price').value) || 0;
    const category = document.getElementById('prod-category-select').value;
    const brand = document.getElementById('prod-brand-select').value;
    const inStock = document.getElementById('prod-in-stock').value === 'true';
    const desc = document.getElementById('prod-desc').value;

    const img1 = document.getElementById('prod-img-main').value;
    const img2 = document.getElementById('prod-img-2').value;
    const img3 = document.getElementById('prod-img-3').value;
    const img4 = document.getElementById('prod-img-4').value;
    const img5 = document.getElementById('prod-img-5').value;

    const images = [img1, img2, img3, img4, img5].filter(img => img && img.trim() !== '');

    const prodData = { name, price, oldPrice, category, brand, inStock, desc, images };

    if (typeof db !== 'undefined') {
        if (id) {
            db.collection("products").doc(id).update(prodData).then(() => {
                resetProductForm();
                renderAdminDashboard();
                showCustomAlert('تم التحديث', 'تم تعديل المنتج بنجاح!', true);
            });
        } else {
            db.collection("products").add(prodData).then(() => {
                resetProductForm();
                renderAdminDashboard();
                showCustomAlert('تمت الإضافة', 'تمت إضافة المنتج بنجاح!', true);
            });
        }
    }
}

function editProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('editing-product-id').value = p.id;
    document.getElementById('prod-name').value = p.name || '';
    document.getElementById('prod-price').value = p.price || '';
    document.getElementById('prod-old-price').value = p.oldPrice || '';
    document.getElementById('prod-category-select').value = p.category || '';
    document.getElementById('prod-brand-select').value = p.brand || '';
    document.getElementById('prod-in-stock').value = p.inStock ? 'true' : 'false';
    document.getElementById('prod-desc').value = p.desc || '';

    if (p.images) {
        document.getElementById('prod-img-main').value = p.images[0] || '';
        document.getElementById('prod-img-2').value = p.images[1] || '';
        document.getElementById('prod-img-3').value = p.images[2] || '';
        document.getElementById('prod-img-4').value = p.images[3] || '';
        document.getElementById('prod-img-5').value = p.images[4] || '';
    }

    document.getElementById('product-form-title').innerText = 'تعديل بيانات المنتج';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetProductForm() {
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-edit-form').reset();
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج (مع رفع الصور والعد التنازلي)';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

function deleteProduct(id) {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج؟')) {
        if (typeof db !== 'undefined') {
            db.collection("products").doc(id).delete().then(() => {
                renderAdminDashboard();
                showCustomAlert('تم الحذف', 'تم حذف المنتج بنجاح.', true);
            });
        }
    }
}

function handleImageUpload(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById(targetInputId).value = e.target.result;
    };
    reader.readAsDataURL(file);
}

function renderAdminBrands() {
    const container = document.getElementById('admin-brands-list');
    if (!container || typeof brands === 'undefined') return;
    container.innerHTML = brands.map(b => `
        <div class="bg-gray-100 p-3 rounded-xl flex justify-between items-center text-xs font-bold text-gray-900">
            <span>${b.name}</span>
            <button onclick="deleteBrand('${b.id}')" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

function renderAdminCategories() {
    const container = document.getElementById('admin-categories-list');
    if (!container || typeof categories === 'undefined') return;
    container.innerHTML = categories.map(c => `
        <div class="bg-gray-100 p-3 rounded-xl flex justify-between items-center text-xs font-bold text-gray-900">
            <div class="flex items-center gap-2">
                <img src="${c.image}" class="w-8 h-8 rounded-lg object-cover">
                <span>${c.name}</span>
            </div>
            <button onclick="deleteCategory('${c.id}')" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

function renderAdminWilayas() {
    const container = document.getElementById('admin-wilayas-list');
    if (!container || typeof WILAYAS === 'undefined') return;
    container.innerHTML = WILAYAS.map(w => `
        <div class="bg-gray-50 p-3 rounded-xl border flex justify-between items-center text-xs text-gray-900">
            <div>
                <span class="font-bold">${w.code} - ${w.name}</span>
                <p class="text-gray-500">المنزل: ${w.homeCost} دج | المكتب: ${w.officeCost} دج</p>
            </div>
        </div>
    `).join('');
}

function renderSettingsTab() {
    if (typeof storeSettings === 'undefined') return;
    const nameInput = document.getElementById('set-store-name');
    const sloganInput = document.getElementById('set-store-slogan');
    const logoInput = document.getElementById('set-logo-url');
    const pixelInput = document.getElementById('set-meta-pixel-id');

    if (nameInput) nameInput.value = storeSettings.name || 'كوسمتيك عبد الحق';
    if (sloganInput) sloganInput.value = storeSettings.slogan || '';
    if (logoInput) logoInput.value = storeSettings.logoUrl || '';
    if (pixelInput) pixelInput.value = storeSettings.metaPixelId || '';
}

function handleSaveSettings(e) {
    e.preventDefault();
    const name = document.getElementById('set-store-name').value;
    const slogan = document.getElementById('set-store-slogan').value;
    const logoUrl = document.getElementById('set-logo-url').value;
    const newPass = document.getElementById('set-pass').value;
    const metaPixelId = document.getElementById('set-meta-pixel-id').value;

    if (newPass && newPass.trim() !== '') {
        adminPassword = newPass.trim();
        localStorage.setItem('lb_admin_pass_v7', adminPassword);
    }

    const settingsData = { name, slogan, logoUrl, metaPixelId };

    if (typeof db !== 'undefined') {
        db.collection("settings").doc("main").set(settingsData, { merge: true }).then(() => {
            if (typeof storeSettings !== 'undefined') storeSettings = { ...storeSettings, ...settingsData };
            if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
            showCustomAlert('تم الحفظ', 'تمت تحديث كافة إعدادات المتجر بنجاح!', true);
        });
    }
}
