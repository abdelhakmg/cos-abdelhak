// --- ملف js/admin.js ---

import { state } from './store/state.js';
import { showCustomAlert, safeCall } from './utils/helpers.js';

let pendingDeleteOrderId = null;

export function handleImageUpload(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;

    showCustomAlert('جاري المعالجة...', 'جاري تحضير الصورة وضغطها للعرض السريع.', true);

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxDimension = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDimension) { height *= maxDimension / width; width = maxDimension; }
            } else {
                if (height > maxDimension) { width *= maxDimension / height; height = maxDimension; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            document.getElementById(targetInputId).value = canvas.toDataURL('image/jpeg', 0.75);
            showCustomAlert('تم الرفع بنجاح! 📸', 'تم إدراج الصورة المرفوعة بنجاح في الحقل.', true);
        };
    };
    reader.readAsDataURL(file);
}

// 🔐 تسجيل الدخول للإدارة
export function checkAdminPassword() {
    const email = document.getElementById('admin-email-input')?.value.trim();
    const password = document.getElementById('admin-pass-input')?.value.trim();

    if (!email || !password) {
        showCustomAlert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور!', false);
        return;
    }

    if (typeof firebase !== 'undefined') {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => firebase.auth().signInWithEmailAndPassword(email, password))
            .then((userCredential) => {
                if (userCredential.user.email !== "mohamed.pato@gmail.com") {
                    firebase.auth().signOut();
                    showCustomAlert('غير مخول', 'عذراً، هذا الحساب ليس له صلاحيات إدارية!', false);
                    return;
                }
                const authModal = document.getElementById('admin-auth-modal');
                if (authModal) {
                    authModal.style.display = 'none';
                    authModal.classList.add('hidden');
                }
                localStorage.setItem('cosAdminLoggedIn', 'true');
                safeCall('showPage', 'admin');
                showCustomAlert('أهلاً بك', 'تم تسجيل الدخول للوحة التحكم بنجاح 🟢', true);
            })
            .catch(() => showCustomAlert('خطأ في الدخول', 'فشل المصادقة: تأكد من صحة البريد أو كلمة المرور.', false));
    }
}

export function adminSignOut() {
    localStorage.removeItem('cosAdminLoggedIn');
    if (typeof firebase !== 'undefined') {
        firebase.auth().signOut().then(() => {
            showCustomAlert('تم تسجيل الخروج', 'تم تأمين وإنهاء الجلسة بنجاح.', true);
            safeCall('showPage', 'home');
        }).catch(err => console.error(err));
    }
}

export function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-white');
        b.classList.add('bg-gray-800', 'text-gray-300');
    });

    const activeTab = document.getElementById('admin-tab-' + tabName);
    if (activeTab) activeTab.classList.add('active');

    const btn = document.getElementById('tab-btn-' + tabName);
    if (btn) {
        btn.classList.remove('bg-gray-800', 'text-gray-300');
        btn.classList.add('bg-black', 'text-white');
    }

    if (tabName === 'shipping') renderAdminWilayasList();
}

