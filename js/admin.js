let pendingDeleteOrderId = null;

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

function checkAdminPassword() {
    const passInput = document.getElementById('admin-pass-input');
    if (!passInput) return;
    const pass = passInput.value;
    
    const correctPass = (typeof storeSettings !== 'undefined' && storeSettings.pass) ? storeSettings.pass : 'admin123';

    if (pass === correctPass) {
        document.getElementById('admin-auth-modal').style.display = 'none';
        passInput.value = '';
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

    const activeTab = document.getElementById('admin-tab-' + tabName);
    if (activeTab) activeTab.classList.add('active');

    const btn = document.getElementById('tab-btn-' + tabName);
    if (btn) {
        btn.classList.remove('bg-gray-800', 'text-gray-300');
        btn.classList.add('bg-black', 'text-white');
    }

    if (tabName === 'shipping') {
        renderAdminWilayasList();
    }
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
            brandList.map(b => {
                const bName = (typeof b === 'object' && b !== null) ? (b.name || '') : b;
                return `<option value="${bName}">${bName}</option>`;
            }).join('');
    }

    const brandsListContainer = document.getElementById('admin-brands-list');
    if (brandsListContainer) {
        const brandList = (typeof brands !== 'undefined' && Array.isArray(brands)) ? brands : [];
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

function exportOrdersToExcel() {
    if (!orders || orders.length === 0) {
        showCustomAlert('تنبيه', 'لا توجد طلبيات لتصديرها!', false);
        return;
    }

    const excelData = orders.map(o => ({
        "اسم الزبون": o.customer || '',
        "رقم الهاتف": o.phone || '',
        "الولاية": o.wilaya || '',
        "البلدية": o.commune || '',
        "المنتج": o.product || '',
        "المبلغ الإجمالي (دج)": o.total || 0,
        "حالة الطلب": o.status || 'جديد',
        "التاريخ": o.date || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الطلبيات");
    XLSX.writeFile(workbook, `طلبيات_متجر_كوسمتيك_${new Date().toISOString().slice(0,10)}.xlsx`);
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

    const filterVal = document.getElementById('order-status-filter') ? document.getElementById('order-status-filter').value : 'الجميع';
    let displayedOrders = orders;
    if (filterVal && filterVal !== 'الجميع') {
        displayedOrders = orders.filter(o => (o.status || 'جديد') === filterVal);
    }

    const ordersTbody = document.getElementById('admin-orders-log');
    if (ordersTbody) {
        if (displayedOrders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">لا توجد طلبيات تطابق هذه التصفية</td></tr>';
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
        const img = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/100';
        let badgeInfo = [];
        if (p.skinType) badgeInfo.push(`بشرة: ${p.skinType}`);
        if (p.hairType) badgeInfo.push(`شعر: ${p.hairType}`);
        if (p.colors) badgeInfo.push(`ألوان: ${p.colors}`);
        if (p.numbers) badgeInfo.push(`أرقام: ${p.numbers}`);

        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3"><img src="${img}" class="w-12 h-12 object-contain rounded-lg border bg-black"></td>
                <td class="p-3 font-bold text-xs">${p.name}</td>
                <td class="p-3 text-xs">${p.category || 'عام'}</td>
                <td class="p-3 text-[11px] text-gray-600">${badgeInfo.join(' | ') || 'بدون خصائص'}</td>
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

function addCommunePriceRow(name = '', cost = '') {
    const container = document.getElementById('communes-custom-list');
    if (!container) return;

    const div = document.createElement('div');
    div.className = "flex items-center gap-2 commune-price-row";
    div.innerHTML = `
        <input type="text" placeholder="اسم البلدية (مثال: دار الشيوخ)" value="${name}" class="border p-2.5 rounded-xl text-xs flex-1 commune-name-input" required>
        <input type="number" placeholder="سعر التوصيل (دج) (مثال: 500)" value="${cost}" class="border p-2.5 rounded-xl text-xs w-36 commune-cost-input" required>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 font-bold p-2"><i class="fa-solid fa-trash-can"></i></button>
    `;
    container.appendChild(div);
}

function handleSaveWilaya(e) {
    if (e) e.preventDefault();
    const code = document.getElementById('wilaya-code').value.trim();
    const name = document.getElementById('wilaya-name').value.trim();
    const officeCost = parseFloat(document.getElementById('wilaya-office-cost').value) || 0;

    const rows = document.querySelectorAll('.commune-price-row');
    const communesData = [];

    rows.forEach(r => {
        const cName = r.querySelector('.commune-name-input').value.trim();
        const cCost = parseFloat(r.querySelector('.commune-cost-input').value) || 0;
        if (cName) {
            communesData.push({ name: cName, cost: cCost });
        }
    });

    if (!code || !name) {
        showCustomAlert('تنبيه', 'يرجى إدخال رمز واسم الولاية!', false);
        return;
    }

    const wilayaPayload = {
        code: code,
        name: name,
        officeCost: officeCost,
        communesData: communesData
    };

    db.collection("wilayas").doc(code).set(wilayaPayload).then(() => {
        resetWilayaForm();
        renderAdminWilayasList();
        showCustomAlert('تم الحفظ 🎉', 'تم حفظ بيانات التسعير والبلديات للولاية بنجاح!', true);
    }).catch(err => {
        showCustomAlert('خطأ', 'حدث خطأ أثناء حفظ بيانات الولاية: ' + err.message, false);
    });
}

function resetWilayaForm() {
    const form = document.getElementById('wilaya-edit-form');
    if (form) form.reset();
    document.getElementById('editing-wilaya-id').value = '';
    document.getElementById('communes-custom-list').innerHTML = '';
    document.getElementById('wilaya-form-title').innerText = 'إضافة / تعديل ولاية بأسعار تفصيلية للمكتب والبلديات';
    document.getElementById('cancel-wilaya-edit-btn').classList.add('hidden');
    document.getElementById('save-wilaya-btn').innerText = 'حفظ بيانات الولاية والتسعير التفصيلي';
}

function editWilaya(code) {
    const w = WILAYAS.find(wil => wil.code === code);
    if (!w) return;

    document.getElementById('editing-wilaya-id').value = w.code;
    document.getElementById('wilaya-code').value = w.code || '';
    document.getElementById('wilaya-name').value = w.name || '';
    document.getElementById('wilaya-office-cost').value = w.officeCost || '';

    const communesContainer = document.getElementById('communes-custom-list');
    communesContainer.innerHTML = '';

    const list = w.communesData || [];
    list.forEach(c => {
        addCommunePriceRow(c.name, c.cost);
    });

    document.getElementById('wilaya-form-title').innerText = 'تعديل ولاية: ' + w.name;
    document.getElementById('cancel-wilaya-edit-btn').classList.remove('hidden');
    document.getElementById('save-wilaya-btn').innerText = 'تحديث التغييرات';

    window.scrollTo({ top: document.getElementById('wilaya-edit-form').offsetTop - 100, behavior: 'smooth' });
}

function deleteWilaya(code) {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذه الولاية نهائياً؟')) {
        db.collection("wilayas").doc(code).delete().then(() => {
            renderAdminWilayasList();
            showCustomAlert('تم الحذف', 'تم حذف الولاية بنجاح.', true);
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

    container.innerHTML = WILAYAS.map(w => {
        const communesList = w.communesData || [];
        return `
            <div class="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-sm my-2">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="bg-[#B8860B] text-white font-bold px-2 py-0.5 rounded-lg text-[10px]">${w.code}</span>
                        <h4 class="font-bold text-sm text-gray-900">${w.name}</h4>
                        <span class="text-gray-500 font-bold">(المكتب: ${w.officeCost || 0} دج)</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5 mt-2">
                        ${communesList.length > 0 ? communesList.map(c => `
                            <span class="bg-white border text-gray-700 px-2 py-0.5 rounded-md text-[11px]">
                                ${c.name}: <strong class="text-[#B8860B]">${c.cost} دج</strong>
                            </span>
                        `).join('') : '<span class="text-gray-400">لا توجد بلديات مفصلة</span>'}
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="editWilaya('${w.code}')" class="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl hover:bg-blue-200 transition">تعديل</button>
                    <button onclick="deleteWilaya('${w.code}')" class="bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl hover:bg-red-200 transition">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function saveShippingApiSettings() {
    const key = document.getElementById('shipping-api-key').value.trim();
    const token = document.getElementById('shipping-api-token').value.trim();

    db.collection("settings").doc("main").set({
        shippingApiKey: key,
        shippingApiToken: token
    }, { merge: true }).then(() => {
        showCustomAlert('تم تفعيل الربط', 'تم حفظ بيانات الـ API لشركة التوصيل المحددة بنجاح!', true);
    });
}

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

// دالة حفظ المنتج المصححة بالكامل
function handleSaveProduct(e) {
    if (e) e.preventDefault();

    try {
        const editId = document.getElementById('editing-product-id') ? document.getElementById('editing-product-id').value : '';
        const nameInput = document.getElementById('prod-name');
        const priceInput = document.getElementById('prod-price');
        const catSelect = document.getElementById('prod-category-select');
        const img1Input = document.getElementById('prod-img-main');

        if (!nameInput || !priceInput || !catSelect || !img1Input) {
            showCustomAlert('خطأ', 'تعذر العثور على حقول الإدخال الأساسية!', false);
            return;
        }

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value) || 0;
        const oldPriceVal = document.getElementById('prod-old-price') ? document.getElementById('prod-old-price').value : '';
        const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;
        const category = catSelect.value;
        const brand = document.getElementById('prod-brand-select') ? document.getElementById('prod-brand-select').value : '';
        const inStock = document.getElementById('prod-in-stock') ? (document.getElementById('prod-in-stock').value === 'true') : true;

        const skinType = document.getElementById('prod-skin-type') ? document.getElementById('prod-skin-type').value : '';
        const hairType = document.getElementById('prod-hair-type') ? document.getElementById('prod-hair-type').value : '';
        const colors = document.getElementById('prod-colors') ? document.getElementById('prod-colors').value.trim() : '';
        const numbers = document.getElementById('prod-numbers') ? document.getElementById('prod-numbers').value.trim() : '';

        const hasCountdownCheckbox = document.getElementById('prod-has-countdown');
        const hasCountdown = hasCountdownCheckbox ? hasCountdownCheckbox.checked : false;
        const countdownHoursVal = document.getElementById('prod-countdown-hours') ? document.getElementById('prod-countdown-hours').value : '';
        const countdownHours = countdownHoursVal ? parseFloat(countdownHoursVal) : 0;
        const desc = document.getElementById('prod-desc') ? document.getElementById('prod-desc').value.trim() : '';

        const img1 = img1Input.value.trim();
        const img2 = document.getElementById('prod-img-2') ? document.getElementById('prod-img-2').value.trim() : '';
        const img3 = document.getElementById('prod-img-3') ? document.getElementById('prod-img-3').value.trim() : '';

        if (!name || !price || !category || !img1) {
            showCustomAlert('تنبيه', 'يرجى ملء كافة الخانات الإجبارية (اسم المنتج، السعر، الفئة، والصورة الرئيسية)!', false);
            return;
        }

        const images = [img1, img2, img3].filter(img => img && img.length > 0);

        const productData = {
            name: name,
            price: price,
            oldPrice: oldPrice,
            category: category,
            brand: brand,
            inStock: inStock,
            skinType: skinType,
            hairType: hairType,
            colors: colors,
            numbers: numbers,
            hasCountdown: hasCountdown,
            countdownHours: countdownHours,
            desc: desc,
            images: images,
            updatedAt: new Date()
        };

        const saveBtn = document.getElementById('save-product-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerText = 'جاري الحفظ... ⏳';
        }

        if (editId) {
            db.collection("products").doc(editId).update(productData).then(() => {
                resetProductForm();
                showCustomAlert('تم التحديث 🎉', 'تم تحديث بيانات المنتج بنجاح!', true);
            }).catch(err => {
                showCustomAlert('خطأ', 'حدث خطأ أثناء التحديث: ' + err.message, false);
            }).finally(() => {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerText = 'تحديث بيانات المنتج';
                }
            });
        } else {
            db.collection("products").add({
                ...productData,
                createdAt: new Date()
            }).then(() => {
                resetProductForm();
                showCustomAlert('تم الحفظ 🎉', 'تم إضافة المنتج الجديد بنجاح!', true);
            }).catch(err => {
                showCustomAlert('خطأ', 'حدث خطأ أثناء حفظ المنتج: ' + err.message, false);
            }).finally(() => {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerText = 'حفظ المنتج';
                }
            });
        }
    } catch (err) {
        showCustomAlert('خطأ في البيانات', 'يرجى التأكد من ملء الحقول بالشكل الصحيح: ' + err.message, false);
    }
}

function resetProductForm() {
    const form = document.getElementById('product-edit-form');
    if (form) form.reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج (مع خصائص البشرة، الشعر، الألوان والأرقام)';
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
    
    document.getElementById('prod-skin-type').value = p.skinType || '';
    document.getElementById('prod-hair-type').value = p.hairType || '';
    document.getElementById('prod-colors').value = p.colors || '';
    document.getElementById('prod-numbers').value = p.numbers || '';

    document.getElementById('prod-has-countdown').checked = p.hasCountdown || false;
    document.getElementById('prod-countdown-hours').value = p.countdownHours || '';
    document.getElementById('prod-desc').value = p.desc || '';

    const imgs = p.images || [];
    document.getElementById('prod-img-main').value = imgs[0] || '';
    document.getElementById('prod-img-2').value = imgs[1] || '';
    document.getElementById('prod-img-3').value = imgs[2] || '';

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

function handleSaveHeroSlide(e) {
    if (e) e.preventDefault();
    const title = document.getElementById('hero-title-input').value.trim();
    const desc = document.getElementById('hero-desc-input').value.trim();
    const image = document.getElementById('hero-img-input').value.trim();

    if (!title || !desc || !image) {
        showCustomAlert('تنبيه', 'يرجى ملء كافة خانات الإعلان!', false);
        return;
    }

    db.collection("heroSlides").add({
        title: title,
        desc: desc,
        image: image,
        createdAt: new Date()
    }).then(() => {
        document.getElementById('hero-title-input').value = '';
        document.getElementById('hero-desc-input').value = '';
        document.getElementById('hero-img-input').value = '';
        showCustomAlert('تمت الإضافة', 'تمت إضافة البانر الإعلاني بنجاح!', true);
    }).catch(err => {
        showCustomAlert('خطأ', 'حدث خطأ أثناء حفظ البانر: ' + err.message, false);
    });
}

function handleSaveCategory(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('cat-name-input').value.trim();
    const image = document.getElementById('cat-img-input').value.trim();

    if (!name || !image) {
        showCustomAlert('تنبيه', 'يرجى إدخال اسم الفئة ورابط الصورة!', false);
        return;
    }

    db.collection("categories").add({
        name: name,
        image: image,
        createdAt: new Date()
    }).then(() => {
        document.getElementById('cat-name-input').value = '';
        document.getElementById('cat-img-input').value = '';
        showCustomAlert('تم الحفظ', 'تمت إضافة الفئة الجديدة بنجاح!', true);
    }).catch(err => {
        showCustomAlert('خطأ', 'حدث خطأ أثناء حفظ الفئة: ' + err.message, false);
    });
}
