let logoClickCount = 0;
let logoClickTimer = null;
let pendingDeleteOrderId = null;

// معالجة وضغط الصور المرفوعة من الجهاز
function handleImageUpload(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;

    if (typeof showCustomAlert === 'function') {
        showCustomAlert('جاري المعالجة...', 'جاري تحضير الصورة وضغطها للعرض السريع.', true);
    }

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

            if (typeof showCustomAlert === 'function') {
                showCustomAlert('تم الرفع بنجاح! 📸', 'تم إدراج الصورة المرفوعة بنجاح في الحقل.', true);
            }
        };
    };
    reader.readAsDataURL(file);
}

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
        showCustomAlert('خطأ', 'كلمة المرور غير صحيحة!', false);
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
    if (btn) {
        btn.classList.remove('bg-gray-800', 'text-gray-300');
        btn.classList.add('bg-black', 'text-white');
    }
}

// تحديث وتعبئة الخيارات والبيانات في لوحة التحكم
function populateAdminDropdowns() {
    // تعبئة قائمة الأقسام في نموذج المنتج
    const catSelect = document.getElementById('prod-category-select');
    if (catSelect) {
        catSelect.innerHTML = '<option value="">-- اختر الفئة / القسم * --</option>' + 
            categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }

    // تعبئة قائمة الماركات في نموذج المنتج
    const brandSelect = document.getElementById('prod-brand-select');
    if (brandSelect) {
        const brandList = (typeof brands !== 'undefined' && brands.length > 0) ? brands : ["Dior", "Chanel", "Gucci", "Versace", "عام"];
        brandSelect.innerHTML = '<option value="">-- اختر العلامة التجارية (الماركة) --</option>' + 
            brandList.map(b => `<option value="${typeof b === 'object' ? b.name : b}">${typeof b === 'object' ? b.name : b}</option>`).join('');
    }

    // عرض قائمة الماركات المتاحة حالياً
    const brandsListContainer = document.getElementById('admin-brands-list');
    if (brandsListContainer) {
        const brandList = (typeof brands !== 'undefined' && brands.length > 0) ? brands : [];
        if (brandList.length === 0) {
            brandsListContainer.innerHTML = '<p class="text-xs text-gray-400 col-span-full">لا توجد ماركات مضافة بعد.</p>';
        } else {
            brandsListContainer.innerHTML = brandList.map((b, idx) => `
                <div class="flex items-center justify-between bg-gray-100 p-3 rounded-xl border text-xs font-bold">
                    <span>${typeof b === 'object' ? b.name : b}</span>
                    <button onclick="deleteBrand(${idx})" class="text-red-500 hover:text-red-700">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `).join('');
        }
    }
}