export function populateAdminDropdowns() {
    const catSelect = document.getElementById('prod-category-select');
    if (catSelect) {
        catSelect.innerHTML = '<option value="">-- اختر الفئة / القسم * --</option>' + 
            state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
    const brandSelect = document.getElementById('prod-brand-select');
    if (brandSelect) {
        brandSelect.innerHTML = '<option value="">-- اختر العلامة التجارية --</option>' + 
            (state.brands.length > 0 ? state.brands : ["عام"]).map(b => `<option value="${b}">${b}</option>`).join('');
    }
}

// 📦 إضافة/تعديل منتج
export function handleSaveProduct(e) {
    if (e) e.preventDefault();
    try {
        const editId = document.getElementById('editing-product-id').value;
        const name = document.getElementById('prod-name').value.trim();
        const price = parseFloat(document.getElementById('prod-price').value) || 0;
        const oldPriceVal = document.getElementById('prod-old-price').value;
        
        const productData = {
            name, price, oldPrice: oldPriceVal ? parseFloat(oldPriceVal) : null,
            category: document.getElementById('prod-category-select').value,
            brand: document.getElementById('prod-brand-select').value,
            inStock: document.getElementById('prod-in-stock').value === 'true',
            desc: document.getElementById('prod-desc')?.value.trim() || '',
            images: [
                document.getElementById('prod-img-main').value.trim(),
                document.getElementById('prod-img-2')?.value.trim(),
                document.getElementById('prod-img-3')?.value.trim()
            ].filter(Boolean),
            updatedAt: new Date()
        };

        if (editId) {
            db.collection("products").doc(editId).update(productData).then(() => {
                resetProductForm(); showCustomAlert('تم التحديث 🎉', 'تم التحديث بنجاح!', true);
            });
        } else {
            db.collection("products").add({ ...productData, createdAt: new Date() }).then(() => {
                resetProductForm(); showCustomAlert('تم الحفظ 🎉', 'تم الإضافة بنجاح!', true);
            });
        }
    } catch (err) {
        showCustomAlert('خطأ', 'تعذر الحفظ: ' + err.message, false);
    }
}

export function resetProductForm() {
    document.getElementById('product-edit-form').reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

export function editProduct(id) {
    const p = state.products.find(prod => prod.id === id);
    if (!p) return;
    document.getElementById('editing-product-id').value = p.id;
    document.getElementById('prod-name').value = p.name || '';
    document.getElementById('prod-price').value = p.price || '';
    document.getElementById('prod-old-price').value = p.oldPrice || '';
    document.getElementById('prod-category-select').value = p.category || '';
    document.getElementById('prod-brand-select').value = p.brand || '';
    document.getElementById('prod-in-stock').value = p.inStock !== false ? 'true' : 'false';
    document.getElementById('prod-desc').value = p.desc || '';
    
    const imgs = p.images || [];
    document.getElementById('prod-img-main').value = imgs[0] || '';
    document.getElementById('prod-img-2').value = imgs[1] || '';
    document.getElementById('prod-img-3').value = imgs[2] || '';

    document.getElementById('product-form-title').innerText = 'تعديل المنتج: ' + p.name;
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('product-edit-form').offsetTop - 100, behavior: 'smooth' });
}

export function deleteProduct(id) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
        db.collection("products").doc(id).delete().then(() => showCustomAlert('تم الحذف', 'تم الحذف بنجاح.', true));
    }
}

// 📊 لوحة التحكم والإحصائيات
export function renderAdminDashboard() {
    const confirmedOrders = state.orders.filter(o => o.status === 'مكتملاً' || o.status === 'مؤكد' || !o.status);
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedCount = state.orders.filter(o => o.status === 'مكتملاً').length;
    const successRate = state.orders.length ? Math.round((completedCount / state.orders.length) * 100) : 0;

    if (document.getElementById('stat-total-sales')) document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    if (document.getElementById('stat-orders-count')) document.getElementById('stat-orders-count').innerText = state.orders.length;
    if (document.getElementById('stat-avg-order')) document.getElementById('stat-avg-order').innerText = confirmedOrders.length ? Math.round(totalSales / confirmedOrders.length).toLocaleString() + ' دج' : '0 دج';
    if (document.getElementById('stat-success-rate')) document.getElementById('stat-success-rate').innerText = successRate + '%';

    renderAdminProductsTable();
    populateAdminDropdowns();
    renderAdminWilayasList();
}

