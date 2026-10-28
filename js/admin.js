// --- ملف js/admin.js (عقل المنصة والمحرك الديناميكي الشامل) ---

import { state } from './store/state.js';
import { showCustomAlert, safeCall } from './utils/helpers.js';

let pendingDeleteOrderId = null;

// =====================================
// 1. دوال النظام والمصادقة
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
                emailInput.value = ''; 
                passInput.value = '';
                
                // 🌟 تشغيل مزامنة الطلبيات فور تسجيل دخول المدير
                safeCall('initAdminOrdersSync');
                safeCall('initAdminAnalyticsSync');
                safeCall('loadAllProductsForAdmin');
                safeCall('showPage', 'admin');
                showCustomAlert('أهلاً بك', 'تم تسجيل الدخول للوحة التحكم بنجاح 🟢', true);
            })
            .catch(() => showCustomAlert('خطأ في الدخول', 'فشل المصادقة: تأكد من صحة البريد الإلكتروني وكلمة المرور.', false));
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
    // 🌟 تصحيح: إزالة active وإضافة hidden لإخفاء التبويبات غير النشطة، وعكس ذلك للتبويب النشط
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
        t.classList.add('hidden');
    });
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-white', 'border-[#D4AF37]/30');
        b.classList.add('bg-gray-800', 'text-gray-300');
    });

    const activeTab = document.getElementById('admin-tab-' + tabName);
    if (activeTab) {
        activeTab.classList.remove('hidden');
        activeTab.classList.add('active');
    }

    const btn = document.getElementById('tab-btn-' + tabName);
    if (btn) {
        btn.classList.remove('bg-gray-800', 'text-gray-300');
        btn.classList.add('bg-black', 'text-white', 'border-[#D4AF37]/30');
    }

    const s = state.storeSettings || {};

    if (tabName === 'shipping_settings') {
        renderAdminWilayasList();
        
        // تعبئة إعدادات الحد الأدنى للطلب والرسائل و API التوصيل
        const localWilayaSelect = document.getElementById('set-local-wilaya');
        if (localWilayaSelect && state.WILAYAS) {
            localWilayaSelect.innerHTML = '<option value="">-- اختر ولايتك المحلية --</option>' + 
                state.WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
            localWilayaSelect.value = s.localWilaya || '';
        }
        if (document.getElementById('set-min-order-local')) document.getElementById('set-min-order-local').value = s.minOrderLocal ?? '';
        if (document.getElementById('set-min-order-national')) document.getElementById('set-min-order-national').value = s.minOrderNational ?? '';
        if (document.getElementById('set-msg-success')) document.getElementById('set-msg-success').value = s.msgSuccess || '';
        if (document.getElementById('set-msg-warning')) document.getElementById('set-msg-warning').value = s.msgWarning || '';
        if (document.getElementById('shipping-api-key')) document.getElementById('shipping-api-key').value = s.shippingApiKey || '';
        if (document.getElementById('shipping-api-token')) document.getElementById('shipping-api-token').value = s.shippingApiToken || '';
    }

    if (tabName === 'categories_attributes') {
        renderAdminBrandsList();
        renderAdminCategoriesList();
        populateFilterCategories();
        renderDynamicAttributesList();
    }

    if (tabName === 'marketing_ui') {
        renderBannerTextsList();
        renderAdminHeroSlidesList();
        renderAdminCouponsList();
        
        // 🌟 تعبئة كافة خانات الهوية البصرية والتواصل الاجتماعي بالبيانات المحفوظة
        if (document.getElementById('set-store-name')) document.getElementById('set-store-name').value = s.name || '';
        if (document.getElementById('set-store-slogan')) document.getElementById('set-store-slogan').value = s.slogan || '';
        if (document.getElementById('set-logo-url')) document.getElementById('set-logo-url').value = s.logoUrl || '';
        if (document.getElementById('set-phone')) document.getElementById('set-phone').value = s.phone || '';
        if (document.getElementById('set-email')) document.getElementById('set-email').value = s.email || '';
        if (document.getElementById('set-facebook')) document.getElementById('set-facebook').value = s.facebook || '';
        if (document.getElementById('set-instagram')) document.getElementById('set-instagram').value = s.instagram || '';
        if (document.getElementById('set-whatsapp-num')) document.getElementById('set-whatsapp-num').value = s.whatsappNum || '';
        if (document.getElementById('set-telegram')) document.getElementById('set-telegram').value = s.telegram || '';
        if (document.getElementById('set-gps-link')) document.getElementById('set-gps-link').value = s.gpsLink || '';
    }

    if (tabName === 'gift') {
        loadGiftAdminData();
    }

    if (tabName === 'custom_services') {
        safeCall('loadCustomAdminData');
    }
}

export function populateAdminDropdowns() {
    // 🌟 تعبئة قائمة المنتجات في صانع الكوبونات
    const couponTargetSelect = document.getElementById('coupon-target-product');
    if (couponTargetSelect) {
        const currentTarget = couponTargetSelect.value;
        couponTargetSelect.innerHTML = '<option value="all">🌐 شامل لجميع المنتجات</option>' + 
            state.products.map(p => `<option value="${p.id}">🎯 مخصص لـ: ${p.name}</option>`).join('');
        if (currentTarget) couponTargetSelect.value = currentTarget;
    }
    const catSelect = document.getElementById('prod-category-select');
    if (catSelect) {
        const currentCat = catSelect.value;
        catSelect.innerHTML = '<option value="">-- اختر الفئة / القسم * --</option>' + 
            state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        if (currentCat) catSelect.value = currentCat;
    }

    const brandSelect = document.getElementById('prod-brand-select');
    if (brandSelect) {
        const currentBrand = brandSelect.value;
        const brandList = state.brands.length > 0 ? state.brands : ["عام"];
        brandSelect.innerHTML = '<option value="">-- اختر العلامة التجارية (الماركة) --</option>' + 
            brandList.map(b => `<option value="${typeof b === 'object' ? b.name : b}">${typeof b === 'object' ? b.name : b}</option>`).join('');
        if (currentBrand) brandSelect.value = currentBrand;
    }

    populateFilterCategories();
    renderCategorySpecificAdminFields();
}

// =====================================
// 2. المحرك الذكي: ربط الأقسام بصانع الفلاتر
// =====================================
export function selectCategoryForFilter(catName) {
    const select = document.getElementById('new-attr-category');
    if (select) {
        select.value = catName;
        renderDynamicAttributesList();
        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showCustomAlert('تم التحديد', `تم تحديد قسم (${catName}) بنجاح، يمكنك إضافة فلاتر له الآن أسفله.`, true);
    }
}

export function populateFilterCategories() {
    const select = document.getElementById('new-attr-category');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- اختر القسم المستهدف --</option>' + 
            state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        if (currentValue) select.value = currentValue;
        // 🌟 تصحيح: استخدام onchange بدلاً من addEventListener لمنع تراكم المستمعات
        select.onchange = renderDynamicAttributesList;
    }
}

