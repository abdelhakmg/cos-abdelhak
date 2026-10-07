let logoClickCount = 0;
let logoClickTimer = null;

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
        alert('كلمة المرور غير صحيحة!');
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
    btn.classList.remove('bg-gray-800', 'text-gray-300');
    btn.classList.add('bg-black', 'text-white');
}

function renderAdminDashboard() {
    // Analytics
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    document.getElementById('stat-orders-count').innerText = orders.length;
    document.getElementById('stat-avg-order').innerText = orders.length ? Math.round(totalSales / orders.length).toLocaleString() + ' دج' : '0 دج';

    document.getElementById('admin-orders-log').innerHTML = orders.length === 0 ? '<p class="text-gray-400">لا توجد طلبات بعد</p>' : 
        orders.map(o => `
            <div class="border-b pb-3 flex justify-between items-center text-sm">
                <div>
                    <div class="font-bold">${o.customer} (${o.phone})</div>
                    <div class="text-xs text-gray-500">${o.wilaya} - ${o.commune} | ${o.product}</div>
                </div>
                <div class="text-left"><span class="font-black text-[#B8860B]">${o.total.toLocaleString()} دج</span></div>
            </div>
        `).join('');

    // Hero Slides
    document.getElementById('admin-hero-slides-list').innerHTML = heroSlides.map((slide) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <div class="flex items-center gap-3">
                <img src="${slide.image}" class="w-12 h-12 object-cover rounded-lg border">
                <div>
                    <div class="font-bold">${slide.title}</div>
                    <div class="text-xs text-gray-500 truncate max-w-xs">${slide.desc}</div>
                </div>
            </div>
            <button onclick="deleteHeroSlide('${slide.id}')" class="text-red-500 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg">حذف</button>
        </div>
    `).join('');

    // Select Categories
    document.getElementById('prod-category-select').innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    // Select Brands
    document.getElementById('prod-brand-select').innerHTML = brands.length === 0 
        ? '<option value="عامة">عامة</option>' 
        : brands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');

    // Products List with Edit & Toggle Stock
    document.getElementById('admin-products-tbody').innerHTML = products.map((p) => `
        <tr class="border-b">
            <td class="p-3"><img src="${p.images && p.images.length > 0 ? p.images[0] : ''}" class="w-10 h-10 object-cover rounded-lg"></td>
            <td class="p-3 font-bold">${p.name}</td>
            <td class="p-3 text-xs text-gray-500">${p.category}</td>
            <td class="p-3 text-xs text-gray-500">${p.brand || 'عامة'}</td>
            <td class="p-3 font-bold text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
            <td class="p-3">
                <button onclick="toggleProductStock('${p.id}', ${!p.inStock})" class="font-bold text-xs px-2.5 py-1 rounded-lg border cursor-pointer ${p.inStock ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}">
                    ${p.inStock ? '🟢 متوفر' : '🔴 غير متوفر'}
                </button>
            </td>
            <td class="p-3 flex gap-2">
                <button onclick="editProduct('${p.id}')" class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700">تعديل</button>
                <button onclick="deleteProduct('${p.id}')" class="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-red-600">حذف</button>
            </td>
        </tr>
    `).join('');

    // Brands List
    document.getElementById('admin-brands-list').innerHTML = brands.map((b) => `
        <div class="bg-gray-50 rounded-xl border p-3 flex justify-between items-center text-sm font-bold">
            <span>${b.name}</span>
            <button onclick="deleteBrand('${b.id}')" class="text-red-500 text-xs">حذف</button>
        </div>
    `).join('');

    // Categories List
    document.getElementById('admin-categories-list').innerHTML = categories.map((c) => `
        <div class="bg-gray-50 rounded-xl border p-3 text-center space-y-2">
            <img src="${c.image}" class="h-20 w-full object-cover rounded-lg">
            <div class="font-bold text-sm">${c.name}</div>
            <button onclick="deleteCategory('${c.id}')" class="text-red-500 text-xs font-bold">حذف</button>
        </div>
    `).join('');

    // Wilayas List
    document.getElementById('admin-wilayas-list').innerHTML = WILAYAS.map((w) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <div>
                <span class="font-bold">${w.code} - ${w.name}</span>
                <span class="text-xs text-gray-500 block">منزل: ${w.homeCost} دج | مكتب: ${w.officeCost} دج</span>
            </div>
            <button onclick="deleteWilaya('${w.id}')" class="text-red-500 font-bold">حذف</button>
        </div>
    `).join('');

    // Banners List
    document.getElementById('banner-texts-list').innerHTML = bannerMessages.map((msg) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <span>${msg}</span>
            <button onclick="removeBannerText('${msg}')" class="text-red-500 font-bold">حذف</button>
        </div>
    `).join('');

    // Settings
    document.getElementById('set-store-name').value = storeSettings.name || '';
    document.getElementById('set-store-slogan').value = storeSettings.slogan || '';
    document.getElementById('set-logo-url').value = storeSettings.logoUrl || '';
    document.getElementById('set-pass').value = storeSettings.pass || 'admin123';
}

// Product Edit & Add Engine
function handleSaveProduct(e) {
    e.preventDefault();
    const editId = document.getElementById('editing-product-id').value;
    const imgs = [
        document.getElementById('prod-img-main').value,
        document.getElementById('prod-img-2').value,
        document.getElementById('prod-img-3').value,
        document.getElementById('prod-img-4').value,
        document.getElementById('prod-img-5').value
    ].filter(url => url && url.trim() !== '');

    const pData = {
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        oldPrice: parseFloat(document.getElementById('prod-old-price').value) || null,
        category: document.getElementById('prod-category-select').value,
        brand: document.getElementById('prod-brand-select').value,
        inStock: document.getElementById('prod-in-stock').value === 'true',
        images: imgs,
        desc: document.getElementById('prod-desc').value,
        updatedAt: new Date()
    };

    if (editId) {
        // Update Existing Product
        db.collection("products").doc(editId).update(pData).then(() => {
            alert('تم تحديث المنتج بنجاح! ✏️');
            resetProductForm();
        });
    } else {
        // Add New Product
        pData.createdAt = new Date();
        db.collection("products").add(pData).then(() => {
            alert('تم حفظ المنتج في السحابة وتزامنه بنجاح! 🚀');
            resetProductForm();
        });
    }
}

function editProduct(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    document.getElementById('editing-product-id').value = prod.id;
    document.getElementById('prod-name').value = prod.name || '';
    document.getElementById('prod-price').value = prod.price || '';
    document.getElementById('prod-old-price').value = prod.oldPrice || '';
    document.getElementById('prod-category-select').value = prod.category || '';
    document.getElementById('prod-brand-select').value = prod.brand || '';
    document.getElementById('prod-in-stock').value = prod.inStock ? 'true' : 'false';
    document.getElementById('prod-desc').value = prod.desc || '';

    if (prod.images) {
        document.getElementById('prod-img-main').value = prod.images[0] || '';
        document.getElementById('prod-img-2').value = prod.images[1] || '';
        document.getElementById('prod-img-3').value = prod.images[2] || '';
        document.getElementById('prod-img-4').value = prod.images[3] || '';
        document.getElementById('prod-img-5').value = prod.images[4] || '';
    }

    document.getElementById('product-form-title').innerText = 'تعديل بيانات المنتج ✏️';
    document.getElementById('save-product-btn').innerText = 'تحديث بيانات المنتج ✏️';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');

    window.scrollTo({ top: document.getElementById('product-edit-form').offsetTop - 100, behavior: 'smooth' });
}

function resetProductForm() {
    document.getElementById('editing-product-id').value = '';
    document.getElementById('product-edit-form').reset();
    document.getElementById('product-form-title').innerText = 'إضافة / تعديل منتج (مع حالة التوفر والماركة)';
    document.getElementById('save-product-btn').innerText = 'حفظ المنتج';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

function toggleProductStock(id, newStatus) {
    db.collection("products").doc(id).update({ inStock: newStatus });
}

function deleteProduct(id) {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج؟')) {
        db.collection("products").doc(id).delete();
    }
}

// Brand Management
function handleSaveBrand(e) {
    e.preventDefault();
    const name = document.getElementById('brand-name-input').value;
    db.collection("brands").add({ name }).then(() => {
        document.getElementById('brand-name-input').value = '';
        alert('تم إضافة العلامة التجارية بنجاح!');
    });
}

function deleteBrand(id) {
    db.collection("brands").doc(id).delete();
}

// Hero Slides & Categories
function handleSaveHeroSlide(e) {
    e.preventDefault();
    const newSlide = {
        title: document.getElementById('hero-title-input').value,
        desc: document.getElementById('hero-desc-input').value,
        image: document.getElementById('hero-img-input').value
    };
    db.collection("heroSlides").add(newSlide).then(() => {
        alert('تم إضافة الإعلان بنجاح!');
    });
}

function deleteHeroSlide(id) {
    db.collection("heroSlides").doc(id).delete();
}

function handleSaveCategory(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name-input').value;
    const img = document.getElementById('cat-img-input').value;

    db.collection("categories").add({ name, image: img }).then(() => {
        alert('تم حفظ الفئة بنجاح!');
    });
}

function deleteCategory(id) {
    db.collection("categories").doc(id).delete();
}

function handleSaveWilaya(e) {
    e.preventDefault();
    const code = document.getElementById('wilaya-code').value;
    const name = document.getElementById('wilaya-name').value;
    const homeCost = parseFloat(document.getElementById('wilaya-home-cost').value);
    const officeCost = parseFloat(document.getElementById('wilaya-office-cost').value);
    const communesInput = document.getElementById('wilaya-communes-input').value;
    const communes = communesInput ? communesInput.split(',').map(c => c.trim()) : [name];

    db.collection("wilayas").add({ code, name, communes, homeCost, officeCost }).then(() => {
        alert('تم إضافة الولاية بنجاح!');
    });
}

function deleteWilaya(id) {
    db.collection("wilayas").doc(id).delete();
}

function addBannerText() {
    const txt = document.getElementById('new-banner-text').value;
    if (txt) {
        db.collection("banners").add({ text: txt }).then(() => {
            document.getElementById('new-banner-text').value = '';
        });
    }
}

function removeBannerText(textVal) {
    db.collection("banners").where("text", "==", textVal).get().then(snapshot => {
        snapshot.forEach(doc => doc.ref.delete());
    });
}

function handleSaveSettings(e) {
    e.preventDefault();
    const settings = {
        name: document.getElementById('set-store-name').value,
        slogan: document.getElementById('set-store-slogan').value,
        logoUrl: document.getElementById('set-logo-url').value,
        pass: document.getElementById('set-pass').value
    };

    db.collection("settings").doc("main").set(settings).then(() => {
        alert('تم تحديث الإعدادات بنجاح!');
    });
}
