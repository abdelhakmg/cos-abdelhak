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

// دالة التحقق من كلمة السر وإظهار لوحة التحكم مباشرة
function checkAdminPassword() {
    const passInput = document.getElementById('admin-pass-input');
    if (!passInput) return;
    const pass = passInput.value.trim();
    const correctPass = (typeof storeSettings !== 'undefined' && storeSettings.pass) ? storeSettings.pass : 'admin123';

    if (pass === correctPass) {
        const authModal = document.getElementById('admin-auth-modal');
        if (authModal) {
            authModal.style.display = 'none';
            authModal.classList.add('hidden');
            authModal.classList.remove('flex');
        }
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
    } else if (selectedCategory.includes('بلاكيور') || selectedCategory.includes('اصي')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">💍 خصائص قسم بلاكيور + أسي:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع المعدن *</label>
                        <select id="prod-jewelry-metal" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="بلاكيور أور">بلاكيور أور</option>
                            <option value="أسي إينوكسيدابل / Steel">أسي إينوكسيدابل / Steel</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع القطعة *</label>
                        <select id="prod-jewelry-type" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="سلسلة">سلسلة</option>
                            <option value="خاتم">خاتم</option>
                            <option value="قورمات">قورمات</option>
                            <option value="بارور">بارور</option>
                            <option value="مناقش">مناقش</option>
                            <option value="خلخال">خلخال</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    } else if (selectedCategory === 'علب' || selectedCategory.includes('علب')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🎁 خصائص قسم العلب:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">شكل ومادة الصندوق *</label>
                    <select id="prod-giftbox-shape" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="شكل قلب">شكل قلب</option>
                        <option value="شكل مربع">شكل مربع</option>
                        <option value="شكل مستطيل">شكل مستطيل</option>
                        <option value="شكل رسالة">شكل رسالة</option>
                        <option value="شكل دائري">شكل دائري</option>
                        <option value="علب فوركس">علب فوركس</option>
                        <option value="علب زجاج">علب زجاج</option>
                        <option value="صاك كرتون">صاك كرتون</option>
                        <option value="صاك شفاف">صاك شفاف</option>
                        <option value="PMMA">PMMA</option>
                    </select>
                </div>
            </div>
        `;
    } else if (selectedCategory.includes('مايكاب')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">💄 خصائص قسم المايكاب:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع منتج المايكاب *</label>
                        <select id="prod-makeup-type" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="فوندوتان">فوندوتان</option>
                            <option value="كونسيلر">كونسيلر</option>
                            <option value="ماسكارا">ماسكارا</option>
                            <option value="طراسور">طراسور</option>
                            <option value="روج لافر">روج لافر</option>
                            <option value="قلوص">قلوص</option>
                            <option value="هايلايتر">هايلايتر</option>
                            <option value="كونتور">كونتور</option>
                            <option value="بالات">بالات</option>
                            <option value="برايمر">برايمر</option>
                            <option value="ليوناغ">ليوناغ</option>
                            <option value="فرشاة">فرشاة</option>
                            <option value="بونجة">بونجة</option>
                            <option value="آلات">آلات</option>
                            <option value="أشفار">أشفار</option>
                            <option value="أظافر">أظافر</option>
                            <option value="لسقة أشفار">لسقة أشفار</option>
                            <option value="لسقة أظافر">لسقة أظافر</option>
                            <option value="فلامينغو">فلامينغو</option>
                            <option value="فارني">فارني</option>
                            <option value="أخرى">أخرى</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-2">نوع البشرة المناسبة:</label>
                        <div id="admin-prod-skin-checkboxes" class="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border max-h-28 overflow-y-auto text-xs"></div>
                    </div>
                </div>
            </div>
        `;
    } else if (selectedCategory.includes('عطور')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🌸 خصائص قسم العطور:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">فئة العطر والاستخدام *</label>
                    <select id="prod-perfume-target" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="نساء">نساء</option>
                        <option value="رجال">رجال</option>
                        <option value="أطفال">أطفال</option>
                        <option value="للجنسين">للجنسين</option>
                        <option value="عطور جسم">عطور جسم</option>
                        <option value="عطور غرف">عطور غرف</option>
                        <option value="عطور ملابس">عطور ملابس</option>
                        <option value="عطور سيارات">عطور سيارات</option>
                    </select>
                </div>
            </div>
        `;
    } else if (selectedCategory.includes('اكسسوارات شعر')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🎀 خصائص قسم إكسسوارات الشعر:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">نوع الإكسسوار *</label>
                    <select id="prod-hairacc-type" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="مساك">مساك</option>
                        <option value="شوشو">شوشو</option>
                        <option value="كخاب">كخاب</option>
                        <option value="بوندانة">بوندانة</option>
                        <option value="سيغتات">سيغتات</option>
                        <option value="مناقش">مناقش</option>
                        <option value="سنسلة">سنسلة</option>
                        <option value="خاتم">خاتم</option>
                        <option value="قورمات">قورمات</option>
                        <option value="خلخال">خلخال</option>
                    </select>
                </div>
            </div>
        `;
    } else if (selectedCategory === 'هدايا' || selectedCategory.includes('هدايا')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🎁 خصائص قسم الهدايا:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">نوع ومناسبة الهدية *</label>
                    <select id="prod-gift-occasion" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="رجالية">رجالية</option>
                        <option value="نسائية">نسائية</option>
                        <option value="بوكي ورد">بوكي ورد</option>
                        <option value="بيبي">بيبي</option>
                        <option value="تغليف">تغليف</option>
                    </select>
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
        const editId = document.getElementById('editing-product-id') ? document.getElementById('editing-product-id').value : '';
        const nameInput = document.getElementById('prod-name');
        const priceInput = document.getElementById('prod-price');
        const catSelect = document.getElementById('prod-category-select');
        const img1Input = document.getElementById('prod-img-main');

        if (!nameInput || !priceInput || !catSelect || !img1Input) return;

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value) || 0;
        const oldPriceVal = document.getElementById('prod-old-price') ? document.getElementById('prod-old-price').value : '';
        const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;
        const category = catSelect.value;
        const brand = document.getElementById('prod-brand-select') ? document.getElementById('prod-brand-select').value : '';
        const inStock = document.getElementById('prod-in-stock') ? (document.getElementById('prod-in-stock').value === 'true') : true;

        const selectedSkins = Array.from(document.querySelectorAll('.prod-skin-cb:checked')).map(cb => cb.value);
        const selectedHairs = Array.from(document.querySelectorAll('.prod-hair-cb:checked')).map(cb => cb.value);

        const cosmeticArea = document.getElementById('prod-cosmetic-area')?.value || '';
        const cosmeticType = document.getElementById('prod-cosmetic-type')?.value || '';
        const jewelryMetal = document.getElementById('prod-jewelry-metal')?.value || '';
        const jewelryType = document.getElementById('prod-jewelry-type')?.value || '';
        const giftboxShape = document.getElementById('prod-giftbox-shape')?.value || '';
        const makeupType = document.getElementById('prod-makeup-type')?.value || '';
        const perfumeTarget = document.getElementById('prod-perfume-target')?.value || '';
        const hairaccType = document.getElementById('prod-hairacc-type')?.value || '';
        const giftOccasion = document.getElementById('prod-gift-occasion')?.value || '';

        const colors = document.getElementById('prod-colors') ? document.getElementById('prod-colors').value.trim() : '';
        const numbers = document.getElementById('prod-numbers') ? document.getElementById('prod-numbers').value.trim() : '';

        const desc = document.getElementById('prod-desc') ? document.getElementById('prod-desc').value.trim() : '';
        const img1 = img1Input.value.trim();
        const img2 = document.getElementById('prod-img-2') ? document.getElementById('prod-img-2').value.trim() : '';
        const img3 = document.getElementById('prod-img-3') ? document.getElementById('prod-img-3').value.trim() : '';

        if (!name || !price || !category || !img1) {
            showCustomAlert('تنبيه', 'يرجى ملء كافة الخانات الإجبارية!', false);
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
            skinTypes: selectedSkins,
            hairTypes: selectedHairs,
            cosmeticArea: cosmeticArea,
            cosmeticType: cosmeticType,
            jewelryMetal: jewelryMetal,
            jewelryType: jewelryType,
            giftboxShape: giftboxShape,
            makeupType: makeupType,
            perfumeTarget: perfumeTarget,
            hairaccType: hairaccType,
            giftOccasion: giftOccasion,
            colors: colors,
            numbers: numbers,
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
            }).finally(() => {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerText = 'تحديث بيانات المنتج';
                }
            });
        } else {
            db.collection("products").add({ ...productData, createdAt: new Date() }).then(() => {
                resetProductForm();
                showCustomAlert('تم الحفظ 🎉', 'تم إضافة المنتج الجديد بنجاح!', true);
            }).finally(() => {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerText = 'حفظ المنتج';
                }
            });
        }
    } catch (err) {
        showCustomAlert('خطأ', 'تعذر الحفظ: ' + err.message, false);
    }
}