export function handleSaveDynamicAttribute(e) {
    if (e) e.preventDefault();
    const catName = document.getElementById('new-attr-category')?.value;
    const attrName = document.getElementById('new-attr-name')?.value.trim();
    const attrOptionsStr = document.getElementById('new-attr-options')?.value.trim();

    if (!catName || !attrName || !attrOptionsStr) return;

    const newOptions = attrOptionsStr.split(/[,،]/).map(o => o.trim()).filter(Boolean);
    
    if (!state.categoryFilters) state.categoryFilters = {};
    if (!state.categoryFilters[catName]) state.categoryFilters[catName] = [];

    // 🌟 ميزة الدمج: البحث عما إذا كان الفلتر موجوداً مسبقاً
    const existingAttrIndex = state.categoryFilters[catName].findIndex(a => a.name === attrName);

    if (existingAttrIndex !== -1) {
        // دمج الخيارات الجديدة مع القديمة وإزالة التكرار
        const combined = [...state.categoryFilters[catName][existingAttrIndex].options, ...newOptions];
        state.categoryFilters[catName][existingAttrIndex].options = [...new Set(combined)];
    } else {
        // إضافة فلتر جديد
        state.categoryFilters[catName].push({ name: attrName, options: newOptions });
    }

    window.db.collection("settings").doc("main").set({ categoryFilters: state.categoryFilters }, { merge: true }).then(() => {
        document.getElementById('new-attr-name').value = '';
        document.getElementById('new-attr-options').value = '';
        renderDynamicAttributesList();
        showCustomAlert('تم الحفظ 🛠️', `تم تحديث خيارات (${attrName}) بنجاح!`, true);
    });
}

