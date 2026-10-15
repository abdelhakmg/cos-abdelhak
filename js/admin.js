// --- ملف js/admin.js (عقل المنصة والمحرك الديناميكي الشامل) ---

import { state } from './store/state.js';
import { showCustomAlert, safeCall } from './utils/helpers.js';

let pendingDeleteOrderId = null;

// =====================================
// دوال النظام والمصادقة
// =====================================
export function checkAdminPassword() {
    const emailInput = document.getElementById('admin-email-input');
    const passInput = document.getElementById('admin-pass-input');
    if (!emailInput || !passInput) return;
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        showCustomAlert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور!', false);
        return;
    }

    if (typeof window.firebase !== 'undefined') {
        window.firebase.auth().setPersistence(window.firebase.auth.Auth.Persistence.LOCAL)
            .then(() => window.firebase.auth().signInWithEmailAndPassword(email, password))
            .then((userCredential) => {
                const user = userCredential.user;
                if (user.email !== "mohamed.pato@gmail.com") {
                    window.firebase.auth().signOut();
                    showCustomAlert('غير مخول', 'عذراً، هذا الحساب ليس له صلاحيات إدارية!', false);
                    return;
                }
                const authModal = document.getElementById('admin-auth-modal');
                if (authModal) {
                    authModal.style.display = 'none';
                    authModal.classList.add('hidden');
                }
                localStorage.setItem('cosAdminLoggedIn', 'true');
                emailInput.value = ''; passInput.value = '';
                safeCall('showPage', 'admin');
                showCustomAlert('أهلاً بك', 'تم تسجيل الدخول للوحة التحكم بنجاح 🟢', true);
            })
            .catch(() => showCustomAlert('خطأ في الدخول', 'فشل المصادقة: تأكد من صحة البيانات.', false));
    }
}

export function adminSignOut() {
    localStorage.removeItem('cosAdminLoggedIn');
    if (typeof window.firebase !== 'undefined') {
        window.firebase.auth().signOut().then(() => {
            showCustomAlert('تم تسجيل الخروج', 'تم تأمين وإنهاء الجلسة بنجاح.', true);
            safeCall('showPage', 'home');
        });
    }
}

export function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-white', 'border-[#D4AF37]/30');
        b.classList.add('bg-gray-800', 'text-gray-300');
    });

    const activeTab = document.getElementById('admin-tab-' + tabName);
    if (activeTab) activeTab.classList.add('active');

    const btn = document.getElementById('tab-btn-' + tabName);
    if (btn) {
        btn.classList.remove('bg-gray-800', 'text-gray-300');
        btn.classList.add('bg-black', 'text-white', 'border-[#D4AF37]/30');
    }

    if (tabName === 'shipping_settings') if (typeof renderAdminWilayasList === 'function') renderAdminWilayasList();
    if (tabName === 'categories_attributes') {
        if (typeof renderAdminBrandsList === 'function') renderAdminBrandsList();
        if (typeof renderAdminCategoriesList === 'function') renderAdminCategoriesList();
        populateFilterCategories(); // تحديث صانع الفلاتر
    }
    if (tabName === 'marketing_ui') {
        if (typeof renderBannerTextsList === 'function') renderBannerTextsList();
        if (typeof renderAdminHeroSlidesList === 'function') renderAdminHeroSlidesList();
    }
}

export function populateAdminDropdowns() {
    const catSelect = document.getElementById('prod-category-select');
    if (catSelect) {
        catSelect.innerHTML = '<option value="">-- اختر الفئة / القسم * --</option>' + 
            state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }

    const brandSelect = document.getElementById('prod-brand-select');
    if (brandSelect) {
        const brandList = state.brands.length > 0 ? state.brands : ["عام"];
        brandSelect.innerHTML = '<option value="">-- اختر العلامة التجارية (الماركة) --</option>' + 
            brandList.map(b => `<option value="${typeof b === 'object' ? b.name : b}">${typeof b === 'object' ? b.name : b}</option>`).join('');
    }

    populateFilterCategories();
    renderCategorySpecificAdminFields();
}

// =====================================
// 🚀 المحرك الذكي: ربط الأقسام بصانع الفلاتر
// =====================================

// 1. عند الضغط على بطاقة القسم، ينزل بك لصانع الفلاتر
export function selectCategoryForFilter(catName) {
    const select = document.getElementById('new-attr-category');
    if (select) {
        select.value = catName;
        renderDynamicAttributesList(); // جلب الفلاتر فوراً
        select.scrollIntoView({ behavior: 'smooth', block: 'center' }); // نزول سلس للشاشة
        showCustomAlert('تم التحديد', `تم تحديد قسم (${catName}) بنجاح، يمكنك إضافة فلاتر له الآن أسفله.`, true);
    }
}

