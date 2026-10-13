let pendingDeleteOrderId = null;
let selectedOrderIds = [];

function handleImageUpload(event, targetInputId) {
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
                if (width > maxDimension) {
                    height *= maxDimension / width;
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width *= maxDimension / height;
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            document.getElementById(targetInputId).value = compressedDataUrl;

            showCustomAlert('تم الرفع بنجاح! 📸', 'تم إدراج الصورة المرفوعة بنجاح في الحقل.', true);
        };
    };
    reader.readAsDataURL(file);
}

// 🟢 1. دالة تسجيل الدخول الآمنة مع تثبيت الجلسة في المتصفح
function checkAdminPassword() {
    const emailInput = document.getElementById('admin-email-input');
    const passInput = document.getElementById('admin-pass-input');
    
    if (!emailInput || !passInput) return;
    
    const email = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
        showCustomAlert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور!', false);
        return;
    }

    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            return firebase.auth().signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            const user = userCredential.user;
            const allowedAdminEmail = "mohamed.pato@gmail.com"; 
            
            if (user.email !== allowedAdminEmail) {
                firebase.auth().signOut();
                showCustomAlert('غير مخول', 'عذراً، هذا الحساب ليس له صلاحيات إدارية!', false);
                return;
            }

            const authModal = document.getElementById('admin-auth-modal');
            if (authModal) {
                authModal.style.display = 'none';
                authModal.classList.add('hidden');
                authModal.classList.remove('flex');
            }
            localStorage.setItem('cosAdminLoggedIn', 'true');
            emailInput.value = '';
            passInput.value = '';
            
            showPage('admin');
            showCustomAlert('أهلاً بك', 'تم تسجيل الدخول للوحة التحكم بنجاح 🟢', true);
        })
        .catch((error) => {
            showCustomAlert('خطأ في الدخول', 'فشل المصادقة: تأكد من صحة البريد أو كلمة المرور.', false);
        });
}

// 🟢 2. مراقبة الجلسة
firebase.auth().onAuthStateChanged((user) => {
    const authModal = document.getElementById('admin-auth-modal');
    if (user && user.email === "mohamed.pato@gmail.com") {
        if (authModal) {
            authModal.style.display = 'none';
            authModal.classList.add('hidden');
            authModal.classList.remove('flex');
        }
    } else {
        if (authModal && typeof currentActivePage !== 'undefined' && currentActivePage === 'admin') {
            authModal.style.display = 'flex';
            authModal.classList.remove('hidden');
        }
    }
});

// 🟢 3. دالة تسجيل الخروج الآمن
function adminSignOut() {
    localStorage.removeItem('cosAdminLoggedIn');
    firebase.auth().signOut().then(() => {
        showCustomAlert('تم تسجيل الخروج', 'تم تأمين وإنهاء الجلسة بنجاح.', true);
        showPage('home');
    });
}

function switchAdminTab(tabName) {
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
    if (tabName === 'attributes') renderAdminAttributesTab();
}

function populateAdminDropdowns() {
    const catSelect = document.getElementById('prod-category-select');
    if (catSelect) {
        const catList = (typeof categories !== 'undefined' && Array.isArray(categories)) ? categories : [];
        catSelect.innerHTML = '<option value="">-- اختر الفئة / القسم * --</option>' + 
            catList.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }

    const brandSelect = document.getElementById('prod-brand-select');
    if (brandSelect) {
        const brandList = (typeof brands !== 'undefined' && Array.isArray(brands) && brands.length > 0) ? brands : ["Dior", "Chanel", "Gucci", "Versace", "عام"];
        brandSelect.innerHTML = '<option value="">-- اختر العلامة التجارية (الماركة) --</option>' + 
            brandList.map(b => `<option value="${typeof b === 'object' ? b.name : b}">${typeof b === 'object' ? b.name : b}</option>`).join('');
    }

    renderCategorySpecificAdminFields();
}