export function renderDynamicAttributesList() {
    const catName = document.getElementById('new-attr-category')?.value;
    const listContainer = document.getElementById('admin-dynamic-attributes-list');
    if (!listContainer) return;

    if (!catName || !state.categoryFilters || !state.categoryFilters[catName] || state.categoryFilters[catName].length === 0) {
        listContainer.innerHTML = '<p class="text-xs text-gray-400 col-span-full">لا توجد فلاتر مخصصة لهذا القسم بعد. اختر قسماً وصمم أول فلتر من الأعلى!</p>';
        return;
    }

    const safeCat = catName.replace(/'/g, "\\'");
    listContainer.innerHTML = state.categoryFilters[catName].map((attr, idx) => `
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-xs space-y-3">
            <div class="flex justify-between items-center border-b pb-2">
                <span class="font-black text-[#B8860B]"><i class="fa-solid fa-filter"></i> ${attr.name}</span>
                <button type="button" onclick="deleteDynamicAttribute('${safeCat}', ${idx})" class="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg font-bold transition">حذف الفلتر بالكامل</button>
            </div>
            <div class="flex flex-wrap gap-1.5">
                ${attr.options.map((opt, optIdx) => `
                    <span class="bg-gray-100 text-gray-700 pl-1 pr-2.5 py-1 rounded-lg border border-gray-200 font-bold flex items-center gap-1.5">
                        ${opt}
                        <button type="button" onclick="deleteDynamicAttributeOption('${safeCat}', ${idx}, ${optIdx})" class="text-red-400 hover:text-white hover:bg-red-500 rounded-md w-5 h-5 flex items-center justify-center transition cursor-pointer" title="حذف هذا الخيار"><i class="fa-solid fa-xmark text-[10px]"></i></button>
                    </span>
                `).join('')}
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
export function deleteDynamicAttributeOption(catName, attrIdx, optIdx) {
    if (confirm('هل أنت متأكد من حذف هذا الخيار؟')) {
        // حذف الخيار المحدد
        state.categoryFilters[catName][attrIdx].options.splice(optIdx, 1);
        
        // إذا أصبح الفلتر فارغاً تماماً من الخيارات، نحذفه بالكامل
        if (state.categoryFilters[catName][attrIdx].options.length === 0) {
            state.categoryFilters[catName].splice(attrIdx, 1);
        }

        window.db.collection("settings").doc("main").set({ categoryFilters: state.categoryFilters }, { merge: true }).then(() => {
            renderDynamicAttributesList();
        });
    }
}
// =====================================
// 3. عرض الفلاتر الديناميكية وإدارة المنتجات
// =====================================
export function renderCategorySpecificAdminFields() {
    const catSelect = document.getElementById('prod-category-select');
    const container = document.getElementById('category-dynamic-fields-container');
    if (!catSelect || !container) return;

    const selectedCategory = (catSelect.value || '').trim();
    let html = '';

    if (state.categoryFilters && state.categoryFilters[selectedCategory] && state.categoryFilters[selectedCategory].length > 0) {
        html += `<div class="bg-gray-50 p-5 rounded-2xl border border-[#D4AF37]/40 space-y-5 mb-4 shadow-sm">
            <h4 class="font-black text-sm text-[#B8860B]"><i class="fa-solid fa-layer-group"></i> فلاتر قسم (${selectedCategory}) المخصصة:</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">`;
        
        state.categoryFilters[selectedCategory].forEach((attr) => {
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

export function handleSaveProduct(e) {
    if (e) e.preventDefault();
    try {
        const editId = document.getElementById('editing-product-id').value;
        
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
            attributes: customAttributes,
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
                // تحديث الذاكرة المحلية لتجنب إنعاش الصفحة
                const index = state.products.findIndex(p => p.id === editId);
                if (index !== -1) {
                    state.products[index] = { ...state.products[index], ...productData };
                }
                resetProductForm();
                renderAdminProductsTable(); // تحديث الجدول فوراً
                updateSearchIndex(); // 🌟 مكانها الصحيح بعد التعديل
                showCustomAlert('تم التحديث 🎉', 'تم تحديث بيانات المنتج بنجاح!', true);
            });
        } else {
            window.db.collection("products").add({ ...productData, createdAt: new Date() }).then((docRef) => {
                // دفع المنتج الجديد للذاكرة وتحديث الجدول
                state.products.unshift({ id: docRef.id, ...productData });
                resetProductForm();
                renderAdminProductsTable(); // تحديث الجدول فوراً
                updateSearchIndex(); // 🌟 مكانها الصحيح بعد الإضافة
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

    // 🌟 تصحيح: تعبئة حقول الألوان والأرقام عند التعديل
    if (document.getElementById('prod-colors')) document.getElementById('prod-colors').value = p.colors || '';
    if (document.getElementById('prod-numbers')) document.getElementById('prod-numbers').value = p.numbers || '';

    renderCategorySpecificAdminFields();

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
    const form = document.getElementById('product-edit-form');
    if (form) form.reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    ['prod-img-main', 'prod-img-2', 'prod-img-3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('border-green-500', 'bg-green-50');
    });
    renderCategorySpecificAdminFields();
}

export function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;

    window.db.collection("products").doc(productId).delete().then(() => {
        state.products = state.products.filter(p => p.id !== productId);
        renderAdminProductsTable(); 
        updateSearchIndex(); // 🌟 تحديث الفهرس فوراً بعد الحذف
        showCustomAlert('تم الحذف', 'تم حذف المنتج بنجاح.', true);
    }).catch(error => {
        console.error("Error removing product: ", error);
        showCustomAlert('خطأ', 'تعذر حذف المنتج.', false);
    });
}

export function toggleProductStock(productId, currentStockStatus) {
    const newStockStatus = !currentStockStatus; 
    
    window.db.collection("products").doc(productId).update({
        inStock: newStockStatus
    }).then(() => {
        const productIndex = state.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            state.products[productIndex].inStock = newStockStatus;
        }
        renderAdminProductsTable(); // التحديث الفوري
        showCustomAlert('تم التحديث 🎉', 'تم تغيير حالة توفر المنتج بنجاح.', true);
    }).catch(error => {
        console.error("Error updating status: ", error);
        showCustomAlert('خطأ', 'تعذر تحديث حالة المنتج.', false);
    });
}
/// 🌟 دالة إنشاء وتحديث فهرس البحث الموحد (متوافقة مع قواعد حماية Firebase)
export async function updateSearchIndex() {
    try {
        // التأكد من جلب كافة المنتجات قبل بناء الفهرس حتى لا يتم حفظ 30 منتجاً فقط
        const snapshot = await window.db.collection('products').get();
        const allProducts = [];
        snapshot.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
        state.products = allProducts;

        const lightweightIndex = allProducts.map(p => ({
            id: p.id,
            name: p.name || '',
            category: p.category || '',
            brand: p.brand || '',
            price: p.price || 0,
            oldPrice: p.oldPrice || null,
            inStock: p.inStock !== false,
            image: (p.images && p.images.length > 0) ? p.images[0] : (p.image || ''),
            images: (p.images && p.images.length > 0) ? [p.images[0]] : [],
            keywords: `${p.name || ''} ${p.desc || ''} ${p.category || ''} ${p.brand || ''}`.toLowerCase()
        }));

        // 🔒 الحفظ داخل settings/search_index المسموح به في قواعد الحماية
        await window.db.collection('settings').doc('search_index').set({
            items: lightweightIndex,
            lastUpdated: new Date()
        });
        
        window.totalStoreProductsCount = lightweightIndex.length;
        renderAdminProductsTable();
        console.log('✅ تم تحديث فهرس البحث الذكي بنجاح لكافة المنتجات:', lightweightIndex.length);
    } catch (error) {
        console.error('❌ خطأ في تحديث الفهرس:', error);
    }
}
// =====================================
// 4. إدارة الأقسام والماركات
// =====================================
export function renderAdminCategoriesList() {
    const container = document.getElementById('admin-categories-list');
    if (!container) return;
    
    if (!state.categories || state.categories.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 col-span-full">لا توجد فئات مضافة.</p>';
        return;
    }

    container.innerHTML = state.categories.map(c => {
        const safeName = (c.name || '').replace(/'/g, "\\'");
        return `
        <div onclick="selectCategoryForFilter('${safeName}')" class="bg-gray-50 p-4 rounded-xl border flex flex-col items-center gap-2 text-xs text-center shadow-sm cursor-pointer hover:border-[#D4AF37] hover:shadow-lg transition transform hover:-translate-y-1">
            <img src="${c.image}" class="w-12 h-12 rounded-full object-cover border border-[#D4AF37]" loading="lazy">
            <span class="font-bold text-gray-900">${c.name}</span>
            <button type="button" onclick="event.stopPropagation(); deleteCategory('${c.id}')" class="text-red-600 bg-red-100 px-4 py-1.5 rounded-lg w-full font-bold mt-2 hover:bg-red-200">حذف الفئة</button>
        </div>
        `;
    }).join('');
}

export function handleSaveCategory(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('cat-name-input');
    const imgInput = document.getElementById('cat-img-input');
    const name = nameInput.value.trim();
    const image = imgInput.value.trim();
    if (!name || !image) return;

    // 🌟 ميزة ذكية: إذا كان اسم القسم موجوداً مسبقاً، نقوم بتحديث صورته فقط دون تكراره!
    const existingCat = state.categories.find(c => c.name.trim() === name);

    if (existingCat) {
        window.db.collection("categories").doc(existingCat.id).update({ image, updatedAt: new Date() }).then(() => {
            nameInput.value = '';
            imgInput.value = '';
            imgInput.classList.remove('border-green-500', 'bg-green-50');
            showCustomAlert('تم التحديث 🖼️', `تم تغيير وتحديث صورة قسم (${name}) بنجاح!`, true);
        });
    } else {
        window.db.collection("categories").add({ name, image, createdAt: new Date() }).then(() => {
            nameInput.value = '';
            imgInput.value = '';
            imgInput.classList.remove('border-green-500', 'bg-green-50');
            showCustomAlert('تم الحفظ 🎉', 'تمت إضافة الفئة الجديدة بنجاح!', true);
        });
    }
}

export function deleteCategory(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفئة نهائياً؟')) {
        window.db.collection("categories").doc(id).delete();
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
            <button type="button" onclick="deleteBrand(${idx})" class="text-red-600 bg-red-100 px-3 py-1 rounded-lg font-bold">حذف</button>
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
// 5. التوصيل، الصور، والطلبيات
// =====================================
export async function handleImageUploadWrapper(event, targetId) {
    const file = event.target.files[0];
    if (!file) return;

    const targetInput = document.getElementById(targetId);
    if (targetInput) targetInput.placeholder = "جاري الرفع إلى الخادم... ⏳";

    try {
        // 👈 تم تغيير 600 إلى 900 للحفاظ على جودة التفاصيل
        const downloadURL = await window.compressAndUploadImage(file, 'products_images', 900);
        if (targetInput) {
            targetInput.value = downloadURL;
            targetInput.classList.add('border-green-500', 'bg-green-50');
            targetInput.placeholder = "أو رابط الصورة (URL) *";
        }
    } catch (error) {
        console.error("Upload error:", error);
        if (targetInput) targetInput.placeholder = "❌ فشل الرفع";
        showCustomAlert("خطأ", "فشل رفع الصورة، يرجى المحاولة مرة أخرى.", false);
    }
}

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
    const form = document.getElementById('wilaya-edit-form');
    if (form) form.reset();
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
    document.getElementById('wilaya-office-cost').value = w.officeCost ?? 0;
    if (document.getElementById('wilaya-home-cost')) document.getElementById('wilaya-home-cost').value = w.homeCost ?? 0;
    document.getElementById('cancel-wilaya-edit-btn').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('wilaya-edit-form').offsetTop - 100, behavior: 'smooth' });
}

export function deleteWilaya(docIdOrCode) {
    if (confirm('هل أنت متأكد من الحذف؟')) {
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
                        <span>📦 توصيل المكتب: <strong class="text-[#B8860B]">${w.officeCost ?? 0} دج</strong></span>
                        <span>🏡 توصيل للمنزل: <strong class="text-emerald-600">${w.homeCost ?? 0} دج</strong></span>
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
    const key = document.getElementById('shipping-api-key')?.value.trim() || '';
    const token = document.getElementById('shipping-api-token')?.value.trim() || '';
    window.db.collection("settings").doc("main").set({ shippingApiKey: key, shippingApiToken: token }, { merge: true }).then(() => {
        showCustomAlert('تم تفعيل الربط', 'تم حفظ بيانات الـ API!', true);
    });
}
let previousOrdersCount = -1;
let isFirstRealDataRender = true; // 🌟 إضافة متغير للتحكم في التحميل الأولي

function playNewOrderSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const playTone = (freq, start, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration);
        };
        // نغمة جرس مزدوجة فاخرة (Ding-Dong)
        playTone(587.33, 0, 0.25);   // D5
        playTone(880.00, 0.25, 0.5); // A5
    } catch (e) {
        console.warn("Audio alert blocked until user interacts with page.");
    }
}