export function populateFilterCategories() {
    const select = document.getElementById('new-attr-category');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- اختر القسم المستهدف --</option>' + 
            state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        select.value = currentValue;
        select.addEventListener('change', renderDynamicAttributesList);
    }
}

export function handleSaveDynamicAttribute(e) {
    e.preventDefault();
    const catName = document.getElementById('new-attr-category').value;
    const attrName = document.getElementById('new-attr-name').value.trim();
    const attrOptionsStr = document.getElementById('new-attr-options').value.trim();

    if (!catName || !attrName || !attrOptionsStr) return;

    const options = attrOptionsStr.split(',').map(o => o.trim()).filter(Boolean);
    
    if (!state.categoryFilters) state.categoryFilters = {};
    if (!state.categoryFilters[catName]) state.categoryFilters[catName] = [];

    // إضافة الفلتر الجديد
    state.categoryFilters[catName].push({ name: attrName, options: options });

    // حفظ في فايربيس
    window.db.collection("settings").doc("main").set({ categoryFilters: state.categoryFilters }, { merge: true }).then(() => {
        document.getElementById('new-attr-name').value = '';
        document.getElementById('new-attr-options').value = '';
        renderDynamicAttributesList(); // تحديث القائمة فوراً
        showCustomAlert('تم الحفظ 🛠️', `تمت إضافة فلتر (${attrName}) لقسم (${catName}) بنجاح!`, true);
    });
}