export function renderAdminProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    if (state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد منتجات مسجلة</td></tr>';
        return;
    }
    tbody.innerHTML = state.products.map(p => {
        const img = (p.images && p.images[0]) || p.image || 'https://via.placeholder.com/100';
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3"><img src="${img}" class="w-12 h-12 object-contain rounded-lg border bg-black"></td>
                <td class="p-3 font-bold text-xs">${p.name}</td>
                <td class="p-3 text-xs">${p.category || 'عام'}</td>
                <td class="p-3 text-[11px] text-gray-600">-</td>
                <td class="p-3 font-black text-xs text-[#B8860B]">${(p.price || 0).toLocaleString()} دج</td>
                <td class="p-3 text-xs"><span class="${p.inStock !== false ? 'text-green-600' : 'text-red-500'}">${p.inStock !== false ? 'متوفر 🟢' : 'غير متوفر 🔴'}</span></td>
                <td class="p-3 flex items-center gap-2">
                    <button onclick="editProduct('${p.id}')" class="bg-blue-100 text-blue-700 font-bold text-xs px-2 py-1 rounded-lg">تعديل</button>
                    <button onclick="deleteProduct('${p.id}')" class="bg-red-100 text-red-600 font-bold text-xs px-2 py-1 rounded-lg">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 🚚 الولايات والأسعار
export function handleSaveWilaya(e) {
    if (e) e.preventDefault();
    const code = document.getElementById('wilaya-code').value.trim();
    const name = document.getElementById('wilaya-name').value.trim();
    const officeCost = parseFloat(document.getElementById('wilaya-office-cost').value) || 0;
    const homeCost = parseFloat(document.getElementById('wilaya-home-cost').value) || 0;

    if (!code || !name) return;
    db.collection("wilayas").doc(code).set({ code, name, officeCost, homeCost }).then(() => {
        resetWilayaForm(); showCustomAlert('تم الحفظ', 'تم حفظ تسعير الولاية بنجاح!', true);
    });
}

export function resetWilayaForm() {
    document.getElementById('wilaya-edit-form').reset();
    document.getElementById('editing-wilaya-id').value = '';
    document.getElementById('cancel-wilaya-edit-btn').classList.add('hidden');
}

export function editWilaya(code) {
    const w = state.WILAYAS.find(wil => wil.code === code);
    if (!w) return;
    document.getElementById('wilaya-code').value = w.code;
    document.getElementById('wilaya-name').value = w.name;
    document.getElementById('wilaya-office-cost').value = w.officeCost || 0;
    document.getElementById('wilaya-home-cost').value = w.homeCost || 0;
    document.getElementById('cancel-wilaya-edit-btn').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('wilaya-edit-form').offsetTop - 100, behavior: 'smooth' });
}

export function deleteWilaya(code) {
    if (confirm('متأكد من الحذف؟')) {
        db.collection("wilayas").doc(code).delete().then(() => showCustomAlert('تم الحذف', 'تم حذف الولاية.', true));
    }
}

export function renderAdminWilayasList() {
    const container = document.getElementById('admin-wilayas-list');
    if (!container) return;
    container.innerHTML = state.WILAYAS.map(w => `
        <div class="bg-gray-50 border p-4 rounded-2xl flex justify-between items-center text-xs shadow-sm my-2">
            <div>
                <span class="font-bold text-gray-900">${w.code} - ${w.name}</span>
                <div class="flex gap-4 mt-2 text-gray-700">
                    <span>المكتب: <strong class="text-[#B8860B]">${w.officeCost || 0} دج</strong></span>
                    <span>المنزل: <strong class="text-emerald-600">${w.homeCost || 0} دج</strong></span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editWilaya('${w.code}')" class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl">تعديل</button>
                <button onclick="deleteWilaya('${w.code}')" class="bg-red-100 text-red-600 px-3 py-1.5 rounded-xl">حذف</button>
            </div>
        </div>
    `).join('');
}

export function handleSaveSettings(e) {
    if (e) e.preventDefault();
    const s = {
        name: document.getElementById('set-store-name').value,
        slogan: document.getElementById('set-store-slogan').value,
        logoUrl: document.getElementById('set-logo-url').value,
        msgSuccess: document.getElementById('set-msg-success').value,
        msgWarning: document.getElementById('set-msg-warning').value
    };
    db.collection("settings").doc("main").set(s, { merge: true }).then(() => {
        showCustomAlert('تم الحفظ', 'تم تحديث الإعدادات.', true);
    });
}

// Window Bindings
window.handleImageUpload = handleImageUpload;
window.checkAdminPassword = checkAdminPassword;
window.adminSignOut = adminSignOut;
window.switchAdminTab = switchAdminTab;
window.handleSaveProduct = handleSaveProduct;
window.resetProductForm = resetProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.handleSaveWilaya = handleSaveWilaya;
window.resetWilayaForm = resetWilayaForm;
window.editWilaya = editWilaya;
window.deleteWilaya = deleteWilaya;
window.handleSaveSettings = handleSaveSettings;