export function renderAdminDashboard() {
    // 🌟 [تصحيح الإزعاج]: منع رنين الجرس عند تحديث الصفحة أو الدخول لأول مرة
    if (isFirstRealDataRender && state.orders.length > 0) {
        isFirstRealDataRender = false; // تسجيل أن الدفعة الأولى وصلت بصمت
    } else if (previousOrdersCount !== -1 && state.orders.length > previousOrdersCount && !isFirstRealDataRender) {
        playNewOrderSound();
        showCustomAlert('طلبية جديدة وصلت! 🔔', 'تم استلام طلب جديد للتو في سجل الطلبيات.', true);
    }
    
    previousOrdersCount = state.orders.length;
    const confirmedOrders = state.orders.filter(o => o.status === 'مكتملاً' || o.status === 'مؤكد' || !o.status);
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
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

    const selectAllCb = document.getElementById('select-all-orders');
    if (selectAllCb) selectAllCb.checked = false;
    checkBulkDeleteStatus();

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
                const waMsg = encodeURIComponent(`مرحباً ${o.customer}، نتوجه إليك من متجر ${state.storeSettings.name || 'كوسمتيك عبد الحق'} لتأكيد طلبكم.`);

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
                            <div class="font-bold text-[11px] text-gray-800 leading-relaxed max-w-[250px] bg-gray-50 p-3 rounded-xl border border-gray-200 whitespace-pre-line text-right" style="direction: rtl;">${o.product || 'لا توجد تفاصيل'}</div>
                            
                            ${(o.attachedImage1 || o.attachedImage2 || o.attachedImage3 || o.attachedImage) ? `
                            <div class="flex flex-wrap gap-2 mt-2 p-2 bg-yellow-50/50 rounded-xl border border-yellow-200/50 justify-start">
                                ${o.attachedImage ? `<img src="${o.attachedImage}" onclick="openImageModal(this.src)" class="w-14 h-14 object-cover rounded-lg border border-gray-300 cursor-zoom-in hover:opacity-80 transition shadow-sm" title="اضغط للتكبير">` : ''}
                                ${o.attachedImage1 ? `<img src="${o.attachedImage1}" onclick="openImageModal(this.src)" class="w-14 h-14 object-cover rounded-lg border border-gray-300 cursor-zoom-in hover:opacity-80 transition shadow-sm" title="اضغط للتكبير">` : ''}
                                ${o.attachedImage2 ? `<img src="${o.attachedImage2}" onclick="openImageModal(this.src)" class="w-14 h-14 object-cover rounded-lg border border-gray-300 cursor-zoom-in hover:opacity-80 transition shadow-sm" title="اضغط للتكبير">` : ''}
                                ${o.attachedImage3 ? `<img src="${o.attachedImage3}" onclick="openImageModal(this.src)" class="w-14 h-14 object-cover rounded-lg border border-gray-300 cursor-zoom-in hover:opacity-80 transition shadow-sm" title="اضغط للتكبير">` : ''}
                            </div>
                            ` : ''}
                            
                            <div class="font-black text-sm text-[#B8860B] mt-2 inline-block px-3 py-1 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10">${o.total ? o.total.toLocaleString() : 0} دج</div>
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
                            <button type="button" onclick="printOrder('${o.id}')" title="طباعة وصل التوصيل" class="bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold p-2.5 rounded-xl hover:bg-gray-200 hover:scale-105 transition"><i class="fa-solid fa-print"></i></button>
                            <a href="tel:${o.phone}" title="اتصال هاتفي" class="bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold p-2.5 rounded-xl hover:bg-blue-100 hover:scale-105 transition"><i class="fa-solid fa-phone"></i></a>
                            <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" title="مراسلة واتساب" class="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold p-2.5 rounded-xl hover:bg-emerald-100 hover:scale-105 transition"><i class="fa-brands fa-whatsapp text-sm"></i></a>
                            <button type="button" onclick="promptDeleteOrder('${o.id}')" title="حذف الطلب" class="bg-red-50 text-red-500 border border-red-200 text-xs font-bold p-2.5 rounded-xl hover:bg-red-100 hover:scale-105 transition"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
    renderAdminProductsTable();
}

export function openImageModal(imageSrc) {
    let modal = document.getElementById('admin-image-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-image-modal';
        modal.className = 'fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 cursor-zoom-out hidden';
        modal.onclick = function() {
            this.classList.add('hidden');
        };
        
        const img = document.createElement('img');
        img.id = 'admin-modal-img';
        img.className = 'max-h-[90vh] max-w-[90vw] object-contain rounded-xl border border-gray-700 shadow-2xl';
        
        modal.appendChild(img);
        document.body.appendChild(modal);
    }
    
    const modalImg = document.getElementById('admin-modal-img');
    if (modalImg) {
        modalImg.src = imageSrc;
        modal.classList.remove('hidden');
    }
}

export function toggleAllOrders(source) {
    const checkboxes = document.querySelectorAll('.order-cb');
    checkboxes.forEach(cb => cb.checked = source.checked);
    checkBulkDeleteStatus();
}

export function checkBulkDeleteStatus() {
    const checkedBoxes = document.querySelectorAll('.order-cb:checked');
    const bulkContainer = document.getElementById('bulk-actions-container');
    const bulkCount = document.getElementById('bulk-delete-count');
    
    if (bulkContainer && bulkCount) {
        if (checkedBoxes.length > 0) {
            bulkContainer.classList.remove('hidden');
            bulkContainer.classList.add('flex');
            bulkCount.innerText = checkedBoxes.length;
        } else {
            bulkContainer.classList.add('hidden');
            bulkContainer.classList.remove('flex');
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
            checkBulkDeleteStatus();
        }).catch(err => {
            showCustomAlert('خطأ', 'حدث خطأ أثناء الحذف الجماعي: ' + err.message, false);
        });
    }
}