function resetProductForm() {
    const form = document.getElementById('product-edit-form');
    if (form) form.reset();
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج (مع التحديد الديناميكي لكل قسم)';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    document.getElementById('save-product-btn').innerText = 'حفظ المنتج';
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
    document.getElementById('prod-in-stock').value = p.inStock ? 'true' : 'false';

    renderCategorySpecificAdminFields();

    if (document.getElementById('prod-cosmetic-area')) document.getElementById('prod-cosmetic-area').value = p.cosmeticArea || 'للوجه';
    if (document.getElementById('prod-cosmetic-type')) document.getElementById('prod-cosmetic-type').value = p.cosmeticType || '';
    if (document.getElementById('prod-jewelry-metal')) document.getElementById('prod-jewelry-metal').value = p.jewelryMetal || 'بلاكيور أور';
    if (document.getElementById('prod-jewelry-type')) document.getElementById('prod-jewelry-type').value = p.jewelryType || 'سلسلة';
    if (document.getElementById('prod-giftbox-shape')) document.getElementById('prod-giftbox-shape').value = p.giftboxShape || 'شكل قلب';
    if (document.getElementById('prod-makeup-type')) document.getElementById('prod-makeup-type').value = p.makeupType || 'فوندوتان';
    if (document.getElementById('prod-perfume-target')) document.getElementById('prod-perfume-target').value = p.perfumeTarget || 'نساء';
    if (document.getElementById('prod-hairacc-type')) document.getElementById('prod-hairacc-type').value = p.hairaccType || 'مساك';
    if (document.getElementById('prod-gift-occasion')) document.getElementById('prod-gift-occasion').value = p.giftOccasion || 'رجالية';

    const pSkins = Array.isArray(p.skinTypes) ? p.skinTypes : (p.skinType ? [p.skinType] : []);
    document.querySelectorAll('.prod-skin-cb').forEach(cb => { cb.checked = pSkins.includes(cb.value); });

    const pHairs = Array.isArray(p.hairTypes) ? p.hairTypes : (p.hairType ? [p.hairType] : []);
    document.querySelectorAll('.prod-hair-cb').forEach(cb => { cb.checked = pHairs.includes(cb.value); });

    document.getElementById('prod-colors').value = p.colors || '';
    document.getElementById('prod-numbers').value = p.numbers || '';
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
                                <option value="جديد" ${status === 'جديد' ? 'selected' : ''}>🟡 جديد</option>
                                <option value="مؤكد" ${status === 'مؤكد' ? 'selected' : ''}>🔵 مؤكد</option>
                                <option value="قيد الشحن" ${status === 'قيد الشحن' ? 'selected' : ''}>🟣 شحن</option>
                                <option value="مكتملاً" ${status === 'مكتملاً' ? 'selected' : ''}>🟢 تم التسليم</option>
                                <option value="ملغى" ${status === 'ملغى' ? 'selected' : ''}>🔴 ملغى</option>
                            </select>
                        </td>
                        <td class="p-3 flex items-center gap-2">
                            <a href="tel:${o.phone}" class="bg-green-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-green-700">📞</a>
                            <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-600">💬</a>
                            <button onclick="promptDeleteOrder('${o.id}')" class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-red-200">🗑️</button>
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
        let badgeInfo = [];
        
        if (p.jewelryMetal || p.jewelryType) badgeInfo.push(`${p.jewelryMetal || ''} ${p.jewelryType || ''}`);
        if (p.giftboxShape) badgeInfo.push(`شكل: ${p.giftboxShape}`);
        if (p.makeupType) badgeInfo.push(`مايكاب: ${p.makeupType}`);
        if (p.perfumeTarget) badgeInfo.push(`عطر: ${p.perfumeTarget}`);
        if (p.hairaccType) badgeInfo.push(`إكسسوار: ${p.hairaccType}`);
        if (p.giftOccasion) badgeInfo.push(`هدية: ${p.giftOccasion}`);

        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3"><img src="${img}" class="w-12 h-12 object-contain rounded-lg border bg-black"></td>
                <td class="p-3 font-bold text-xs">${p.name}</td>
                <td class="p-3 text-xs">${p.category || 'عام'}</td>
                <td class="p-3 text-[11px] text-gray-600 max-w-xs leading-relaxed">${badgeInfo.join(' | ') || 'افتراضي'}</td>
                <td class="p-3 font-black text-xs text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
                <td class="p-3 text-xs"><span class="${p.inStock !== false ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}">${p.inStock !== false ? 'متوفر 🟢' : 'غير متوفر 🔴'}</span></td>
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
        <input type="text" placeholder="اسم البلدية" value="${name}" class="border p-2.5 rounded-xl text-xs flex-1 commune-name-input" required>
        <input type="number" placeholder="سعر التوصيل (دج)" value="${cost}" class="border p-2.5 rounded-xl text-xs w-36 commune-cost-input" required>
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
        if (cName) communesData.push({ name: cName, cost: cCost });
    });

    if (!code || !name) return;

    db.collection("wilayas").doc(code).set({
        code: code,
        name: name,
        officeCost: officeCost,
        communesData: communesData
    }).then(() => {
        resetWilayaForm();
        renderAdminWilayasList();
        showCustomAlert('تم الحفظ 🎉', 'تم حفظ بيانات الولاية والبلديات!', true);
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
                    <button onclick="editWilaya('${w.code}')" class="bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl">تعديل</button>
                    <button onclick="deleteWilaya('${w.code}')" class="bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-xl">حذف</button>
                </div>
            </div>
        `;
    }).join('');
}

function saveShippingApiSettings() {
    const key = document.getElementById('shipping-api-key').value.trim();
    const token = document.getElementById('shipping-api-token').value.trim();
    db.collection("settings").doc("main").set({ shippingApiKey: key, shippingApiToken: token }, { merge: true }).then(() => {
        showCustomAlert('تم تفعيل الربط', 'تم حفظ بيانات الـ API لشركة التوصيل!', true);
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

function deleteBrand(index) {
    if (typeof brands !== 'undefined' && brands[index]) {
        brands.splice(index, 1);
        db.collection("settings").doc("main").set({ brands: brands }, { merge: true }).then(() => {
            populateAdminDropdowns();
            showCustomAlert('تم الحذف', 'تم حذف العلامة التجارية.', true);
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
    if (!newText) return;

    db.collection("settings").doc("main").update({
        bannerMessages: firebase.firestore.FieldValue.arrayUnion(newText)
    }).then(() => {
        input.value = '';
        showCustomAlert('تمت الإضافة', 'تمت إضافة الجملة للبانر العلوي ومزامنتها!', true);
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
        pass: document.getElementById('set-pass').value,
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

    db.collection("heroSlides").add({ title: title, desc: desc, image: image, createdAt: new Date() }).then(() => {
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

    db.collection("categories").add({ name: name, image: image, createdAt: new Date() }).then(() => {
        document.getElementById('cat-name-input').value = '';
        document.getElementById('cat-img-input').value = '';
        showCustomAlert('تم الحفظ', 'تمت إضافة الفئة الجديدة بنجاح!', true);
    });
}