export function renderDynamicAttributesList() {
    const catName = document.getElementById('new-attr-category')?.value;
    const listContainer = document.getElementById('admin-dynamic-attributes-list');
    if (!listContainer) return;

    if (!catName || !state.categoryFilters || !state.categoryFilters[catName] || state.categoryFilters[catName].length === 0) {
        listContainer.innerHTML = '<p class="text-xs text-gray-400 col-span-full">لا توجد فلاتر مخصصة لهذا القسم بعد. صمم أول فلتر من الأعلى!</p>';
        return;
    }

    listContainer.innerHTML = state.categoryFilters[catName].map((attr, idx) => `
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-xs space-y-3">
            <div class="flex justify-between items-center border-b pb-2">
                <span class="font-black text-[#B8860B]"><i class="fa-solid fa-filter"></i> ${attr.name}</span>
                <button type="button" onclick="deleteDynamicAttribute('${catName}', ${idx})" class="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg font-bold transition">حذف الفلتر</button>
            </div>
            <div class="flex flex-wrap gap-1.5">
                ${attr.options.map(opt => `<span class="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 font-bold">${opt}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

export function deleteDynamicAttribute(catName, idx) {
    if (confirm('هل أنت متأكد من حذف هذا الفلتر نهائياً؟ ستفقده المنتجات المرتبطة به.')) {
        state.categoryFilters[catName].splice(idx, 1);
        window.db.collection("settings").doc("main").set({ categoryFilters: state.categoryFilters }, { merge: true }).then(() => {
            renderDynamicAttributesList();
        });
    }
}

// =====================================
// 🎯 عرض الفلاتر الديناميكية عند "إضافة منتج"
// =====================================
export function renderCategorySpecificAdminFields() {
    const catSelect = document.getElementById('prod-category-select');
    const container = document.getElementById('category-dynamic-fields-container');
    if (!catSelect || !container) return;

    const selectedCategory = (catSelect.value || '').trim();
    let html = '';

    // قراءة الفلاتر المرتبطة بهذا القسم من قاعدة البيانات
    if (state.categoryFilters && state.categoryFilters[selectedCategory] && state.categoryFilters[selectedCategory].length > 0) {
        html += `<div class="bg-gray-50 p-5 rounded-2xl border border-[#D4AF37]/40 space-y-5 mb-4 shadow-sm">
            <h4 class="font-black text-sm text-[#B8860B]"><i class="fa-solid fa-layer-group"></i> فلاتر قسم (${selectedCategory}) المخصصة:</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">`;
        
        state.categoryFilters[selectedCategory].forEach((attr, index) => {
            html += `
            <div>
                <label class="block text-xs font-bold text-gray-800 mb-2">${attr.name}</label>
                <div class="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
                    ${attr.options.map(opt => `
                        <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700 hover:text-black">
                            <input type="checkbox" value="${opt}" data-attr-name="${attr.name}" class="dynamic-attr-cb accent-[#D4AF37] w-4 h-4 cursor-pointer">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>`;
        });

        html += `</div></div>`;
    } else if (selectedCategory) {
         html = `<div class="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4 space-y-2">
            <h4 class="font-bold text-xs text-blue-800"><i class="fa-solid fa-circle-info"></i> لا توجد فلاتر مخصصة</h4>
            <p class="text-[10px] text-blue-600">يمكنك صنع فلاتر احترافية (Checkboxes) لهذا القسم من تبويب "الأقسام والخصائص".</p>
        </div>`;
    }

    container.innerHTML = html;
}

// =====================================
// إضافة وحفظ المنتجات باستخدام المحرك الجديد
// =====================================
export function handleSaveProduct(e) {
    if (e) e.preventDefault();
    try {
        const editId = document.getElementById('editing-product-id').value;
        
        // 🚀 السحر هنا: تجميع الفلاتر الديناميكية المختارة بذكاء
        const dynamicCheckboxes = document.querySelectorAll('.dynamic-attr-cb:checked');
        const customAttributes = {};
        dynamicCheckboxes.forEach(cb => {
            const attrName = cb.getAttribute('data-attr-name');
            if (!customAttributes[attrName]) customAttributes[attrName] = [];
            customAttributes[attrName].push(cb.value);
        });

        const productData = {
            name: document.getElementById('prod-name').value.trim(),
            price: parseFloat(document.getElementById('prod-price').value) || 0,
            oldPrice: document.getElementById('prod-old-price').value ? parseFloat(document.getElementById('prod-old-price').value) : null,
            category: document.getElementById('prod-category-select').value,
            brand: document.getElementById('prod-brand-select').value,
            inStock: document.getElementById('prod-in-stock').value === 'true',
            
            attributes: customAttributes, // هنا تُحفظ كل الفلاتر مهما كان القسم!
            
            colors: document.getElementById('prod-colors')?.value.trim() || '',
            numbers: document.getElementById('prod-numbers')?.value.trim() || '',
            desc: document.getElementById('prod-desc')?.value.trim() || '',
            images: [
                document.getElementById('prod-img-main').value.trim(),
                document.getElementById('prod-img-2')?.value.trim(),
                document.getElementById('prod-img-3')?.value.trim()
            ].filter(Boolean),
            updatedAt: new Date()
        };

        if (editId) {
            window.db.collection("products").doc(editId).update(productData).then(() => {
                resetProductForm();
                showCustomAlert('تم التحديث 🎉', 'تم تحديث بيانات المنتج بنجاح!', true);
            });
        } else {
            window.db.collection("products").add({ ...productData, createdAt: new Date() }).then(() => {
                resetProductForm();
                showCustomAlert('تم الحفظ 🎉', 'تم إضافة المنتج الجديد بنجاح!', true);
            });
        }
    } catch (err) {
        showCustomAlert('خطأ', 'تعذر الحفظ: ' + err.message, false);
    }
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

    // 1. نرسم الفلاتر المخصصة لهذا القسم أولاً
    renderCategorySpecificAdminFields();

    // 2. نقوم بوضع علامة (صح) على الخصائص التي اختارها المدير مسبقاً
    if (p.attributes) {
        const dynamicCheckboxes = document.querySelectorAll('.dynamic-attr-cb');
        dynamicCheckboxes.forEach(cb => {
            const attrName = cb.getAttribute('data-attr-name');
            if (p.attributes[attrName] && p.attributes[attrName].includes(cb.value)) {
                cb.checked = true;
            }
        });
    }

    document.getElementById('prod-desc').value = p.desc || '';
    const imgs = p.images || [];
    document.getElementById('prod-img-main').value = imgs[0] || '';
    document.getElementById('prod-img-2').value = imgs[1] || '';
    document.getElementById('prod-img-3').value = imgs[2] || '';

    document.getElementById('product-form-title').innerText = 'تعديل المنتج: ' + p.name;
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('product-edit-form').offsetTop - 100, behavior: 'smooth' });
}

export function resetProductForm() {
    document.getElementById('product-edit-form').reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    renderCategorySpecificAdminFields();
}

export function deleteProduct(id) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج؟')) {
        window.db.collection("products").doc(id).delete().then(() => showCustomAlert('تم الحذف', 'تم الحذف بنجاح.', true));
    }
}

export function toggleProductStock(id, currentStatus) {
    const newStatus = !currentStatus;
    window.db.collection("products").doc(id).update({ inStock: newStatus })
        .catch(err => showCustomAlert('خطأ', 'لم يتم تحديث المخزون: ' + err.message, false));
}

// =====================================
// إدارة الأقسام والماركات (محدثة برمجياً)
// =====================================
export function renderAdminCategoriesList() {
    const container = document.getElementById('admin-categories-list');
    if (!container) return;
    
    if (!state.categories || state.categories.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 col-span-full">لا توجد فئات مضافة.</p>';
        return;
    }

    // 🚀 السحر: عند الضغط على القسم، يتم استدعاء دالة selectCategoryForFilter
    container.innerHTML = state.categories.map(c => `
        <div onclick="selectCategoryForFilter('${c.name}')" class="bg-gray-50 p-4 rounded-xl border flex flex-col items-center gap-2 text-xs text-center shadow-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-lg transition transform hover:-translate-y-1">
            <img src="${c.image}" class="w-12 h-12 rounded-full object-cover border border-[#D4AF37]">
            <span class="font-bold text-gray-900">${c.name}</span>
            <button onclick="event.stopPropagation(); deleteCategory('${c.id}')" class="text-red-600 bg-red-100 px-4 py-1.5 rounded-lg w-full font-bold mt-2 hover:bg-red-200">حذف الفئة</button>
        </div>
    `).join('');
}

export function handleSaveCategory(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('cat-name-input').value.trim();
    const image = document.getElementById('cat-img-input').value.trim();
    if (!name || !image) return;

    window.db.collection("categories").add({ name, image, createdAt: new Date() }).then((docRef) => {
        state.categories.push({ id: docRef.id, name, image });
        renderAdminCategoriesList();
        populateAdminDropdowns();
        document.getElementById('cat-name-input').value = '';
        document.getElementById('cat-img-input').value = '';
        showCustomAlert('تم الحفظ', 'تمت إضافة الفئة الجديدة بنجاح!', true);
    });
}

export function deleteCategory(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفئة نهائياً؟')) {
        window.db.collection("categories").doc(id).delete().then(() => {
            state.categories = state.categories.filter(c => c.id !== id);
            renderAdminCategoriesList();
            populateAdminDropdowns();
        });
    }
}

export function handleSaveBrand(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('brand-name-input');
    if (!input || !input.value.trim()) return;
    const brandName = input.value.trim();

    if (!state.brands.includes(brandName)) {
        state.brands.push(brandName);
        renderAdminBrandsList();
        populateAdminDropdowns();
    }
    window.db.collection("settings").doc("main").set({ brands: state.brands }, { merge: true }).then(() => {
        input.value = '';
    });
}

export function renderAdminBrandsList() {
    const container = document.getElementById('admin-brands-list');
    if (!container) return;
    if (!state.brands || state.brands.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 col-span-full">لا توجد ماركات مضافة.</p>';
        return;
    }
    container.innerHTML = state.brands.map((b, idx) => {
        const brandName = typeof b === 'object' ? b.name : b;
        return `
        <div class="bg-gray-50 p-3 rounded-xl border flex justify-between items-center text-xs">
            <span class="font-bold">${brandName}</span>
            <button onclick="deleteBrand(${idx})" class="text-red-600 bg-red-100 px-3 py-1 rounded-lg font-bold">حذف</button>
        </div>
    `}).join('');
}

export function deleteBrand(idx) {
    if (confirm('هل أنت متأكد من حذف هذه الماركة؟')) {
        const newBrands = state.brands.filter((_, i) => i !== idx);
        state.brands = newBrands;
        renderAdminBrandsList();
        populateAdminDropdowns();
        window.db.collection("settings").doc("main").update({ brands: newBrands });
    }
}

// =====================================
// دوال متفرقة (التوصيل، الصور، الطلبيات)
// =====================================
export function handleImageUploadWrapper(event, target) { handleImageUpload(event, target); }

export function handleSaveWilaya(e) {
    if (e) e.preventDefault();
    const code = document.getElementById('wilaya-code').value.trim();
    const name = document.getElementById('wilaya-name').value.trim();
    const officeCost = parseFloat(document.getElementById('wilaya-office-cost').value) || 0;
    const homeCost = parseFloat(document.getElementById('wilaya-home-cost').value) || 0;
    if (!code || !name) return;
    window.db.collection("wilayas").doc(code).set({ code, name, officeCost, homeCost }).then(() => {
        resetWilayaForm();
        showCustomAlert('تم الحفظ 🎉', 'تم حفظ التسعير بنجاح!', true);
    });
}

export function resetWilayaForm() {
    document.getElementById('wilaya-edit-form').reset();
    document.getElementById('editing-wilaya-id').value = '';
    if (document.getElementById('wilaya-home-cost')) document.getElementById('wilaya-home-cost').value = '';
    document.getElementById('cancel-wilaya-edit-btn').classList.add('hidden');
}

export function editWilaya(code) {
    const w = state.WILAYAS.find(wil => wil.code === code);
    if (!w) return;
    document.getElementById('editing-wilaya-id').value = w.code;
    document.getElementById('wilaya-code').value = w.code;
    document.getElementById('wilaya-name').value = w.name;
    document.getElementById('wilaya-office-cost').value = w.officeCost || 0;
    if (document.getElementById('wilaya-home-cost')) document.getElementById('wilaya-home-cost').value = w.homeCost || 0;
    document.getElementById('cancel-wilaya-edit-btn').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('wilaya-edit-form').offsetTop - 100, behavior: 'smooth' });
}

export function deleteWilaya(docIdOrCode) {
    if (confirm('هل أنت تأكد من الحذف؟')) {
        window.db.collection("wilayas").doc(docIdOrCode).delete().then(() => showCustomAlert('تم الحذف', 'تم حذف الولاية بنجاح.', true));
    }
}

export function renderAdminWilayasList() {
    const container = document.getElementById('admin-wilayas-list');
    if (!container) return;
    if (!state.WILAYAS || state.WILAYAS.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 py-4 text-center">لا توجد ولايات مسجلة.</p>';
        return;
    }
    container.innerHTML = state.WILAYAS.map(w => {
        const docKey = w.id || w.code;
        return `
            <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-sm my-2">
                <div>
                    <div class="flex items-center gap-3">
                        <span class="bg-[#B8860B] text-white font-bold px-2.5 py-1 rounded-lg text-[10px]">${w.code}</span>
                        <h4 class="font-bold text-sm text-gray-900">${w.name}</h4>
                    </div>
                    <div class="flex gap-4 mt-2 text-gray-700">
                        <span>📦 توصيل المكتب: <strong class="text-[#B8860B]">${w.officeCost || 0} دج</strong></span>
                        <span>🏡 توصيل للمنزل: <strong class="text-emerald-600">${w.homeCost || 0} دج</strong></span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="editWilaya('${w.code}')" class="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer">تعديل</button>
                    <button type="button" onclick="deleteWilaya('${docKey}')" class="bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl cursor-pointer">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

export function saveShippingApiSettings() {
    const key = document.getElementById('shipping-api-key').value.trim();
    const token = document.getElementById('shipping-api-token').value.trim();
    window.db.collection("settings").doc("main").set({ shippingApiKey: key, shippingApiToken: token }, { merge: true }).then(() => {
        showCustomAlert('تم تفعيل الربط', 'تم حفظ بيانات الـ API!', true);
    });
}

// استبدل الدالة القديمة بهذه
export function renderAdminDashboard() {
    const confirmedOrders = state.orders.filter(o => o.status === 'مكتملاً' || o.status === 'مؤكد' || !o.status);
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedCount = state.orders.filter(o => o.status === 'مكتملاً').length;
    const successRate = state.orders.length ? Math.round((completedCount / state.orders.length) * 100) : 0;

    if (document.getElementById('stat-total-sales')) document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    if (document.getElementById('stat-orders-count')) document.getElementById('stat-orders-count').innerText = state.orders.length;
    if (document.getElementById('stat-avg-order')) document.getElementById('stat-avg-order').innerText = confirmedOrders.length ? Math.round(totalSales / confirmedOrders.length).toLocaleString() + ' دج' : '0 دج';
    if (document.getElementById('stat-success-rate')) document.getElementById('stat-success-rate').innerText = successRate + '%';

    const filterVal = document.getElementById('order-status-filter') ? document.getElementById('order-status-filter').value : 'الجميع';
    const searchVal = document.getElementById('order-search-input') ? document.getElementById('order-search-input').value.trim().toLowerCase() : '';

    let displayedOrders = state.orders;
    if (filterVal && filterVal !== 'الجميع') displayedOrders = displayedOrders.filter(o => (o.status || 'جديد') === filterVal);
    if (searchVal) {
        displayedOrders = displayedOrders.filter(o => 
            (o.customer && o.customer.toLowerCase().includes(searchVal)) ||
            (o.phone && o.phone.includes(searchVal)) ||
            (o.id && o.id.toLowerCase().includes(searchVal))
        );
    }

    // إخفاء زر الحذف الجماعي وإزالة التحديد عند تحديث الجدول
    const selectAllCb = document.getElementById('select-all-orders');
    if(selectAllCb) selectAllCb.checked = false;
    if(typeof checkBulkDeleteStatus === 'function') checkBulkDeleteStatus();

    const ordersTbody = document.getElementById('admin-orders-log');
    if (ordersTbody) {
        if (displayedOrders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-gray-400 font-bold"><i class="fa-solid fa-folder-open text-2xl mb-2 block"></i>لا توجد طلبيات تطابق بحثك حالياً</td></tr>';
        } else {
            ordersTbody.innerHTML = displayedOrders.map(o => {
                const status = o.status || 'جديد';
                let statusBadgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                if (status === 'مؤكد') statusBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                if (status === 'قيد الشحن') statusBadgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                if (status === 'مكتملاً') statusBadgeClass = 'bg-green-100 text-green-800 border-green-200';
                if (status === 'ملغى') statusBadgeClass = 'bg-red-100 text-red-800 border-red-200';
                
                let cleanPhone = (o.phone || '').replace(/\s+/g, '');
                if (cleanPhone.startsWith('0')) cleanPhone = '213' + cleanPhone.substring(1);
                const waMsg = encodeURIComponent(`مرحباً ${o.customer}، نتوجه إليك من متجر ${state.storeSettings.name} لتأكيد طلبكم.`);

                let dateStr = 'غير معروف';
                if (o.createdAt) {
                    const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                    dateStr = d.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' }) + ' - ' + d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
                }
                const shortId = o.id ? o.id.substring(0, 6).toUpperCase() : '000000';

                return `
                    <tr class="border-b hover:bg-gray-50 transition">
                        <td class="p-4 text-center">
                            <input type="checkbox" value="${o.id}" class="order-cb accent-red-600 w-4 h-4 cursor-pointer" onchange="checkBulkDeleteStatus()">
                        </td>
                        <td class="p-4">
                            <div class="font-black text-xs text-[#B8860B] mb-1 tracking-wider">#${shortId}</div>
                            <div class="text-[10px] text-gray-500 font-bold flex items-center gap-1"><i class="fa-regular fa-clock"></i> ${dateStr}</div>
                        </td>
                        <td class="p-4">
                            <div class="font-bold text-gray-900">${o.customer}</div>
                            <div class="text-xs text-gray-500 font-mono mt-1">${o.phone}</div>
                        </td>
                        <td class="p-4">
                            <div class="font-bold text-xs text-gray-800">${o.wilaya || 'غير محدد'}</div>
                            <div class="text-[11px] text-gray-500 mt-1">${o.commune || ''}</div>
                        </td>
                        <td class="p-4">
                            <div class="font-bold text-xs text-gray-900 leading-relaxed max-w-[200px]">${o.product}</div>
                            <div class="font-black text-xs text-[#B8860B] mt-1">${o.total ? o.total.toLocaleString() : 0} دج</div>
                        </td>
                        <td class="p-4 text-center">
                            <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs font-bold p-2 rounded-lg border outline-none cursor-pointer ${statusBadgeClass} shadow-sm w-28 text-center appearance-none">
                                <option value="جديد" ${status === 'جديد' ? 'selected' : ''}>🟡 جديد</option>
                                <option value="مؤكد" ${status === 'مؤكد' ? 'selected' : ''}>🔵 مؤكد</option>
                                <option value="قيد الشحن" ${status === 'قيد الشحن' ? 'selected' : ''}>🟣 قيد الشحن</option>
                                <option value="مكتملاً" ${status === 'مكتملاً' ? 'selected' : ''}>🟢 تم التسليم</option>
                                <option value="ملغى" ${status === 'ملغى' ? 'selected' : ''}>🔴 ملغى</option>
                            </select>
                        </td>
                        <td class="p-4 flex items-center justify-center gap-2">
                            <a href="tel:${o.phone}" title="اتصال هاتفي" class="bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold p-2.5 rounded-xl hover:bg-blue-100 hover:scale-105 transition"><i class="fa-solid fa-phone"></i></a>
                            <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" title="مراسلة واتساب" class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold p-2.5 rounded-xl hover:bg-emerald-100 hover:scale-105 transition"><i class="fa-brands fa-whatsapp text-sm"></i></a>
                            <button onclick="promptDeleteOrder('${o.id}')" title="حذف الطلب" class="bg-red-50 text-red-500 border border-red-200 text-xs font-bold p-2.5 rounded-xl hover:bg-red-100 hover:scale-105 transition"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
    if (typeof renderAdminProductsTable === 'function') renderAdminProductsTable();
}

// ==========================================
// دوال الحذف الجماعي الجديدة (ضعها هنا)
// ==========================================
export function toggleAllOrders(source) {
    const checkboxes = document.querySelectorAll('.order-cb');
    checkboxes.forEach(cb => cb.checked = source.checked);
    checkBulkDeleteStatus();
}

export function checkBulkDeleteStatus() {
    const checkedBoxes = document.querySelectorAll('.order-cb:checked');
    const bulkBtn = document.getElementById('bulk-delete-btn');
    const bulkCount = document.getElementById('bulk-delete-count');
    
    if (bulkBtn && bulkCount) {
        if (checkedBoxes.length > 0) {
            bulkBtn.classList.remove('hidden');
            bulkCount.innerText = checkedBoxes.length;
        } else {
            bulkBtn.classList.add('hidden');
        }
    }
}

export function deleteSelectedOrders() {
    const checkedBoxes = document.querySelectorAll('.order-cb:checked');
    if (checkedBoxes.length === 0) return;
    
    if (confirm(`تحذير ⚠️: هل أنت متأكد من رغبتك في حذف ${checkedBoxes.length} طلبية نهائياً؟ (لا يمكن التراجع عن هذا الإجراء)`)) {
        const batch = window.db.batch();
        checkedBoxes.forEach(cb => {
            const orderRef = window.db.collection('orders').doc(cb.value);
            batch.delete(orderRef);
        });
        
        batch.commit().then(() => {
            showCustomAlert('تم الحذف', `تم حذف ${checkedBoxes.length} طلبية بنجاح.`, true);
            checkBulkDeleteStatus(); // إخفاء الزر بعد الحذف
        }).catch(err => {
            showCustomAlert('خطأ', 'حدث خطأ أثناء الحذف الجماعي: ' + err.message, false);
        });
    }
}

export function renderAdminProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;
    if (!state.products || state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد منتجات مسجلة بعد</td></tr>';
        return;
    }
    tbody.innerHTML = state.products.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'https://via.placeholder.com/100');
        const isStock = p.inStock !== false;
        return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="p-3"><img src="${img}" class="w-12 h-12 object-contain rounded-lg border bg-black" loading="lazy"></td>
                <td class="p-3 font-bold text-xs">${p.name}</td>
                <td class="p-3 text-xs">${p.category || 'عام'}</td>
                <td class="p-3 text-[11px] text-gray-600 max-w-xs leading-relaxed">${p.brand || '-'}</td>
                <td class="p-3 font-black text-xs text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
                <td class="p-3 text-xs">
                    <button type="button" onclick="toggleProductStock('${p.id}', ${isStock})" class="px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all duration-300 w-24 text-center cursor-pointer ${isStock ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}">
                        ${isStock ? 'متوفر 🟢' : 'نفد 🔴'}
                    </button>
                </td>
                <td class="p-3 flex items-center gap-2">
                    <button type="button" onclick="editProduct('${p.id}')" class="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-lg">تعديل</button>
                    <button type="button" onclick="deleteProduct('${p.id}')" class="bg-red-100 text-red-600 font-bold text-xs px-2.5 py-1 rounded-lg">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

export function renderBannerTextsList() {
    const container = document.getElementById('banner-texts-list');
    if (!container) return;
    if (!state.bannerMessages || state.bannerMessages.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 py-2">لا توجد جمل مضافة.</p>';
        return;
    }
    container.innerHTML = state.bannerMessages.map((msg, idx) => `
        <div class="flex items-center justify-between bg-gray-100 p-3 rounded-xl border text-xs my-1.5">
            <span class="font-bold text-gray-800">${msg}</span>
            <button type="button" onclick="removeBannerText(${idx})" class="text-red-500 font-bold px-3 py-1 bg-red-50 rounded-lg border">حذف</button>
        </div>
    `).join('');
}

export function addBannerText() {
    const input = document.getElementById('new-banner-text');
    if (!input || !input.value.trim()) return;
    window.db.collection("settings").doc("main").update({ bannerMessages: window.firebase.firestore.FieldValue.arrayUnion(input.value.trim()) }).then(() => {
        input.value = ''; showCustomAlert('تم', 'تمت الإضافة بنجاح!', true);
    });
}

export function removeBannerText(index) {
    const targetText = state.bannerMessages[index];
    if (!targetText) return;
    window.db.collection("settings").doc("main").update({ bannerMessages: window.firebase.firestore.FieldValue.arrayRemove(targetText) }).then(() => {
        showCustomAlert('تم', 'تم الحذف بنجاح.', true);
    });
}

export function promptDeleteOrder(id) {
    pendingDeleteOrderId = id;
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

export function closeCustomConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    pendingDeleteOrderId = null;
}

export function confirmDeleteOrder() {
    if (pendingDeleteOrderId) {
        window.db.collection("orders").doc(pendingDeleteOrderId).delete().then(() => {
            closeCustomConfirm(); showCustomAlert('تم', 'تم حذف الطلبية بنجاح.', true);
        });
    }
}

export function updateOrderStatus(id, newStatus) { window.db.collection("orders").doc(id).update({ status: newStatus }); }

export function handleSaveSettings(e) {
    if (e) e.preventDefault();
    const settings = {
        name: document.getElementById('set-store-name').value,
        slogan: document.getElementById('set-store-slogan').value,
        logoUrl: document.getElementById('set-logo-url').value,
        msgSuccess: document.getElementById('set-msg-success').value,
        msgWarning: document.getElementById('set-msg-warning').value
    };
    window.db.collection("settings").doc("main").set(settings, { merge: true }).then(() => { showCustomAlert('تم', 'تم حفظ الإعدادات!', true); });
}

export function handleSaveHeroSlide(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('hero-title-input').value.trim();
    const desc = document.getElementById('hero-desc-input').value.trim();
    const image = document.getElementById('hero-img-input').value.trim();
    if (!title || !desc || !image) return;
    window.db.collection("heroSlides").add({ title, desc, image, createdAt: new Date() }).then(() => {
        document.getElementById('hero-title-input').value = '';
        document.getElementById('hero-desc-input').value = '';
        document.getElementById('hero-img-input').value = '';
        showCustomAlert('تم', 'تمت إضافة البانر!', true);
    });
}

export function exportOrdersToExcel() {
    const filterVal = document.getElementById('order-status-filter') ? document.getElementById('order-status-filter').value : 'الجميع';
    let targetOrders = state.orders;
    if (filterVal && filterVal !== 'الجميع') targetOrders = state.orders.filter(o => (o.status || 'جديد') === filterVal);
    if (!targetOrders || targetOrders.length === 0) { showCustomAlert('تنبيه', 'لا توجد طلبيات مطابقة!', false); return; }

    let csvContent = "\uFEFFsep=;\r\nاسم الزبون;رقم الهاتف;الولاية;البلدية;المبلغ الإجمالي (دج);حالة الطلب;المنتج\r\n";
    targetOrders.forEach(o => {
        csvContent += `"${(o.customer || '')}";"=""${(o.phone || '')}""";"${(o.wilaya || '')}";"${(o.commune || '')}";${o.total || 0};"${(o.status || 'جديد')}";"${(o.product || '')}"\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

export function updateAdminPasswordSecure() {
    const passwordInput = document.getElementById('new-admin-password');
    if (!passwordInput) return;
    const newPassword = passwordInput.value.trim();
    if (!newPassword || newPassword.length < 6) return showCustomAlert('تنبيه', 'كلمة المرور قصيرة جداً.', false);
    const user = window.firebase.auth().currentUser;
    if (!user) return showCustomAlert('غير مسجل', 'يجب تسجيل الدخول كمسؤول.', false);
    user.updatePassword(newPassword).then(() => {
        passwordInput.value = ''; showCustomAlert('تم التحديث', 'تم تغيير كلمة المرور بأمان.', true);
    }).catch((error) => showCustomAlert('خطأ', 'فشل التحديث: ' + error.message, false));
}

// =====================================
// التصدير للـ Window
// =====================================
window.handleImageUpload = handleImageUploadWrapper;
window.checkAdminPassword = checkAdminPassword;
window.adminSignOut = adminSignOut;
window.switchAdminTab = switchAdminTab;
window.populateAdminDropdowns = populateAdminDropdowns;
window.renderCategorySpecificAdminFields = renderCategorySpecificAdminFields;
window.handleSaveProduct = handleSaveProduct;
window.resetProductForm = resetProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminProductsTable = renderAdminProductsTable;
window.handleSaveWilaya = handleSaveWilaya;
window.resetWilayaForm = resetWilayaForm;
window.editWilaya = editWilaya;
window.deleteWilaya = deleteWilaya;
window.renderAdminWilayasList = renderAdminWilayasList;
window.saveShippingApiSettings = saveShippingApiSettings;
window.handleSaveBrand = handleSaveBrand;
window.renderAdminBrandsList = renderAdminBrandsList;
window.deleteBrand = deleteBrand;
window.handleSaveCategory = handleSaveCategory;
window.renderAdminCategoriesList = renderAdminCategoriesList;
window.deleteCategory = deleteCategory;
window.renderBannerTextsList = renderBannerTextsList;
window.addBannerText = addBannerText;
window.removeBannerText = removeBannerText;
window.promptDeleteOrder = promptDeleteOrder;
window.closeCustomConfirm = closeCustomConfirm;
window.confirmDeleteOrder = confirmDeleteOrder;
window.updateOrderStatus = updateOrderStatus;
window.handleSaveSettings = handleSaveSettings;
window.handleSaveHeroSlide = handleSaveHeroSlide;
window.exportOrdersToExcel = exportOrdersToExcel;
window.updateAdminPasswordSecure = updateAdminPasswordSecure;
window.toggleProductStock = toggleProductStock;
window.toggleAllOrders = toggleAllOrders;
window.checkBulkDeleteStatus = checkBulkDeleteStatus;
window.deleteSelectedOrders = deleteSelectedOrders;
// الدوال الجديدة الخاصة بصانع الفلاتر الشامل
window.selectCategoryForFilter = selectCategoryForFilter;
window.populateFilterCategories = populateFilterCategories;
window.handleSaveDynamicAttribute = handleSaveDynamicAttribute;
window.renderDynamicAttributesList = renderDynamicAttributesList;
window.deleteDynamicAttribute = deleteDynamicAttribute;