export function renderAdminProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    const searchInput = document.getElementById('admin-prod-search');
    const counterElement = document.getElementById('admin-products-counter'); // العداد الجديد
    
    if (!tbody) return;

    // تحديث العداد
    if (counterElement && state.products) {
        counterElement.innerText = `إجمالي المنتجات: ${state.products.length}`;
    }

    // إضافة شريط التمرير للجدول
    const tableContainer = tbody.closest('table').parentElement;
    if (tableContainer) {
        tableContainer.classList.add('max-h-[600px]', 'overflow-y-auto', 'block', 'w-full');
    }

    let filteredProducts = state.products || [];
    if (searchInput && searchInput.value.trim() !== '') {
        const term = searchInput.value.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(term)) || 
            (p.category && p.category.toLowerCase().includes(term))
        );
    }

    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد منتجات مطابقة للبحث</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'https://via.placeholder.com/100');
        const isStock = p.inStock !== false;
        return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="p-3"><img src="${img}" class="w-12 h-12 object-contain rounded-lg border bg-black" loading="lazy"></td>
                <td class="p-3 font-bold text-xs">${p.name}</td>
                <td class="p-3 text-xs">${p.category || 'عام'}</td>
                <td class="p-3 text-[11px] text-gray-600 max-w-xs leading-relaxed">${p.brand || '-'}</td>
                <td class="p-3 font-black text-xs text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
                <td class="p-3 text-xs text-center">
                    <button type="button" onclick="toggleProductStock('${p.id}', ${isStock})" class="px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all duration-300 w-24 text-center cursor-pointer ${isStock ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}">
                        ${isStock ? 'متوفر 🟢' : 'نفد 🔴'}
                    </button>
                </td>
                <td class="p-3 flex items-center justify-center gap-2">
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

export function updateOrderStatus(id, newStatus) { 
    window.db.collection("orders").doc(id).update({ status: newStatus }); 
}

// 🌟 تصحيح حرج: الحفاظ على الإعدادات المحفوظة مسبقاً وعدم مسحها إذا كانت الحقول غير معروضة أو فارغة
export function handleSaveSettings(e) {
    if (e) e.preventDefault();
    const s = state.storeSettings || {};

    const getValOrKeep = (id, fallbackVal) => {
        const el = document.getElementById(id);
        if (!el) return fallbackVal || '';
        const val = el.value.trim();
        return val !== '' ? val : (fallbackVal || '');
    };

    const settings = {
        name: getValOrKeep('set-store-name', s.name),
        slogan: getValOrKeep('set-store-slogan', s.slogan),
        logoUrl: getValOrKeep('set-logo-url', s.logoUrl),
        msgSuccess: getValOrKeep('set-msg-success', s.msgSuccess),
        msgWarning: getValOrKeep('set-msg-warning', s.msgWarning),
        phone: getValOrKeep('set-phone', s.phone),
        email: getValOrKeep('set-email', s.email),
        facebook: getValOrKeep('set-facebook', s.facebook),
        instagram: getValOrKeep('set-instagram', s.instagram),
        whatsappNum: getValOrKeep('set-whatsapp-num', s.whatsappNum),
        telegram: getValOrKeep('set-telegram', s.telegram), // 👈 تمت إضافة الفاصلة هنا!
        gpsLink: getValOrKeep('set-gps-link', s.gpsLink)
    };
    
    window.db.collection("settings").doc("main").set(settings, { merge: true }).then(() => { 
        state.storeSettings = { ...state.storeSettings, ...settings };
        
        // تحديث زر الخريطة فوراً بعد الحفظ
        const gpsBtn = document.getElementById('link-gps');
        if (gpsBtn) {
            gpsBtn.href = settings.gpsLink || '#';
            gpsBtn.style.display = settings.gpsLink ? 'flex' : 'none';
        }

        safeCall('updateStoreFooterLinks');
        showCustomAlert('تم بنجاح 🎉', 'تم حفظ إعدادات المتجر وروابط التواصل بأمان!', true); 
    }).catch(err => {
        showCustomAlert('خطأ', 'تعذر الحفظ: ' + err.message, false);
    });
}

// 🌟 إضافة الدوال التي كانت مفقودة لعرض وحذف شرائح البانر الإعلاني الرئيسي
export function renderAdminHeroSlidesList() {
    const container = document.getElementById('admin-hero-slides-list');
    if (!container) return;
    if (!state.heroSlides || state.heroSlides.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 py-2">لا توجد شرائح إعلانية مضافة حالياً.</p>';
        return;
    }
    container.innerHTML = state.heroSlides.map(slide => `
        <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
            <div class="flex items-center gap-3">
                <img src="${slide.image}" class="w-16 h-10 object-cover rounded-lg border" loading="lazy">
                <div>
                    <h4 class="font-bold text-gray-900">${slide.title || 'صورة إعلانية (بدون نص)'}</h4>
                    <p class="text-[10px] text-gray-500">${slide.desc || ''}</p>
                </div>
            </div>
            <button type="button" onclick="deleteHeroSlide('${slide.id}')" class="text-red-600 bg-red-100 hover:bg-red-200 font-bold px-3 py-1.5 rounded-lg transition">حذف</button>
        </div>
    `).join('');
}

export function deleteHeroSlide(id) {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
        window.db.collection("heroSlides").doc(id).delete().then(() => {
            renderAdminHeroSlidesList();
            showCustomAlert('تم الحذف', 'تم حذف شريحة الإعلان بنجاح.', true);
        });
    }
}

export function handleSaveHeroSlide(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('hero-title-input')?.value.trim() || '';
    const desc = document.getElementById('hero-desc-input')?.value.trim() || '';
    const image = document.getElementById('hero-img-input')?.value.trim() || '';
    
    // 🌟 الصورة فقط هي الإجبارية الآن، أما العنوان والوصف فاختياريان
    if (!image) {
        showCustomAlert('تنبيه', 'يرجى رفع صورة الإعلان أو وضع رابطها!', false);
        return;
    }

    window.db.collection("heroSlides").add({ title, desc, image, createdAt: new Date() }).then(() => {
        document.getElementById('hero-title-input').value = '';
        document.getElementById('hero-desc-input').value = '';
        const imgInput = document.getElementById('hero-img-input');
        imgInput.value = '';
        imgInput.classList.remove('border-green-500', 'bg-green-50');
        setTimeout(renderAdminHeroSlidesList, 300);
        showCustomAlert('تم الحفظ 🎉', 'تمت إضافة البانر الإعلاني بنجاح!', true);
    });
}

