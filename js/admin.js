// ==========================================
// ⚙️ إدارة لوحة التحكم (Admin Dashboard Management)
// ==========================================

// التبديل بين تبويبات لوحة التحكم
function switchAdminTab(tabName) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // إلغاء تفعيل كافة الأزرار
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-black', 'text-white');
        btn.classList.add('bg-gray-800', 'text-gray-300');
    });

    // تفعيل التبويب المختار
    const targetTab = document.getElementById(`admin-tab-${tabName}`);
    const targetBtn = document.getElementById(`tab-btn-${tabName}`);

    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) {
        targetBtn.classList.remove('bg-gray-800', 'text-gray-300');
        targetBtn.classList.add('bg-black', 'text-white');
    }

    // عرض محتوى التبويب المختار
    if (tabName === 'analytics') renderAdminAnalyticsTab();
    if (tabName === 'hero') renderAdminHeroTab();
    if (tabName === 'products') renderAdminProductsTab();
    if (tabName === 'brands') renderAdminBrandsTab();
    if (tabName === 'categories') renderAdminCategoriesTab();
    if (tabName === 'shipping') renderAdminShippingTab();
    if (tabName === 'settings') renderAdminSettingsTab();
}

// عرض الصفحة الرئيسية للوحة التحكم عند فتحها
function renderAdminDashboard() {
    renderAdminProductsTab();
    renderAdminAnalyticsTab();
}

