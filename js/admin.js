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
    if (tabName === 'gift-settings') renderAdminGiftSettings();
}

// ==========================================
// 🎁 قسم إدارة زر هديتك من لوحة التحكم المتطورة
// ==========================================

function renderAdminGiftSettings() {
    const occContainer = document.getElementById('admin-gift-occasions-list');
    if (occContainer && typeof defaultGiftOccasions !== 'undefined') {
        occContainer.innerHTML = defaultGiftOccasions.map((occ, idx) => `
            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border text-xs my-1 text-gray-900">
                <span class="font-bold">${occ}</span>
                <button type="button" onclick="removeGiftOccasion(${idx})" class="text-red-500 font-bold px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition">حذف</button>
            </div>
        `).join('');
    }

    const wrapContainer = document.getElementById('admin-gift-wrapping-list');
    if (wrapContainer && typeof giftWrappingOptions !== 'undefined') {
        wrapContainer.innerHTML = giftWrappingOptions.map((w, idx) => `
            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border text-xs my-1 text-gray-900">
                <div class="flex items-center gap-3">
                    <img src="${w.image}" class="w-10 h-10 object-contain bg-black rounded-lg border">
                    <div>
                        <strong class="block text-gray-900">${w.name}</strong>
                        <span class="text-[#B8860B] font-bold">${w.price.toLocaleString()} دج</span>
                    </div>
                </div>
                <button type="button" onclick="removeGiftWrapping(${idx})" class="text-red-500 font-bold px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition">حذف</button>
            </div>
        `).join('');
    }

    const ribbonContainer = document.getElementById('admin-ribbon-colors-list');
    if (ribbonContainer && typeof giftRibbonColors !== 'undefined') {
        ribbonContainer.innerHTML = giftRibbonColors.map((col, idx) => `
            <span class="bg-gray-100 border px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm text-gray-900">
                ${col} <button type="button" onclick="removeRibbonColor(${idx})" class="text-red-500 font-bold hover:scale-125 transition">×</button>
            </span>
        `).join('');
    }

    const wrapperContainer = document.getElementById('admin-wrapper-colors-list');
    if (wrapperContainer && typeof giftWrapperColors !== 'undefined') {
        wrapperContainer.innerHTML = giftWrapperColors.map((col, idx) => `
            <span class="bg-gray-100 border px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm text-gray-900">
                ${col} <button type="button" onclick="removeWrapperColor(${idx})" class="text-red-500 font-bold hover:scale-125 transition">×</button>
            </span>
        `).join('');
    }
}

function handleAddGiftOccasion() {
    const input = document.getElementById('new-gift-occ-name');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    if (typeof defaultGiftOccasions !== 'undefined') defaultGiftOccasions.push(val);
    input.value = '';
    renderAdminGiftSettings();
    showCustomAlert('تمت الإضافة', 'تمت إضافة المناسبة بنجاح!', true);
}

function removeGiftOccasion(idx) {
    if (typeof defaultGiftOccasions !== 'undefined') {
        defaultGiftOccasions.splice(idx, 1);
        renderAdminGiftSettings();
    }
}

function handleAddGiftWrapping() {
    const name = document.getElementById('new-wrap-name')?.value.trim();
    const price = parseFloat(document.getElementById('new-wrap-price')?.value) || 0;
    const image = document.getElementById('new-wrap-img-url')?.value.trim() || 'https://via.placeholder.com/100';
    if (!name) {
        showCustomAlert('تنبيه', 'يرجى كتابة اسم التغليف!', false);
        return;
    }
    if (typeof giftWrappingOptions !== 'undefined') {
        giftWrappingOptions.push({ id: 'wrap-' + Date.now(), name, price, image });
    }
    if (document.getElementById('new-wrap-name')) document.getElementById('new-wrap-name').value = '';
    if (document.getElementById('new-wrap-price')) document.getElementById('new-wrap-price').value = '';
    if (document.getElementById('new-wrap-img-url')) document.getElementById('new-wrap-img-url').value = '';
    if (document.getElementById('new-wrap-img-file')) document.getElementById('new-wrap-img-file').value = '';
    renderAdminGiftSettings();
    showCustomAlert('تمت الإضافة', 'تم إضافة نوع التغليف بنجاح!', true);
}

function removeGiftWrapping(idx) {
    if (typeof giftWrappingOptions !== 'undefined') {
        giftWrappingOptions.splice(idx, 1);
        renderAdminGiftSettings();
    }
}

function handleAddRibbonColor() {
    const input = document.getElementById('new-ribbon-color');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    if (typeof giftRibbonColors !== 'undefined') giftRibbonColors.push(val);
    input.value = '';
    renderAdminGiftSettings();
}

function removeRibbonColor(idx) {
    if (typeof giftRibbonColors !== 'undefined') {
        giftRibbonColors.splice(idx, 1);
        renderAdminGiftSettings();
    }
}

function handleAddWrapperColor() {
    const input = document.getElementById('new-wrapper-color');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    if (typeof giftWrapperColors !== 'undefined') giftWrapperColors.push(val);
    input.value = '';
    renderAdminGiftSettings();
}

function removeWrapperColor(idx) {
    if (typeof giftWrapperColors !== 'undefined') {
        giftWrapperColors.splice(idx, 1);
        renderAdminGiftSettings();
    }
}
