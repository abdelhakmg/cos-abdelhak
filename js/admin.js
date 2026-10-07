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

    document.getElementById('prod-category-select').innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    document.getElementById('admin-products-tbody').innerHTML = products.map((p) => `
        <tr class="border-b">
            <td class="p-3"><img src="${p.images ? p.images[0] : ''}" class="w-10 h-10 object-cover rounded-lg"></td>
            <td class="p-3 font-bold">${p.name}</td>
            <td class="p-3 text-xs text-gray-500">${p.category}</td>
            <td class="p-3 font-bold text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</td>
            <td class="p-3 font-bold text-xs">${p.inStock ? '🟢 متوفر' : '🔴 غير متوفر'}</td>
            <td class="p-3">
                <button onclick="deleteProduct('${p.id}')" class="bg-red-500 text-white text-xs px-3 py-1 rounded-lg">حذف</button>
            </td>
        </tr>
    `).join('');

    document.getElementById('admin-categories-list').innerHTML = categories.map((c) => `
        <div class="bg-gray-50 rounded-xl border p-3 text-center space-y-2">
            <img src="${c.image}" class="h-20 w-full object-cover rounded-lg">
            <div class="font-bold text-sm">${c.name}</div>
            <button onclick="deleteCategory('${c.id}')" class="text-red-500 text-xs font-bold">حذف</button>
        </div>
    `).join('');

    document.getElementById('admin-wilayas-list').innerHTML = WILAYAS.map((w) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <div>
                <span class="font-bold">${w.code} - ${w.name}</span>
                <span class="text-xs text-gray-500 block">منزل: ${w.homeCost} دج | مكتب: ${w.officeCost} دج</span>
            </div>
            <button onclick="deleteWilaya('${w.id}')" class="text-red-500 font-bold">حذف</button>
        </div>
    `).join('');

    document.getElementById('banner-texts-list').innerHTML = bannerMessages.map((msg, idx) => `
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border text-sm">
            <span>${msg}</span>
            <button onclick="removeBannerText('${msg}')" class="text-red-500 font-bold">حذف</button>
        </div>
    `).join('');

    document.getElementById('set-store-name').value = storeSettings.name || '';
    document.getElementById('set-store-slogan').value = storeSettings.slogan || '';
    document.getElementById('set-logo-url').value = storeSettings.logoUrl || '';
    document.getElementById('set-pass').value = storeSettings.pass || 'admin123';
}

function handleSaveHeroSlide(e) {
    e.preventDefault();
    const newSlide = {
        title: document.getElementById('hero-title-input').value,
        desc: document.getElementById('hero-desc-input').value,
        image: document.getElementById('hero-img-input').value
    };
    db.collection("heroSlides").add(newSlide).then(() => {
        alert('تم إضافة الإعلان وتزامنه بنجاح!');
    });
}

function deleteHeroSlide(id) {
    db.collection("heroSlides").doc(id).delete();
}

function handleSaveProduct(e) {
    e.preventDefault();
    const imgs = [
        document.getElementById('prod-img-main').value,
        document.getElementById('prod-img-2').value,
        document.getElementById('prod-img-3').value,
        document.getElementById('prod-img-4').value,
        document.getElementById('prod-img-5').value
    ].filter(url => url && url.trim() !== '');

    const newP = {
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        oldPrice: parseFloat(document.getElementById('prod-old-price').value) || null,
        category: document.getElementById('prod-category-select').value,
        brand: document.getElementById('prod-brand-select').value,
        inStock: document.getElementById('prod-in-stock').value === 'true',
        images: imgs,
        desc: document.getElementById('prod-desc').value,
        createdAt: new Date()
    };

    db.collection("products").add(newP).then(() => {
        alert('تم حفظ المنتج في السحابة وتزامنه مع كافة الأجهزة! 🚀');
    });
}

function deleteProduct(id) {
    db.collection("products").doc(id).delete();
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