// ------------------------------------------
// 📊 1. تبويب المبيعات والتحليلات والطلبات
// ------------------------------------------
function renderAdminAnalyticsTab() {
    const totalSalesEl = document.getElementById('stat-total-sales');
    const ordersCountEl = document.getElementById('stat-orders-count');
    const avgOrderEl = document.getElementById('stat-avg-order');
    const successRateEl = document.getElementById('stat-success-rate');
    const ordersLogTbody = document.getElementById('admin-orders-log');
    const ordersBadge = document.getElementById('orders-badge-count');

    let totalRevenue = 0;
    let deliveredCount = 0;
    const totalOrdersCount = orders.length;

    orders.forEach(ord => {
        if (ord.status === 'تم التوصيل' || ord.status === 'مؤكد') {
            totalRevenue += parseFloat(ord.totalPrice || 0);
        }
        if (ord.status === 'تم التوصيل') {
            deliveredCount++;
        }
    });

    if (totalSalesEl) totalSalesEl.innerText = totalRevenue.toLocaleString() + ' دج';
    if (ordersCountEl) ordersCountEl.innerText = totalOrdersCount;
    if (ordersBadge) ordersBadge.innerText = totalOrdersCount;

    const avg = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    if (avgOrderEl) avgOrderEl.innerText = avg.toLocaleString() + ' دج';

    const rate = totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0;
    if (successRateEl) successRateEl.innerText = rate + '%';

    if (ordersLogTbody) {
        if (orders.length === 0) {
            ordersLogTbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-400">لا توجد طلبات مسجلة حتى الآن.</td></tr>';
            return;
        }

        ordersLogTbody.innerHTML = orders.map(ord => `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="p-3 font-bold text-gray-900">
                    <div>${ord.customerName || 'زبون'}</div>
                    <div class="text-xs text-gray-500 font-normal" dir="ltr">${ord.customerPhone || ''}</div>
                </td>
                <td class="p-3 text-xs text-gray-600">
                    <div>${ord.wilayaName || ''} - ${ord.communeName || ''}</div>
                    <span class="text-[10px] bg-gray-100 px-2 py-0.5 rounded border">${ord.shippingType === 'office' ? 'استلام من المكتب' : 'توصيل للمنزل'}</span>
                </td>
                <td class="p-3">
                    <div class="font-bold text-sm text-[#B8860B]">${(ord.totalPrice || 0).toLocaleString()} دج</div>
                    <div class="text-[11px] text-gray-500 truncate max-w-[150px]">${ord.productName || 'منتج'}</div>
                </td>
                <td class="p-3">
                    <select onchange="updateOrderStatus('${ord.id}', this.value)" class="text-xs font-bold p-2 rounded-xl border outline-none cursor-pointer ${getStatusColorClass(ord.status)}">
                        <option value="جديد" ${ord.status === 'جديد' ? 'selected' : ''}>قيد الانتظار 🟡</option>
                        <option value="مؤكد" ${ord.status === 'مؤكد' ? 'selected' : ''}>مؤكد 🔵</option>
                        <option value="تم التوصيل" ${ord.status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل 🟢</option>
                        <option value="ملغي" ${ord.status === 'ملغي' ? 'selected' : ''}>ملغي 🔴</option>
                    </select>
                </td>
                <td class="p-3">
                    <div class="flex items-center gap-2">
                        <a href="tel:${ord.customerPhone}" class="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-phone"></i> اتصال
                        </a>
                        <button onclick="confirmDeleteOrder('${ord.id}')" class="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-xs">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

function getStatusColorClass(status) {
    if (status === 'مؤكد') return 'bg-blue-50 text-blue-800 border-blue-200';
    if (status === 'تم التوصيل') return 'bg-green-50 text-green-800 border-green-200';
    if (status === 'ملغي') return 'bg-red-50 text-red-800 border-red-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
}

function updateOrderStatus(orderId, newStatus) {
    db.collection("orders").doc(orderId).update({
        status: newStatus
    }).then(() => {
        showCustomAlert('تم التحديث 👍', 'تم تعديل حالة الطلبية بنجاح.');
        renderAdminAnalyticsTab();
    });
}

function confirmDeleteOrder(orderId) {
    showCustomConfirm('هل أنت تأكد من رغبتك في حذف هذه الطلبية نهائياً؟', () => {
        db.collection("orders").doc(orderId).delete().then(() => {
            showCustomAlert('تم الحذف 🗑️', 'تم حذف الطلبية بنجاح.');
            renderAdminAnalyticsTab();
        });
    });
}

// ------------------------------------------
// 🛍️ 2. تبويب إدارة المنتجات
// ------------------------------------------
function renderAdminProductsTab() {
    const tbody = document.getElementById('admin-products-tbody');
    const catSelect = document.getElementById('prod-category-select');
    const brandSelect = document.getElementById('prod-brand-select');

    if (catSelect) {
        catSelect.innerHTML = '<option value="">اختر الفئة *</option>' + categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }

    if (brandSelect) {
        brandSelect.innerHTML = '<option value="">اختر الماركة (اختياري)</option>' + brands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
    }

    if (tbody) {
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-gray-400">لا توجد منتجات حالياً. أضف أول منتج أعلاه!</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => {
            const img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/60';
            return `
                <tr class="border-b hover:bg-gray-50 transition">
                    <td class="p-3">
                        <img src="${img}" class="w-12 h-12 object-cover rounded-lg border bg-gray-100">
                    </td>
                    <td class="p-3 font-bold text-gray-900">${p.name}</td>
                    <td class="p-3 text-xs text-gray-600">${p.category || '-'}</td>
                    <td class="p-3 text-xs text-gray-600">${p.brand || '-'}</td>
                    <td class="p-3 font-black text-[#B8860B]">${(p.price || 0).toLocaleString()} دج</td>
                    <td class="p-3">
                        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${p.inStock ? 'متوفر 🟢' : 'غير متوفر 🔴'}
                        </span>
                    </td>
                    <td class="p-3">
                        <div class="flex items-center gap-2">
                            <button onclick="editProduct('${p.id}')" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-bold">
                                <i class="fa-solid fa-pen-to-square"></i> تعديل
                            </button>
                            <button onclick="deleteProduct('${p.id}')" class="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-bold">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function handleSaveProduct(e) {
    e.preventDefault();
    const editId = document.getElementById('editing-product-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value) || 0;
    const oldPrice = parseFloat(document.getElementById('prod-old-price').value) || 0;
    const category = document.getElementById('prod-category-select').value;
    const brand = document.getElementById('prod-brand-select').value;
    const inStock = document.getElementById('prod-in-stock').value === 'true';
    const desc = document.getElementById('prod-desc').value.trim();

    const img1 = document.getElementById('prod-img-main').value.trim();
    const img2 = document.getElementById('prod-img-2').value.trim();
    const img3 = document.getElementById('prod-img-3').value.trim();
    const img4 = document.getElementById('prod-img-4').value.trim();
    const img5 = document.getElementById('prod-img-5').value.trim();

    const images = [img1, img2, img3, img4, img5].filter(url => url !== '');

    if (images.length === 0) {
        showCustomAlert('تنبيه ⚠️', 'يرجى إدخال رابط صورة واحدة على الأقل للمنتج!');
        return;
    }

    const productData = {
        name,
        price,
        oldPrice: oldPrice > 0 ? oldPrice : null,
        category,
        brand: brand || null,
        inStock,
        description: desc,
        images,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editId) {
        db.collection("products").doc(editId).update(productData).then(() => {
            showCustomAlert('تم التحديث 👍', 'تم تعديل بيانات المنتج بنجاح!');
            resetProductForm();
            renderAdminProductsTab();
        });
    } else {
        productData.salesCount = 0;
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection("products").add(productData).then(() => {
            showCustomAlert('تمت الإضافة 🎉', 'تم إضافة المنتج الجديد بنجاح!');
            resetProductForm();
            renderAdminProductsTab();
        });
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
    document.getElementById('prod-desc').value = p.description || '';

    const imgs = p.images || [];
    document.getElementById('prod-img-main').value = imgs[0] || '';
    document.getElementById('prod-img-2').value = imgs[1] || '';
    document.getElementById('prod-img-3').value = imgs[2] || '';
    document.getElementById('prod-img-4').value = imgs[3] || '';
    document.getElementById('prod-img-5').value = imgs[4] || '';

    document.getElementById('product-form-title').innerText = 'تعديل المنتج الحالي';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    document.getElementById('save-product-btn').innerText = 'حفظ التعديلات';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetProductForm() {
    document.getElementById('product-edit-form').reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج (مع رفع الصور من الجهاز أو الرابط)';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    document.getElementById('save-product-btn').innerText = 'حفظ المنتج';
}

function deleteProduct(id) {
    showCustomConfirm('هل أنت تأكد من رغبتك في حذف هذا المنتج نهائياً؟', () => {
        db.collection("products").doc(id).delete().then(() => {
            showCustomAlert('تم الحذف 🗑️', 'تم حذف المنتج بنجاح.');
            renderAdminProductsTab();
        });
    });
}

function handleImageUpload(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById(targetInputId).value = e.target.result;
        showCustomAlert('تم الرفع 📸', 'تم تجهيز الصورة بنجاح!');
    };
    reader.readAsDataURL(file);
}

// ------------------------------------------
// 🏷️ 3. تبويب العلامات التجارية (Brands)
// ------------------------------------------
function renderAdminBrandsTab() {
    const listEl = document.getElementById('admin-brands-list');
    if (!listEl) return;

    if (brands.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-xs col-span-full">لا توجد علامات تجارية مسجلة.</p>';
        return;
    }

    listEl.innerHTML = brands.map(b => `
        <div class="bg-gray-50 border p-3.5 rounded-xl flex items-center justify-between shadow-sm">
            <span class="font-bold text-gray-800 text-sm">${b.name}</span>
            <button onclick="deleteBrand('${b.id}')" class="text-red-500 hover:text-red-700 text-xs">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function handleSaveBrand(e) {
    e.preventDefault();
    const input = document.getElementById('brand-name-input');
    const name = input.value.trim();
    if (!name) return;

    db.collection("brands").add({ name }).then(() => {
        showCustomAlert('تمت الإضافة 👍', `تمت إضافة الماركة "${name}" بنجاح!`);
        input.value = '';
        renderAdminBrandsTab();
    });
}

function deleteBrand(id) {
    db.collection("brands").doc(id).delete().then(() => {
        showCustomAlert('تم الحذف 🗑️', 'تم حذف العلامة التجارية.');
        renderAdminBrandsTab();
    });
}

// ------------------------------------------
// 🖼️ 4. تبويب البانرات الإعلانية (Hero Slides)
// ------------------------------------------
function renderAdminHeroTab() {
    const listEl = document.getElementById('admin-hero-slides-list');
    if (!listEl) return;

    listEl.innerHTML = heroSlides.map(slide => `
        <div class="flex items-center gap-4 bg-gray-50 border p-3 rounded-xl">
            <img src="${slide.image}" class="w-20 h-14 object-cover rounded-lg border">
            <div class="flex-1">
                <h4 class="font-bold text-sm text-gray-900">${slide.title}</h4>
                <p class="text-xs text-gray-500">${slide.desc}</p>
            </div>
            <button onclick="deleteHeroSlide('${slide.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function handleSaveHeroSlide(e) {
    e.preventDefault();
    const title = document.getElementById('hero-title-input').value.trim();
    const desc = document.getElementById('hero-desc-input').value.trim();
    const image = document.getElementById('hero-img-input').value.trim();

    db.collection("heroSlides").add({ title, desc, image }).then(() => {
        showCustomAlert('تمت الإضافة 🖼️', 'تم إضافة البانر الإعلاني بنجاح!');
        document.getElementById('hero-title-input').value = '';
        document.getElementById('hero-desc-input').value = '';
        document.getElementById('hero-img-input').value = '';
        renderAdminHeroTab();
    });
}

function deleteHeroSlide(id) {
    db.collection("heroSlides").doc(id).delete().then(() => {
        showCustomAlert('تم الحذف 🗑️', 'تم حذف البانر الإعلاني.');
        renderAdminHeroTab();
    });
}

// ------------------------------------------
// 📂 5. تبويب الفئات (Categories)
// ------------------------------------------
function renderAdminCategoriesTab() {
    const listEl = document.getElementById('admin-categories-list');
    if (!listEl) return;

    listEl.innerHTML = categories.map(cat => `
        <div class="bg-gray-50 border p-3 rounded-xl flex items-center justify-between gap-2 shadow-sm">
            <div class="flex items-center gap-3">
                <img src="${cat.image}" class="w-10 h-10 rounded-lg object-cover border">
                <span class="font-bold text-xs text-gray-900">${cat.name}</span>
            </div>
            <button onclick="deleteCategory('${cat.id}')" class="text-red-500 hover:text-red-700 text-xs p-1">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function handleSaveCategory(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name-input').value.trim();
    const image = document.getElementById('cat-img-input').value.trim();

    db.collection("categories").add({ name, image }).then(() => {
        showCustomAlert('تمت الإضافة 📂', `تمت إضافة الفئة "${name}" بنجاح!`);
        document.getElementById('cat-name-input').value = '';
        document.getElementById('cat-img-input').value = '';
        renderAdminCategoriesTab();
    });
}

function deleteCategory(id) {
    db.collection("categories").doc(id).delete().then(() => {
        showCustomAlert('تم الحذف 🗑️', 'تم حذف الفئة.');
        renderAdminCategoriesTab();
    });
}

// ------------------------------------------
// 🚚 6. تبويب الولايات وأسعار التوصيل
// ------------------------------------------
function renderAdminShippingTab() {
    const listEl = document.getElementById('admin-wilayas-list');
    if (!listEl) return;

    listEl.innerHTML = wilayas.map(w => `
        <div class="bg-gray-50 border p-4 rounded-xl flex flex-wrap justify-between items-center gap-3">
            <div>
                <span class="bg-black text-white text-xs font-black px-2.5 py-1 rounded-lg ml-2">${w.code}</span>
                <span class="font-bold text-gray-900 text-sm">${w.name}</span>
            </div>
            <div class="flex gap-4 text-xs">
                <span class="text-gray-600">منزل: <strong class="text-[#B8860B]">${(w.homeCost || 0).toLocaleString()} دج</strong></span>
                <span class="text-gray-600">مكتب: <strong class="text-blue-600">${(w.officeCost || 0).toLocaleString()} دج</strong></span>
            </div>
            <button onclick="deleteWilaya('${w.id}')" class="text-red-500 hover:text-red-700 text-xs">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function handleSaveWilaya(e) {
    e.preventDefault();
    const code = document.getElementById('wilaya-code').value.trim();
    const name = document.getElementById('wilaya-name').value.trim();
    const homeCost = parseFloat(document.getElementById('wilaya-home-cost').value) || 0;
    const officeCost = parseFloat(document.getElementById('wilaya-office-cost').value) || 0;
    const communesInput = document.getElementById('wilaya-communes-input').value.trim();

    const communes = communesInput ? communesInput.split(',').map(c => c.trim()) : [];

    db.collection("wilayas").add({ code, name, homeCost, officeCost, communes }).then(() => {
        showCustomAlert('تم الحفظ 🚚', `تم تسعير ولاية (${name}) بنجاح!`);
        document.getElementById('wilaya-code').value = '';
        document.getElementById('wilaya-name').value = '';
        document.getElementById('wilaya-home-cost').value = '';
        document.getElementById('wilaya-office-cost').value = '';
        document.getElementById('wilaya-communes-input').value = '';
        renderAdminShippingTab();
    });
}

function deleteWilaya(id) {
    db.collection("wilayas").doc(id).delete().then(() => {
        showCustomAlert('تم الحذف 🗑️', 'تم حذف بيانات الولاية.');
        renderAdminShippingTab();
    });
}

// ------------------------------------------
// ⚙️ 7. تبويب الهوية والمقولة الافتتاحية والرسائل
// ------------------------------------------
function renderAdminSettingsTab() {
    const storeNameInp = document.getElementById('set-store-name');
    const storeSloganInp = document.getElementById('set-store-slogan');
    const splashSloganInp = document.getElementById('set-splash-slogan');
    const logoUrlInp = document.getElementById('set-logo-url');
    const passInp = document.getElementById('set-pass');

    if (storeNameInp) storeNameInp.value = storeSettings.name || '';
    if (storeSloganInp) storeSloganInp.value = storeSettings.slogan || '';
    if (splashSloganInp) splashSloganInp.value = storeSettings.splashSlogan || 'لمستكِ الفاخرة لأناقة لا تُنسى ✨';
    if (logoUrlInp) logoUrlInp.value = storeSettings.logo || '';
    if (passInp) passInp.value = storeSettings.adminPassword || 'admin123';

    renderBannerTextsList();
}

function handleSaveSettings(e) {
    e.preventDefault();
    const name = document.getElementById('set-store-name').value.trim();
    const slogan = document.getElementById('set-store-slogan').value.trim();
    const splashSlogan = document.getElementById('set-splash-slogan').value.trim();
    const logo = document.getElementById('set-logo-url').value.trim();
    const pass = document.getElementById('set-pass').value.trim();

    storeSettings = { name, slogan, splashSlogan, logo, adminPassword: pass };

    db.collection("settings").doc("main").set({
        storeName: name,
        slogan: slogan,
        splashSlogan: splashSlogan,
        logo: logo,
        adminPassword: pass
    }, { merge: true }).then(() => {
        showCustomAlert('تم الحفظ 👍', 'تم تحديث كافة الإعدادات والمقولة الافتتاحية بنجاح!');
        if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
    });
}

function renderBannerTextsList() {
    const listEl = document.getElementById('banner-texts-list');
    if (!listEl) return;

    if (!bannerMessages || bannerMessages.length === 0) {
        listEl.innerHTML = '<p class="text-xs text-gray-400">لا توجد جمل مخصصة لشريط البانر العلوي.</p>';
        return;
    }

    listEl.innerHTML = bannerMessages.map((msg, idx) => `
        <div class="bg-gray-50 border p-3 rounded-xl flex items-center justify-between text-xs">
            <span class="font-bold text-gray-800">${msg}</span>
            <button onclick="removeBannerText(${idx})" class="text-red-500 hover:text-red-700">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function addBannerText() {
    const inp = document.getElementById('new-banner-text');
    const txt = inp.value.trim();
    if (!txt) return;

    bannerMessages.push(txt);
    db.collection("settings").doc("main").set({
        bannerMessages: bannerMessages
    }, { merge: true }).then(() => {
        inp.value = '';
        renderBannerTextsList();
        showCustomAlert('تمت الإضافة 📢', 'تم إضافة الجملة إلى شريط الإعلانات العلوي!');
    });
}

function removeBannerText(idx) {
    bannerMessages.splice(idx, 1);
    db.collection("settings").doc("main").set({
        bannerMessages: bannerMessages
    }, { merge: true }).then(() => {
        renderBannerTextsList();
        showCustomAlert('تم الحذف 🗑️', 'تمت إزالة الجملة من شريط الإعلانات.');
    });
}