function renderAdminDashboard() {
    const confirmedOrders = orders.filter(o => o.status === 'مكتملاً' || o.status === 'مؤكد' || !o.status);
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedCount = orders.filter(o => o.status === 'مكتملاً').length;
    const successRate = orders.length ? Math.round((completedCount / orders.length) * 100) : 0;

    if (document.getElementById('stat-total-sales')) document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    if (document.getElementById('stat-orders-count')) document.getElementById('stat-orders-count').innerText = orders.length;
    if (document.getElementById('stat-avg-order')) document.getElementById('stat-avg-order').innerText = confirmedOrders.length ? Math.round(totalSales / confirmedOrders.length).toLocaleString() + ' دج' : '0 دج';
    if (document.getElementById('stat-success-rate')) document.getElementById('stat-success-rate').innerText = successRate + '%';
    if (document.getElementById('orders-badge-count')) document.getElementById('orders-badge-count').innerText = orders.length;

    const ordersTbody = document.getElementById('admin-orders-log');
    if (ordersTbody) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">لا توجد طلبيات مسجلة بعد</td></tr>';
        } else {
            ordersTbody.innerHTML = orders.map(o => {
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
                                <option value="جديد" ${status === 'جديد' ? 'selected' : ''}>🟡 جديد (قيد الانتظار)</option>
                                <option value="مؤكد" ${status === 'مؤكد' ? 'selected' : ''}>🔵 تم التأكيد هاتفياً</option>
                                <option value="قيد الشحن" ${status === 'قيد الشحن' ? 'selected' : ''}>🟣 قيد الشحن</option>
                                <option value="مكتملاً" ${status === 'مكتملاً' ? 'selected' : ''}>🟢 تم التسليم والمبلغ</option>
                                <option value="ملغى" ${status === 'ملغى' ? 'selected' : ''}>🔴 ملغى</option>
                            </select>
                        </td>
                        <td class="p-3 flex items-center gap-2">
                            <a href="tel:${o.phone}" class="bg-green-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1">
                                📞 اتصال
                            </a>
                            <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-600 flex items-center gap-1">
                                💬 واتساب
                            </a>
                            <button onclick="promptDeleteOrder('${o.id}')" class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-red-200">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    if (document.getElementById('set-store-name')) {
        document.getElementById('set-store-name').value = storeSettings.name || '';
        document.getElementById('set-store-slogan').value = storeSettings.slogan || '';
        document.getElementById('set-logo-url').value = storeSettings.logoUrl || '';
        document.getElementById('set-pass').value = storeSettings.pass || 'admin123';
        document.getElementById('set-msg-success').value = storeSettings.msgSuccess || '';
        document.getElementById('set-msg-warning').value = storeSettings.msgWarning || '';
    }

    renderAdminProductsTable();
    populateAdminDropdowns();
    renderBannerTextsList();
}

// عرض جدول المنتجات في لوحة التحكم
function renderAdminProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد منتجات مسجلة بعد</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => {
        const img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/100';
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3"><img src="${img}" class="w-12 h-12 object-contain rounded-lg border bg-black"></td>
                <td class="p-3 font-bold text-xs">${p.name}</td>
                <td class="p-3 text-xs">${p.category || 'عام'}</td>
                <td class="p-3 text-xs">${p.brand || 'بدون'}</td>
                <td class="p-3 font-black text-xs text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
                <td class="p-3 text-xs"><span class="${p.inStock ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}">${p.inStock ? 'متوفر 🟢' : 'غير متوفر 🔴'}</span></td>
                <td class="p-3 flex items-center gap-2">
                    <button onclick="editProduct('${p.id}')" class="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-lg">تعديل</button>
                    <button onclick="deleteProduct('${p.id}')" class="bg-red-100 text-red-600 font-bold text-xs px-2.5 py-1 rounded-lg">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

// دالة حفظ الماركة بدون خروج من اللوحة
function handleSaveBrand(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('brand-name-input');
    if (!input) return;

    const brandName = input.value.trim();
    if (!brandName) {
        showCustomAlert('تنبيه', 'يرجى إدخال اسم العلامة التجارية!', false);
        return;
    }

    if (typeof brands === 'undefined') brands = [];
    if (!brands.includes(brandName)) {
        brands.push(brandName);
    }

    db.collection("settings").doc("main").set({
        brands: brands
    }, { merge: true }).then(() => {
        input.value = '';
        populateAdminDropdowns();
        showCustomAlert('تم الحفظ', 'تمت إضافة العلامة التجارية بنجاح!', true);
    }).catch(err => {
        showCustomAlert('خطأ', 'حدث خطأ أثناء الحفظ: ' + err.message, false);
    });
}

// دالة حذف الماركة
function deleteBrand(index) {
    if (typeof brands !== 'undefined' && brands[index]) {
        brands.splice(index, 1);
        db.collection("settings").doc("main").set({
            brands: brands
        }, { merge: true }).then(() => {
            populateAdminDropdowns();
            showCustomAlert('تم الحذف', 'تم حذف العلامة التجارية.', true);
        });
    }
}

// دالة حفظ المنتج بدون خروج من لوحة التحكم
function handleSaveProduct(e) {
    if (e) e.preventDefault();

    const editId = document.getElementById('editing-product-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value) || 0;
    const oldPrice = parseFloat(document.getElementById('prod-old-price').value) || null;
    const category = document.getElementById('prod-category-select').value;
    const brand = document.getElementById('prod-brand-select').value;
    const inStock = document.getElementById('prod-in-stock').value === 'true';
    const desc = document.getElementById('prod-desc').value.trim();

    const img1 = document.getElementById('prod-img-main').value.trim();
    const img2 = document.getElementById('prod-img-2').value.trim();
    const img3 = document.getElementById('prod-img-3').value.trim();
    const img4 = document.getElementById('prod-img-4').value.trim();
    const img5 = document.getElementById('prod-img-5').value.trim();

    if (!name || !price || !category || !img1) {
        showCustomAlert('تنبيه', 'يرجى ملء كافة الخانات الإجبارية (الاسم، السعر، الفئة، والصورة الرئيسية)!', false);
        return;
    }

    const images = [img1, img2, img3, img4, img5].filter(img => img.length > 0);

    const productData = {
        name: name,
        price: price,
        oldPrice: oldPrice,
        category: category,
        brand: brand,
        inStock: inStock,
        desc: desc,
        images: images,
        updatedAt: new Date()
    };

    if (editId) {
        db.collection("products").doc(editId).update(productData).then(() => {
            resetProductForm();
            showCustomAlert('تم التحديث 🎉', 'تم تحديث بيانات المنتج بنجاح!', true);
        });
    } else {
        db.collection("products").add({
            ...productData,
            createdAt: new Date()
        }).then(() => {
            resetProductForm();
            showCustomAlert('تم الحفظ 🎉', 'تم إضافة المنتج الجديد بنجاح!', true);
        });
    }
}

function resetProductForm() {
    document.getElementById('product-edit-form').reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج (مع رفع الصور من الجهاز أو الرابط)';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    document.getElementById('save-product-btn').innerText = 'حفظ المنتج';
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

    const imgs = p.images || [];
    document.getElementById('prod-img-main').value = imgs[0] || '';
    document.getElementById('prod-img-2').value = imgs[1] || '';
    document.getElementById('prod-img-3').value = imgs[2] || '';
    document.getElementById('prod-img-4').value = imgs[3] || '';
    document.getElementById('prod-img-5').value = imgs[4] || '';

    document.getElementById('product-form-title').innerText = 'تعديل المنتج: ' + p.name;
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    document.getElementById('save-product-btn').innerText = 'تحديث بيانات المنتج';

    window.scrollTo({ top: document.getElementById('product-edit-form').offsetTop - 100, behavior: 'smooth' });
}

function deleteProduct(id) {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج؟')) {
        db.collection("products").doc(id).delete().then(() => {
            showCustomAlert('تم الحذف', 'تم حذف المنتج بنجاح.', true);
        });
    }
}

function renderBannerTextsList() {
    const container = document.getElementById('banner-texts-list');
    if (!container) return;

    if (!bannerMessages || bannerMessages.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 py-2">لا توجد جمل مضافة للبانر حالياً.</p>';
        return;
    }

    container.innerHTML = bannerMessages.map((msg, idx) => `
        <div class="flex items-center justify-between bg-gray-100 p-3 rounded-xl border border-gray-200 text-xs my-1.5">
            <span class="font-bold text-gray-800">${msg}</span>
            <button onclick="removeBannerText(${idx})" class="text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 rounded-lg border border-red-200 transition">
                <i class="fa-solid fa-trash-can"></i> حذف
            </button>
        </div>
    `).join('');
}

function addBannerText() {
    const input = document.getElementById('new-banner-text');
    if (!input) return;

    const newText = input.value.trim();
    if (!newText) {
        showCustomAlert('تنبيه', 'يرجى كتابة النص المراد إضافته للبانر العلوي!', false);
        return;
    }

    db.collection("settings").doc("main").update({
        bannerMessages: firebase.firestore.FieldValue.arrayUnion(newText)
    }).then(() => {
        input.value = '';
        showCustomAlert('تمت الإضافة', 'تمت إضافة الجملة للبانر العلوي ومزامنتها على كافة الأجهزة!', true);
    }).catch(() => {
        db.collection("settings").doc("main").set({
            bannerMessages: [newText]
        }, { merge: true });
    });
}

function removeBannerText(index) {
    const targetText = bannerMessages[index];
    if (!targetText) return;

    db.collection("settings").doc("main").update({
        bannerMessages: firebase.firestore.FieldValue.arrayRemove(targetText)
    }).then(() => {
        showCustomAlert('تم الحذف', 'تم حذف الجملة ومزامنتها فوراً.', true);
    });
}

function promptDeleteOrder(id) {
    pendingDeleteOrderId = id;
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('confirm-action-btn').onclick = function() {
        confirmDeleteOrder();
    };
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
    db.collection("orders").doc(id).update({ status: newStatus }).then(() => {
        renderAdminDashboard();
    });
}

function handleSaveSettings(e) {
    if (e) e.preventDefault();
    const settings = {
        name: document.getElementById('set-store-name').value,
        slogan: document.getElementById('set-store-slogan').value,
        logoUrl: document.getElementById('set-logo-url').value,
        pass: document.getElementById('set-pass').value,
        msgSuccess: document.getElementById('set-msg-success').value,
        msgWarning: document.getElementById('set-msg-warning').value
    };

    db.collection("settings").doc("main").set(settings, { merge: true }).then(() => {
        showCustomAlert('تم الحفظ', 'تم تحديث كافة الإعدادات والرسائل المخصصة بنجاح!', true);
    });
}