function renderCategorySpecificAdminFields() {
    const catSelect = document.getElementById('prod-category-select');
    const container = document.getElementById('category-dynamic-fields-container');
    if (!catSelect || !container) return;

    const selectedCategory = (catSelect.value || '').trim().toLowerCase();
    let html = '';

    if (selectedCategory.includes('كوسمتيك')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">✨ خصائص قسم الكوسمتيك:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">منطقة الاستخدام:</label>
                        <select id="prod-cosmetic-area" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="للوجه">للوجه</option>
                            <option value="للجسد">للجسد</option>
                            <option value="للشعر">للشعر</option>
                            <option value="للتدليك والعناية">للتدليك والعناية (يدين وقدمين)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع المنتج الفرعي:</label>
                        <input type="text" id="prod-cosmetic-type" placeholder="مثال: شامبو، جل دش، كريم مرطب..." class="w-full border p-2.5 rounded-xl text-xs bg-white">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-2">أنواع البشرة المناسبة:</label>
                        <div id="admin-prod-skin-checkboxes" class="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border max-h-32 overflow-y-auto text-xs"></div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-2">أنواع الشعر المناسبة:</label>
                        <div id="admin-prod-hair-checkboxes" class="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border max-h-32 overflow-y-auto text-xs"></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border text-center text-xs text-gray-500">
                هذا القسم ينطبق على الخصائص المباشرة للمنتج (السعر والتوافر).
            </div>
        `;
    }

    container.innerHTML = html;

    const skinCbContainer = document.getElementById('admin-prod-skin-checkboxes');
    if (skinCbContainer && typeof availableSkinTypes !== 'undefined') {
        skinCbContainer.innerHTML = availableSkinTypes.map(st => `
            <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" value="${st}" class="prod-skin-cb accent-[#D4AF37]">
                <span>${st}</span>
            </label>
        `).join('');
    }

    const hairCbContainer = document.getElementById('admin-prod-hair-checkboxes');
    if (hairCbContainer && typeof availableHairTypes !== 'undefined') {
        hairCbContainer.innerHTML = availableHairTypes.map(ht => `
            <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" value="${ht}" class="prod-hair-cb accent-[#D4AF37]">
                <span>${ht}</span>
            </label>
        `).join('');
    }
}

function handleSaveProduct(e) {
    if (e) e.preventDefault();
    try {
        const editId = document.getElementById('editing-product-id').value;
        const name = document.getElementById('prod-name').value.trim();
        const price = parseFloat(document.getElementById('prod-price').value) || 0;
        const oldPriceVal = document.getElementById('prod-old-price').value;
        const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;
        const category = document.getElementById('prod-category-select').value;
        const brand = document.getElementById('prod-brand-select').value;
        const inStock = document.getElementById('prod-in-stock').value === 'true';

        const productData = {
            name, price, oldPrice, category, brand, inStock,
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
            db.collection("products").doc(editId).update(productData).then(() => {
                resetProductForm();
                showCustomAlert('تم التحديث 🎉', 'تم تحديث بيانات المنتج بنجاح!', true);
            });
        } else {
            db.collection("products").add({ ...productData, createdAt: new Date() }).then(() => {
                resetProductForm();
                showCustomAlert('تم الحفظ 🎉', 'تم إضافة المنتج الجديد بنجاح!', true);
            });
        }
    } catch (err) {
        showCustomAlert('خطأ', 'تعذر الحفظ: ' + err.message, false);
    }
}

function resetProductForm() {
    document.getElementById('product-edit-form').reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    renderCategorySpecificAdminFields();
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
    document.getElementById('prod-in-stock').value = p.inStock !== false ? 'true' : 'false';

    renderCategorySpecificAdminFields();

    document.getElementById('prod-desc').value = p.desc || '';
    const imgs = p.images || [];
    document.getElementById('prod-img-main').value = imgs[0] || '';
    document.getElementById('prod-img-2').value = imgs[1] || '';
    document.getElementById('prod-img-3').value = imgs[2] || '';

    document.getElementById('product-form-title').innerText = 'تعديل المنتج: ' + p.name;
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('product-edit-form').offsetTop - 100, behavior: 'smooth' });
}

function deleteProduct(id) {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج؟')) {
        db.collection("products").doc(id).delete().then(() => {
            showCustomAlert('تم الحذف', 'تم حذف المنتج بنجاح.', true);
        });
    }
}

// 🟢 دالة عرض لوحة التحكم وإدارة الطلبات والبحث والفلترة
function renderAdminDashboard() {
    const confirmedOrders = orders.filter(o => o.status === 'مكتملاً' || o.status === 'مؤكد' || !o.status);
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedCount = orders.filter(o => o.status === 'مكتملاً').length;
    const successRate = orders.length ? Math.round((completedCount / orders.length) * 100) : 0;

    if (document.getElementById('stat-total-sales')) document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    if (document.getElementById('stat-orders-count')) document.getElementById('stat-orders-count').innerText = orders.length;
    if (document.getElementById('stat-avg-order')) document.getElementById('stat-avg-order').innerText = confirmedOrders.length ? Math.round(totalSales / confirmedOrders.length).toLocaleString() + ' دج' : '0 دج';
    if (document.getElementById('stat-success-rate')) document.getElementById('stat-success-rate').innerText = successRate + '%';

    const filterVal = document.getElementById('order-status-filter') ? document.getElementById('order-status-filter').value : 'الجميع';
    const searchQuery = document.getElementById('order-search-input') ? document.getElementById('order-search-input').value.trim().toLowerCase() : '';
    
    let displayedOrders = orders;
    
    if (filterVal && filterVal !== 'الجميع') {
        displayedOrders = displayedOrders.filter(o => (o.status || 'جديد') === filterVal);
    }

    if (searchQuery) {
        displayedOrders = displayedOrders.filter(o => 
            (o.customer && o.customer.toLowerCase().includes(searchQuery)) ||
            (o.phone && o.phone.toLowerCase().includes(searchQuery)) ||
            (o.wilaya && o.wilaya.toLowerCase().includes(searchQuery))
        );
    }

    const ordersTbody = document.getElementById('admin-orders-log');
    if (ordersTbody) {
        if (displayedOrders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400">لا توجد طلبيات تطابق بحثك أو تصفيتك</td></tr>';
        } else {
            ordersTbody.innerHTML = displayedOrders.map(o => {
                const status = o.status || 'جديد';
                let statusBadgeClass = 'bg-yellow-100 text-yellow-800';
                if (status === 'مؤكد') statusBadgeClass = 'bg-blue-100 text-blue-800';
                if (status === 'قيد الشحن') statusBadgeClass = 'bg-purple-100 text-purple-800';
                if (status === 'مكتملاً') statusBadgeClass = 'bg-green-100 text-green-800';
                if (status === 'ملغى') statusBadgeClass = 'bg-red-100 text-red-800';

                let cleanPhone = (o.phone || '').replace(/\s+/g, '');
                if (cleanPhone.startsWith('0')) cleanPhone = '213' + cleanPhone.substring(1);
                const waMsg = encodeURIComponent(`مرحباً ${o.customer}، نتوجه إليك من متجر ${storeSettings.name} لتأكيد طلبكم الخاص بـ: ${o.product}. المبلغ الإجمالي: ${o.total} دج.`);

                return `
                    <tr class="border-b hover:bg-gray-50 transition">
                        <td class="p-3">
                            <input type="checkbox" value="${o.id}" onchange="toggleOrderSelection('${o.id}')" class="order-checkbox accent-[#D4AF37] w-4 h-4 rounded cursor-pointer">
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-gray-900">${o.customer}</div>
                            <div class="text-xs text-gray-500 font-mono">${o.phone}</div>
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-xs text-gray-800">${o.wilaya || 'غير محدد'}</div>
                            <div class="text-[11px] text-gray-500">${o.commune || ''}</div>
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-xs text-gray-900">${o.product}</div>
                            <div class="font-black text-xs text-[#B8860B]">${o.total ? o.total.toLocaleString() : 0} دج</div>
                        </td>
                        <td class="p-3">
                            <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs font-bold p-1.5 rounded-lg border outline-none cursor-pointer ${statusBadgeClass}">
                                <option value="جديد" ${status === 'جديد' ? 'selected' : ''}>🟡 جديد</option>
                                <option value="مؤكد" ${status === 'مؤكد' ? 'selected' : ''}>🔵 مؤكد</option>
                                <option value="قيد الشحن" ${status === 'قيد الشحن' ? 'selected' : ''}>🟣 شحن</option>
                                <option value="مكتملاً" ${status === 'مكتملاً' ? 'selected' : ''}>🟢 تم التسليم</option>
                                <option value="ملغى" ${status === 'ملغى' ? 'selected' : ''}>🔴 ملغى</option>
                            </select>
                        </td>
                        <td class="p-3 flex items-center gap-2">
                            <a href="tel:${o.phone}" class="bg-green-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-green-700" title="اتصال">📞</a>
                            <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-600" title="واتساب">💬</a>
                            <button onclick="promptDeleteOrder('${o.id}')" class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-red-200" title="حذف">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    renderAdminProductsTable();
    populateAdminDropdowns();
    renderBannerTextsList();
    renderAdminWilayasList();
}

function renderAdminProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد منتجات مسجلة بعد</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'https://via.placeholder.com/100');
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3"><img src="${img}" class="w-12 h-12 object-contain rounded-lg border bg-black" loading="lazy"></td>
                <td class="p-3 font-bold text-xs">${p.name}</td>
                <td class="p-3 text-xs">${p.category || 'عام'}</td>
                <td class="p-3 text-[11px] text-gray-600">${p.category || ''}</td>
                <td class="p-3 font-black text-xs text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
                <td class="p-3 text-xs"><span class="${p.inStock !== false ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}">${p.inStock !== false ? 'متوفر 🟢' : 'غير متوفر 🔴'}</span></td>
                <td class="p-3 flex items-center gap-2">
                    <button type="button" onclick="editProduct('${p.id}')" class="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-lg">تعديل</button>
                    <button type="button" onclick="deleteProduct('${p.id}')" class="bg-red-100 text-red-600 font-bold text-xs px-2.5 py-1 rounded-lg">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

function handleSaveWilaya(e) {
    if (e) e.preventDefault();
    const code = document.getElementById('wilaya-code').value.trim();
    const name = document.getElementById('wilaya-name').value.trim();
    const officeCost = parseFloat(document.getElementById('wilaya-office-cost').value) || 0;
    const homeCost = parseFloat(document.getElementById('wilaya-home-cost').value) || 0;

    if (!code || !name) return;

    db.collection("wilayas").doc(code).set({
        code, name, officeCost, homeCost
    }).then(() => {
        resetWilayaForm();
        renderAdminWilayasList();
        showCustomAlert('تم الحفظ 🎉', 'تم حفظ بيانات الولاية بنجاح!', true);
    });
}

function resetWilayaForm() {
    document.getElementById('wilaya-edit-form').reset();
    document.getElementById('editing-wilaya-id').value = '';
    const homeCostInput = document.getElementById('wilaya-home-cost');
    if (homeCostInput) homeCostInput.value = '';
    document.getElementById('wilaya-form-title').innerText = 'إضافة / تعديل ولاية';
    document.getElementById('cancel-wilaya-edit-btn').classList.add('hidden');
}

function editWilaya(code) {
    const w = WILAYAS.find(wil => wil.code === code);
    if (!w) return;

    document.getElementById('editing-wilaya-id').value = w.code;
    document.getElementById('wilaya-code').value = w.code;
    document.getElementById('wilaya-name').value = w.name;
    document.getElementById('wilaya-office-cost').value = w.officeCost || 0;
    document.getElementById('wilaya-home-cost').value = w.homeCost || 0;

    document.getElementById('wilaya-form-title').innerText = 'تعديل الولاية: ' + w.name;
    document.getElementById('cancel-wilaya-edit-btn').classList.remove('hidden');
}

function deleteWilaya(docIdOrCode) {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذه الولاية؟')) {
        db.collection("wilayas").doc(docIdOrCode).delete().then(() => {
            renderAdminWilayasList();
            showCustomAlert('تم الحذف', 'تم حذف الولاية بنجاح.', true);
        }).catch(() => {
            db.collection("wilayas").where("code", "==", docIdOrCode).get().then(snap => {
                snap.forEach(d => d.ref.delete());
                renderAdminWilayasList();
                showCustomAlert('تم الحذف', 'تم حذف الولاية بنجاح.', true);
            });
        });
    }
}

function renderAdminWilayasList() {
    const container = document.getElementById('admin-wilayas-list');
    if (!container) return;

    if (!WILAYAS || WILAYAS.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 py-4 text-center">لا توجد ولايات مسجلة بعد.</p>';
        return;
    }

    container.innerHTML = WILAYAS.map(w => `
        <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex justify-between items-center text-xs shadow-sm my-2">
            <div>
                <span class="bg-[#B8860B] text-white font-bold px-2 py-1 rounded-lg text-[10px]">${w.code}</span>
                <span class="font-bold text-sm text-gray-900 mr-2">${w.name}</span>
                <div class="flex gap-4 mt-1 text-gray-700">
                    <span>توصيل المكتب: <strong>${w.officeCost || 0} دج</strong></span>
                    <span>توصيل للمنزل: <strong class="text-emerald-600">${w.homeCost || 0} دج</strong></span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editWilaya('${w.code}')" class="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl">تعديل</button>
                <button onclick="deleteWilaya('${w.id || w.code}')" class="bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl">حذف</button>
            </div>
        </div>
    `).join('');
}

function saveShippingApiSettings() {
    const key = document.getElementById('shipping-api-key').value.trim();
    const token = document.getElementById('shipping-api-token').value.trim();
    db.collection("settings").doc("main").set({ shippingApiKey: key, shippingApiToken: token }, { merge: true }).then(() => {
        showCustomAlert('تم تفعيل الربط', 'تم حفظ بيانات الـ API بنجاح!', true);
    });
}

function handleSaveBrand(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('brand-name-input');
    if (!input) return;
    const brandName = input.value.trim();
    if (!brandName) return;

    if (typeof brands === 'undefined') brands = [];
    if (!brands.includes(brandName)) brands.push(brandName);

    db.collection("settings").doc("main").set({ brands: brands }, { merge: true }).then(() => {
        input.value = '';
        populateAdminDropdowns();
        showCustomAlert('تم الحفظ', 'تمت إضافة العلامة التجارية بنجاح!', true);
    });
}

function renderBannerTextsList() {
    const container = document.getElementById('banner-texts-list');
    if (!container) return;
    if (!bannerMessages || bannerMessages.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 py-2">لا توجد جمل مضافة للبانر حالياً.</p>';
        return;
    }
    container.innerHTML = bannerMessages.map((msg, idx) => `
        <div class="flex items-center justify-between bg-gray-100 p-3 rounded-xl border text-xs my-1.5">
            <span class="font-bold text-gray-800">${msg}</span>
            <button onclick="removeBannerText(${idx})" class="text-red-500 font-bold px-3 py-1 bg-red-50 rounded-lg">حذف</button>
        </div>
    `).join('');
}

function addBannerText() {
    const input = document.getElementById('new-banner-text');
    if (!input) return;
    const newText = input.value.trim();
    if (!newText) return;

    db.collection("settings").doc("main").update({
        bannerMessages: firebase.firestore.FieldValue.arrayUnion(newText)
    }).then(() => {
        input.value = '';
        showCustomAlert('تمت الإضافة', 'تمت إضافة الجملة للبانر العلوي!', true);
    });
}

function removeBannerText(index) {
    const targetText = bannerMessages[index];
    if (!targetText) return;
    db.collection("settings").doc("main").update({
        bannerMessages: firebase.firestore.FieldValue.arrayRemove(targetText)
    }).then(() => {
        showCustomAlert('تم الحذف', 'تم حذف الجملة بنجاح.', true);
    });
}

function promptDeleteOrder(id) {
    pendingDeleteOrderId = id;
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('confirm-action-btn').onclick = function() { confirmDeleteOrder(); };
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCustomConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    pendingDeleteOrderId = null;
}

function confirmDeleteOrder() {
    if (pendingDeleteOrderId) {
        db.collection("orders").doc(pendingDeleteOrderId).delete().then(() => {
            closeCustomConfirm();
            showCustomAlert('تم الحذف', 'تم حذف الطلبية بنجاح.', true);
        });
    }
}

function updateOrderStatus(id, newStatus) {
    db.collection("orders").doc(id).update({ status: newStatus }).then(() => { renderAdminDashboard(); });
}

function handleSaveSettings(e) {
    if (e) e.preventDefault();
    const settings = {
        name: document.getElementById('set-store-name').value,
        slogan: document.getElementById('set-store-slogan').value,
        logoUrl: document.getElementById('set-logo-url').value,
        msgSuccess: document.getElementById('set-msg-success').value,
        msgWarning: document.getElementById('set-msg-warning').value
    };
    db.collection("settings").doc("main").set(settings, { merge: true }).then(() => {
        showCustomAlert('تم الحفظ', 'تم تحديث كافة الإعدادات والرسائل بنجاح!', true);
    });
}

function handleSaveHeroSlide(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('hero-title-input').value.trim();
    const desc = document.getElementById('hero-desc-input').value.trim();
    const image = document.getElementById('hero-img-input').value.trim();
    if (!title || !desc || !image) return;

    db.collection("heroSlides").add({ title, desc, image, createdAt: new Date() }).then(() => {
        document.getElementById('hero-title-input').value = '';
        document.getElementById('hero-desc-input').value = '';
        document.getElementById('hero-img-input').value = '';
        showCustomAlert('تمت الإضافة', 'تمت إضافة البانر الإعلاني بنجاح!', true);
    });
}

function handleSaveCategory(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('cat-name-input').value.trim();
    const image = document.getElementById('cat-img-input').value.trim();
    if (!name || !image) return;

    db.collection("categories").add({ name, image, createdAt: new Date() }).then(() => {
        document.getElementById('cat-name-input').value = '';
        document.getElementById('cat-img-input').value = '';
        showCustomAlert('تم الحفظ', 'تمت إضافة الفئة الجديدة بنجاح!', true);
    });
}

function updateAdminPasswordSecure() {
    const passwordInput = document.getElementById('new-admin-password');
    if (!passwordInput) return;
    const newPassword = passwordInput.value.trim();

    if (!newPassword || newPassword.length < 6) {
        showCustomAlert('تنبيه أمني', 'يرجى إدخال كلمة مرور جديدة من 6 أحرف أو أرقام على الأقل.', false);
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        showCustomAlert('غير مسجل', 'يجب تسجيل الدخول كمسؤول أولاً لتغيير كلمة المرور.', false);
        return;
    }

    user.updatePassword(newPassword).then(() => {
        passwordInput.value = '';
        showCustomAlert('تم التحديث بنجاح 🎉', 'تم تغيير كلمة مرور الإدارة وتشفيرها في نظام المصادقة.', true);
    }).catch((error) => {
        showCustomAlert('خطأ', 'فشل التحديث: ' + error.message, false);
    });
}

function exportOrdersToExcel() {
    const filterVal = document.getElementById('order-status-filter') ? document.getElementById('order-status-filter').value : 'الجميع';
    let targetOrders = orders;
    
    if (filterVal && filterVal !== 'الجميع') {
        targetOrders = orders.filter(o => (o.status || 'جديد') === filterVal);
    }

    if (!targetOrders || targetOrders.length === 0) {
        showCustomAlert('تنبيه', 'لا توجد طلبيات مطابقة لتصديرها حالياً!', false);
        return;
    }

    let csvContent = "\uFEFFsep=;\r\n";
    csvContent += "اسم الزبون;رقم الهاتف;الولاية;البلدية;المبلغ الإجمالي (دج);حالة الطلب;المنتج\r\n";

    targetOrders.forEach(o => {
        const customer = `"${(o.customer || '').replace(/"/g, '""')}"`;
        const phone = `"=\"${(o.phone || '').replace(/"/g, '""')}\""`;
        const wilaya = `"${(o.wilaya || '').replace(/"/g, '""')}"`;
        const commune = `"${(o.commune || '').replace(/"/g, '""')}"`;
        const total = o.total || 0;
        const status = `"${(o.status || 'جديد').replace(/"/g, '""')}"`;
        const product = `"${(o.product || '').replace(/"/g, '""')}"`;

        csvContent += `${customer};${phone};${wilaya};${commune};${total};${status};${product}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${filterVal}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showCustomAlert('تم التصدير بنجاح 📊', 'تم تحميل ملف الطلبيات بصيغة Excel احترافية.', true);
}

// 🟢 دوال التحديد الجماعي والإدارة
function toggleOrderSelection(id) {
    const index = selectedOrderIds.indexOf(id);
    if (index > -1) {
        selectedOrderIds.splice(index, 1);
    } else {
        selectedOrderIds.push(id);
    }
    updateBulkActionsBar();
}

function toggleSelectAllOrders(source) {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    selectedOrderIds = [];
    
    if (source.checked) {
        checkboxes.forEach(cb => {
            cb.checked = true;
            selectedOrderIds.push(cb.value);
        });
    } else {
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
    }
    updateBulkActionsBar();
}

function updateBulkActionsBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const countSpan = document.getElementById('selected-count');
    
    if (countSpan) countSpan.innerText = selectedOrderIds.length;

    if (bar) {
        if (selectedOrderIds.length > 0) {
            bar.classList.remove('hidden');
        } else {
            bar.classList.add('hidden');
        }
    }
}

function applyBulkStatusChange() {
    const newStatus = document.getElementById('bulk-status-select').value;
    if (!newStatus) {
        showCustomAlert('تنبيه', 'يرجى اختيار الحالة الجديدة أولاً!', false);
        return;
    }
    if (selectedOrderIds.length === 0) return;

    const batch = db.batch();
    selectedOrderIds.forEach(id => {
        const ref = db.collection("orders").doc(id);
        batch.update(ref, { status: newStatus });
    });

    batch.commit().then(() => {
        selectedOrderIds = [];
        updateBulkActionsBar();
        showCustomAlert('تم التحديث بنجاح 🎉', 'تم تغيير حالة الطلبات المحددة دفعة واحدة.', true);
    }).catch(err => {
        showCustomAlert('خطأ', 'تعذر تحديث الحالات: ' + err.message, false);
    });
}

function promptBulkDeleteOrders() {
    if (selectedOrderIds.length === 0) return;
    
    if (confirm(`هل أنت متأكد من رغبتك في حذف ${selectedOrderIds.length} طلبية نهائياً؟`)) {
        const batch = db.batch();
        selectedOrderIds.forEach(id => {
            const ref = db.collection("orders").doc(id);
            batch.delete(ref);
        });

        batch.commit().then(() => {
            selectedOrderIds.forEach(id => {
                const idx = selectedOrderIds.indexOf(id);
                if (idx > -1) selectedOrderIds.splice(idx, 1);
            });
            updateBulkActionsBar();
            showCustomAlert('تم الحذف', 'تم حذف الطلبات المحددة بنجاح.', true);
        }).catch(err => {
            showCustomAlert('خطأ', 'تعذر حذف الطلبات: ' + err.message, false);
        });
    }
}