export function exportOrdersToExcel() {
    const filterVal = document.getElementById('order-status-filter') ? document.getElementById('order-status-filter').value : 'الجميع';
    let targetOrders = state.orders;
    if (filterVal && filterVal !== 'الجميع') targetOrders = state.orders.filter(o => (o.status || 'جديد') === filterVal);
    if (!targetOrders || targetOrders.length === 0) { showCustomAlert('تنبيه', 'لا توجد طلبيات مطابقة!', false); return; }

    let csvContent = "\uFEFFsep=;\r\nاسم الزبون;رقم الهاتف;الولاية;البلدية;المبلغ الإجمالي (دج);حالة الطلب;المنتج\r\n";
    targetOrders.forEach(o => {
        const cleanProd = (o.product || '').replace(/[\r\n]+/g, ' | ').replace(/"/g, '""');
        csvContent += `"${(o.customer || '')}";"=""${(o.phone || '')}""";"${(o.wilaya || '')}";"${(o.commune || '')}";${o.total || 0};"${(o.status || 'جديد')}";"${cleanProd}"\r\n`;
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
    if (!newPassword || newPassword.length < 6) return showCustomAlert('تنبيه', 'كلمة المرور قصيرة جداً (6 أحرف على الأقل).', false);
    const user = window.firebase.auth().currentUser;
    if (!user) return showCustomAlert('غير مسجل', 'يجب تسجيل الدخول كمسؤول.', false);
    user.updatePassword(newPassword).then(() => {
        passwordInput.value = ''; showCustomAlert('تم التحديث', 'تم تغيير كلمة المرور بأمان.', true);
    }).catch((error) => showCustomAlert('خطأ', 'فشل التحديث: ' + error.message, false));
}

// ==========================================
// 6. نظام طباعة وصولات الإرسال (Bon de Livraison)
// ==========================================
export function printOrder(id) {
    const order = state.orders.find(o => o.id === id);
    if (!order) return;

    const shortId = order.id.substring(0, 6).toUpperCase();
    let dateStr = 'غير معروف';
    if (order.createdAt) {
        const d = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        dateStr = d.toLocaleDateString('ar-DZ') + ' ' + d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
    }

    const storeName = state.storeSettings.name || 'كوسمتيك عبد الحق';
    const storeLogo = state.storeSettings.logoUrl ? `<img src="${state.storeSettings.logoUrl}" style="max-height: 60px; margin-bottom: 10px;">` : `<div style="font-size:30px; margin-bottom:5px;">👑</div>`;

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>وصل إرسال - #${shortId}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Cairo', sans-serif; padding: 20px; color: #000; background: #fff; display: flex; justify-content: center; }
                .receipt-box { border: 2px dashed #000; padding: 25px; width: 100%; max-width: 400px; border-radius: 15px; position: relative; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
                .header h2 { margin: 0; font-size: 24px; font-weight: 900; }
                .info-group { margin-bottom: 12px; font-size: 16px; line-height: 1.5; }
                .info-group strong { display: inline-block; width: 90px; color: #333; }
                .total { font-size: 22px; font-weight: 900; text-align: center; border-top: 2px solid #000; padding-top: 15px; margin-top: 20px; }
                .footer { text-align: center; font-size: 13px; margin-top: 20px; color: #555; }
                @media print {
                    body { -webkit-print-color-adjust: exact; margin: 0; padding: 10px; }
                    .receipt-box { border: 1px solid #000; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-box">
                <div class="header">
                    ${storeLogo}
                    <h2>${storeName}</h2>
                    <p style="margin:5px 0 0; font-size:15px; font-weight:bold;">وصل إرسال - Bon de Livraison</p>
                </div>
                <div class="info-group"><strong>رقم الطلب:</strong> #${shortId}</div>
                <div class="info-group"><strong>التاريخ:</strong> ${dateStr}</div>
                <hr style="border:0; border-top:1px dashed #ccc; margin: 15px 0;">
                
                <div class="info-group"><strong>المرسل إليه:</strong> ${order.customer}</div>
                <div class="info-group"><strong>الهاتف:</strong> <span dir="ltr" style="font-weight:bold; font-size:18px;">${order.phone}</span></div>
                <div class="info-group"><strong>الولاية:</strong> ${order.wilaya || 'غير محدد'}</div>
                <div class="info-group"><strong>البلدية:</strong> ${order.commune || 'غير محدد'}</div>
                
                <hr style="border:0; border-top:1px dashed #ccc; margin: 15px 0;">
                <div class="info-group" style="font-size:14px; white-space: pre-line;"><strong>المنتج المطلوب:</strong><br>${order.product}</div>
                
                <div class="total">المبلغ المطلوب: ${order.total ? order.total.toLocaleString() : 0} دج</div>
                <div class="footer">شكراً لتسوقكم معنا! - Merci pour votre confiance</div>
            </div>
            <script>
                window.onload = function() { 
                    setTimeout(() => { window.print(); window.close(); }, 500); 
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

export function printSelectedOrders() {
    const checkedBoxes = document.querySelectorAll('.order-cb:checked');
    if (checkedBoxes.length === 0) return;

    const selectedOrders = Array.from(checkedBoxes).map(cb => state.orders.find(o => o.id === cb.value)).filter(Boolean);
    const storeName = state.storeSettings.name || 'كوسمتيك عبد الحق';
    const storeLogo = state.storeSettings.logoUrl ? `<img src="${state.storeSettings.logoUrl}" style="max-height: 45px; margin-bottom: 5px;">` : `<div style="font-size:20px; margin-bottom:5px;">👑</div>`;

    let pagesHtml = '';
    for (let i = 0; i < selectedOrders.length; i += 4) {
        const chunk = selectedOrders.slice(i, i + 4);
        pagesHtml += `<div class="page">`;
        chunk.forEach(order => {
            const shortId = order.id.substring(0, 6).toUpperCase();
            let dateStr = 'غير معروف';
            if (order.createdAt) {
                const d = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                dateStr = d.toLocaleDateString('ar-DZ') + ' ' + d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
            }
            pagesHtml += `
                <div class="receipt-box">
                    <div class="header">
                        ${storeLogo}
                        <h2>${storeName}</h2>
                        <p style="margin:2px 0 0; font-size:12px; font-weight:bold;">وصل إرسال - Bon de Livraison</p>
                    </div>
                    <div class="info-group"><strong>رقم الطلب:</strong> #${shortId}</div>
                    <div class="info-group"><strong>التاريخ:</strong> ${dateStr}</div>
                    <hr style="border:0; border-top:1px dashed #ccc; margin: 8px 0;">
                    <div class="info-group"><strong>المرسل إليه:</strong> ${order.customer}</div>
                    <div class="info-group"><strong>الهاتف:</strong> <span dir="ltr" style="font-weight:bold; font-size:15px;">${order.phone}</span></div>
                    <div class="info-group"><strong>الولاية:</strong> ${order.wilaya || 'غير محدد'}</div>
                    <div class="info-group"><strong>البلدية:</strong> ${order.commune || 'غير محدد'}</div>
                    <hr style="border:0; border-top:1px dashed #ccc; margin: 8px 0;">
                    <div class="info-group" style="font-size:12px; max-height: 45px; overflow: hidden;"><strong>المنتج المطلوب:</strong><br>${order.product}</div>
                    <div class="total">المطلوب: ${order.total ? order.total.toLocaleString() : 0} دج</div>
                    <div class="footer">شكراً لتسوقكم معنا!</div>
                </div>
            `;
        });
        pagesHtml += `</div>`;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>طباعة وصولات جماعية</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; background: #525659; display: flex; flex-direction: column; align-items: center; }
                .page { width: 210mm; height: 297mm; background: #fff; display: grid; grid-template-columns: 105mm 105mm; grid-template-rows: 148.5mm 148.5mm; page-break-after: always; box-shadow: 0 0 10px rgba(0,0,0,0.5); margin: 20px auto; box-sizing: border-box; }
                .receipt-box { width: 105mm; height: 148.5mm; padding: 15px; box-sizing: border-box; border: 1px dashed #aaa; position: relative; overflow: hidden; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                .header h2 { margin: 0; font-size: 18px; font-weight: 900; }
                .info-group { margin-bottom: 5px; font-size: 13px; line-height: 1.4; }
                .info-group strong { display: inline-block; width: 75px; color: #333; }
                .total { font-size: 17px; font-weight: 900; text-align: center; border-top: 2px solid #000; padding-top: 8px; margin-top: 10px; }
                .footer { text-align: center; font-size: 11px; color: #555; position: absolute; bottom: 15px; width: calc(100% - 30px); left: 15px; border-top: 1px dashed #ccc; padding-top: 5px; }
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; background: #fff; box-shadow: none; display: block; }
                    .page { margin: 0; box-shadow: none; border: none; }
                    .receipt-box { border: 1px solid #ccc; }
                }
            </style>
        </head>
        <body>
            ${pagesHtml}
            <script>
                window.onload = function() {
                    setTimeout(() => { window.print(); window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ==========================================
// 7. إدارة قسم صانع الهدايا (VIP Gift)
// ==========================================
let adminGiftSettings = {
    slogan: "يبدو أن أحدهم سيغدو سعيداً اليوم",
    minOrder: 2000,
    isActive: true,
    recipients: ["زوجتي", "زوجي", "الأم", "الأب", "صديقتي", "شخص عزيز", "نفسي"],
    wrappings: []
};

export async function loadGiftAdminData() {
    if (typeof window.db !== 'undefined') {
        try {
            const doc = await window.db.collection('settings').doc('main').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.gift) {
                    adminGiftSettings = data.gift;
                    if (!state.storeSettings) state.storeSettings = {};
                    state.storeSettings.gift = adminGiftSettings;
                }
            }
        } catch (error) {
            console.error("خطأ في جلب بيانات الهدايا من السيرفر:", error);
            if (state.storeSettings && state.storeSettings.gift) {
                adminGiftSettings = state.storeSettings.gift;
            }
        }
    } else if (state.storeSettings && state.storeSettings.gift) {
        adminGiftSettings = state.storeSettings.gift;
    }

    const sloganInput = document.getElementById('gift-slogan-input');
    const minOrderInput = document.getElementById('gift-min-order-input');
    
    if (sloganInput) sloganInput.value = adminGiftSettings.slogan || "";
    if (minOrderInput) minOrderInput.value = adminGiftSettings.minOrder || 0;
    
    const masterSwitch = document.getElementById('gift-master-switch');
    if (masterSwitch) {
        masterSwitch.checked = adminGiftSettings.isActive !== false;
        toggleGiftSystem(masterSwitch.checked);
    }

    renderGiftRecipients();
    renderAdminWrappings();
}

export function toggleGiftSystem(isActive) {
    adminGiftSettings.isActive = isActive;
    const statusText = document.getElementById('gift-status-text');
    if (statusText) {
        if (isActive) {
            statusText.innerText = "شغال";
            statusText.classList.replace('text-gray-500', 'text-green-600');
        } else {
            statusText.innerText = "متوقف";
            statusText.classList.replace('text-green-600', 'text-gray-500');
        }
    }
}

export function addGiftRecipient() {
    const input = document.getElementById('new-recipient-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
        if (!adminGiftSettings.recipients) adminGiftSettings.recipients = [];
        adminGiftSettings.recipients.push(val);
        input.value = "";
        renderGiftRecipients();
    }
}

export function removeGiftRecipient(index) {
    adminGiftSettings.recipients.splice(index, 1);
    renderGiftRecipients();
}

function renderGiftRecipients() {
    const container = document.getElementById('admin-recipients-list');
    if (!container) return;
    if (!adminGiftSettings.recipients) adminGiftSettings.recipients = [];
    container.innerHTML = adminGiftSettings.recipients.map((r, i) => `
        <span class="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 border border-gray-200 shadow-sm">
            ${r}
            <button type="button" onclick="removeGiftRecipient(${i})" class="text-red-500 hover:text-red-700 transition"><i class="fa-solid fa-xmark"></i></button>
        </span>
    `).join('');
}

export async function saveNewWrapping() {
    const fileInput = document.getElementById('wrap-image-file');
    const nameInput = document.getElementById('wrap-name');
    const priceInput = document.getElementById('wrap-price');
    const btn = document.getElementById('btn-save-wrap');
    
    if (!fileInput.files[0] || !nameInput.value.trim()) {
        showCustomAlert("تنبيه", "يرجى التقاط/اختيار صورة وكتابة اسم التغليف!", false);
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الرفع...';
    btn.disabled = true;

    try {
        const downloadURL = await window.compressAndUploadImage(fileInput.files[0], 'gift_wrappings', 450);
        const newWrap = {
            id: 'wrap_' + Date.now(),
            name: nameInput.value.trim(),
            price: parseFloat(priceInput.value) || 0,
            image: downloadURL
        };
        
        if (!adminGiftSettings.wrappings) adminGiftSettings.wrappings = [];
        adminGiftSettings.wrappings.push(newWrap);
        renderAdminWrappings();
        
        document.getElementById('add-wrapping-modal').classList.add('hidden');
        document.getElementById('add-wrapping-modal').classList.remove('flex');
        fileInput.value = ""; nameInput.value = ""; priceInput.value = "";
    } catch (error) {
        showCustomAlert("خطأ", "فشل الرفع: " + error.message, false);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> رفع وإضافة';
        btn.disabled = false;
    }
}

export function deleteWrapping(id) {
    if (confirm('هل أنت متأكد من حذف هذا التغليف؟ لن يظهر للزبائن بعد الآن.')) {
        adminGiftSettings.wrappings = adminGiftSettings.wrappings.filter(w => w.id !== id);
        renderAdminWrappings();
    }
}

function renderAdminWrappings() {
    const tbody = document.getElementById('admin-wrappings-list');
    if (!tbody) return;
    if (!adminGiftSettings.wrappings || adminGiftSettings.wrappings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-6 text-gray-500 text-xs font-bold bg-gray-50">لا توجد أشكال تغليف حالياً. اضغط على الزر الذهبي لإضافة واحد!</td></tr>`;
        return;
    }
    
    tbody.innerHTML = adminGiftSettings.wrappings.map(w => `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
            <td class="p-2"><img src="${w.image}" class="w-14 h-14 object-cover rounded-xl border border-gray-200 shadow-sm" loading="lazy"></td>
            <td class="p-2 font-bold text-gray-800 text-xs">${w.name}</td>
            <td class="p-2 text-[#D4AF37] font-black text-xs">${w.price > 0 ? w.price + ' دج' : 'مجاني'}</td>
            <td class="p-2 text-center">
                <button type="button" onclick="deleteWrapping('${w.id}')" class="text-red-500 hover:text-white bg-red-50 hover:bg-red-500 p-2.5 rounded-xl transition shadow-sm"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `).join('');
}

export async function saveGiftSettings() {
    try {
        const sloganInput = document.getElementById('gift-slogan-input');
        const minOrderInput = document.getElementById('gift-min-order-input');
        const btn = document.querySelector('button[onclick="saveGiftSettings()"]');
        
        if (!sloganInput || !minOrderInput) {
            showCustomAlert("خطأ", "لم يتم العثور على الحقول، يرجى التحقق من الصفحة.", false);
            return;
        }

        adminGiftSettings.slogan = sloganInput.value.trim();
        adminGiftSettings.minOrder = parseFloat(minOrderInput.value) || 0;

        const originalText = btn ? btn.innerHTML : 'حفظ الإعدادات';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

        if (typeof window.db === 'undefined') {
            showCustomAlert("خطأ الاتصال", "تعذر الاتصال بقاعدة البيانات Firebase.", false);
            if (btn) btn.innerHTML = originalText;
            return;
        }

        await window.db.collection("settings").doc("main").set({ gift: adminGiftSettings }, { merge: true });

        if (!state.storeSettings) state.storeSettings = {};
        state.storeSettings.gift = adminGiftSettings;

        showCustomAlert("تم الحفظ 🎉", "تم حفظ إعدادات صانع الهدايا بنجاح!", true);
        if (btn) btn.innerHTML = originalText;

    } catch (error) {
        console.error("Error saving gift settings:", error);
        showCustomAlert("خطأ", "حدث خطأ أثناء الحفظ: " + error.message, false);
        const btn = document.querySelector('button[onclick="saveGiftSettings()"]');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cosAdminLoggedIn') === 'true') {
        setTimeout(loadGiftAdminData, 1000);
    }
});

// =====================================
// 8. إعدادات الحد الأدنى للطلب الذكي
// =====================================
export function handleSaveMinOrderSettings() {
    const localWilaya = document.getElementById('set-local-wilaya')?.value || '';
    const minOrderLocal = parseFloat(document.getElementById('set-min-order-local')?.value) || 0;
    const minOrderNational = parseFloat(document.getElementById('set-min-order-national')?.value) || 0;

    window.db.collection("settings").doc("main").set({
        localWilaya, 
        minOrderLocal, 
        minOrderNational
    }, { merge: true }).then(() => {
        if (!state.storeSettings) state.storeSettings = {};
        state.storeSettings.localWilaya = localWilaya;
        state.storeSettings.minOrderLocal = minOrderLocal;
        state.storeSettings.minOrderNational = minOrderNational;
        showCustomAlert('تم بنجاح 🎉', 'تم حفظ إعدادات الحد الأدنى للطلب بنجاح!', true);
    }).catch(err => {
        showCustomAlert('خطأ', 'تعذر الحفظ: ' + err.message, false);
    });
}
// =====================================
// 🎟️ إدارة أكواد الخصم والكوبونات (Coupons)
// =====================================
export function handleSaveCoupon(e) {
    if (e) e.preventDefault();
    const codeInput = document.getElementById('coupon-code-input');
    const typeSelect = document.getElementById('coupon-type-select');
    const valInput = document.getElementById('coupon-value-input');
    const targetSelect = document.getElementById('coupon-target-product');

    if (!codeInput || !valInput) return;
    const code = codeInput.value.trim().toUpperCase();
    const type = typeSelect ? typeSelect.value : 'percent';
    const value = parseFloat(valInput.value) || 0;
    const targetProductId = targetSelect ? targetSelect.value : 'all';

    if (!code || value <= 0) return;
    if (type === 'percent' && value > 100) {
        showCustomAlert('تنبيه', 'نسبة الخصم لا يمكن أن تتجاوز 100%!', false);
        return;
    }

    const targetProd = targetProductId === 'all' ? null : state.products.find(p => p.id === targetProductId);
    const targetProductName = targetProd ? targetProd.name : 'جميع المنتجات 🌐';

    if (!state.coupons) state.coupons = [];
    // تحديث الكود إن كان موجوداً أو إضافته كجديد
    state.coupons = state.coupons.filter(c => c.code !== code);
    state.coupons.push({
        code,
        type,
        value,
        targetProductId,
        targetProductName,
        createdAt: Date.now()
    });

    window.db.collection("settings").doc("main").set({ coupons: state.coupons }, { merge: true }).then(() => {
        codeInput.value = '';
        valInput.value = '';
        if (targetSelect) targetSelect.value = 'all';
        renderAdminCouponsList();
        showCustomAlert('تم الحفظ 🎟️', `تم تفعيل كود الخصم (${code}) بنجاح!`, true);
    });
}

export function renderAdminCouponsList() {
    const container = document.getElementById('admin-coupons-list');
    if (!container) return;

    if (!state.coupons || state.coupons.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 col-span-full py-2">لا توجد أكواد خصم فعالة حالياً.</p>';
        return;
    }

    container.innerHTML = state.coupons.map((c, idx) => `
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center text-xs shadow-sm">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="bg-black text-[#D4AF37] font-mono font-black px-2.5 py-1 rounded-lg text-sm tracking-wider">${c.code}</span>
                    <span class="font-black text-emerald-600 text-sm">-${c.value}${c.type === 'percent' ? '%' : ' دج'}</span>
                </div>
                <p class="text-[11px] text-gray-500 font-bold truncate max-w-[180px]">${c.targetProductId === 'all' ? '🌐 شامل لكل المتجر' : '🎯 خاص بـ: ' + (c.targetProductName || 'منتج مخصص')}</p>
            </div>
            <button type="button" onclick="deleteCoupon(${idx})" class="text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer">حذف</button>
        </div>
    `).join('');
}

export function deleteCoupon(idx) {
    if (confirm('هل أنت متأكد من إيقاف وحذف كود الخصم هذا؟')) {
        state.coupons.splice(idx, 1);
        renderAdminCouponsList();
        window.db.collection("settings").doc("main").set({ coupons: state.coupons }, { merge: true });
    }
}
// =====================================
// 9. التصدير للـ Window
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
window.renderAdminHeroSlidesList = renderAdminHeroSlidesList;
window.deleteHeroSlide = deleteHeroSlide;
window.handleSaveHeroSlide = handleSaveHeroSlide;
window.exportOrdersToExcel = exportOrdersToExcel;
window.updateAdminPasswordSecure = updateAdminPasswordSecure;
window.toggleProductStock = toggleProductStock;
window.toggleAllOrders = toggleAllOrders;
window.checkBulkDeleteStatus = checkBulkDeleteStatus;
window.deleteSelectedOrders = deleteSelectedOrders;
window.selectCategoryForFilter = selectCategoryForFilter;
window.populateFilterCategories = populateFilterCategories;
window.handleSaveDynamicAttribute = handleSaveDynamicAttribute;
window.renderDynamicAttributesList = renderDynamicAttributesList;
window.renderAdminAttributesTab = renderDynamicAttributesList; // للتوافق مع database.js
window.deleteDynamicAttribute = deleteDynamicAttribute;
window.printOrder = printOrder;
window.printSelectedOrders = printSelectedOrders;
window.handleSaveMinOrderSettings = handleSaveMinOrderSettings;
window.openImageModal = openImageModal;
window.loadGiftAdminData = loadGiftAdminData;
window.toggleGiftSystem = toggleGiftSystem;
window.addGiftRecipient = addGiftRecipient;
window.removeGiftRecipient = removeGiftRecipient;
window.saveNewWrapping = saveNewWrapping;
window.deleteWrapping = deleteWrapping;
window.saveGiftSettings = saveGiftSettings;
window.handleSaveCoupon = handleSaveCoupon;
window.renderAdminCouponsList = renderAdminCouponsList;
window.deleteCoupon = deleteCoupon;
window.deleteDynamicAttributeOption = deleteDynamicAttributeOption;
