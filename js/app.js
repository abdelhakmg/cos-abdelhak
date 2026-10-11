let currentBannerIdx = 0;
let currentHeroIdx = 0;
let activeCategoryFilter = 'جميع المنتجات';
let logoClickCount = 0;
let logoClickTimer = null;

function initLuxurySplashScreen() {
    const splash = document.getElementById('luxury-splash-screen');
    if (!splash) return;

    splash.style.display = 'flex';
    splash.style.opacity = '1';
    splash.style.transition = 'opacity 0.7s ease-in-out';

    const hideSplash = () => {
        if (splash.style.display === 'none') return;
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 700);
    };

    setTimeout(hideSplash, 3000);
}

function handleLogoClick(event) {
    if (event) event.preventDefault();
    logoClickCount++;
    if (logoClickTimer) clearTimeout(logoClickTimer);
    if (logoClickCount >= 3) {
        logoClickCount = 0;
        const modal = document.getElementById('admin-auth-modal');
        if (modal) { modal.style.display = 'flex'; modal.classList.remove('hidden'); }
        else { showPage('admin'); }
        return;
    }
    logoClickTimer = setTimeout(() => {
        if (logoClickCount < 3) showPage('home');
        logoClickCount = 0;
    }, 600);
}

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin' && typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (pageId === 'cart') { renderCart(); populateCartWilayas(); }
    if (pageId === 'wishlist') renderWishlistPage();
    if (pageId === 'gift-builder') initGiftBuilderUI();
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

function renderSingleProductCard(p) {
    let displayImg = 'https://via.placeholder.com/300';
    if (p.images && Array.isArray(p.images) && p.images.length > 0 && p.images[0]) displayImg = p.images[0];
    else if (p.image) displayImg = p.image;
    const isFav = Array.isArray(favorites) && favorites.includes(p.id);

    return `
        <div class="bg-white text-gray-900 rounded-2xl border p-4 text-right flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-[#D4AF37]/25 transition-all duration-300 transform hover:-translate-y-2 group relative">
            <button onclick="event.stopPropagation(); toggleFavorite('${p.id}');" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-sm cursor-pointer">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>
            <div class="cursor-pointer" onclick="openLandingPage('${p.id}')">
                <div class="h-48 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center overflow-hidden">
                    <img src="${displayImg}" class="max-h-full object-contain group-hover:scale-105 transition duration-500">
                </div>
                <h3 class="font-bold text-sm text-gray-900 truncate my-1 group-hover:text-[#B8860B] transition">${p.name || 'منتج'}</h3>
                <div class="flex items-center gap-2 mb-1">
                    <span class="font-black text-base text-[#B8860B]">${p.price ? p.price.toLocaleString() : 0} دج</span>
                </div>
            </div>
            <div class="space-y-2 pt-2">
                <button onclick="event.stopPropagation(); addToCart('${p.id}');" class="w-full py-2.5 bg-black text-white hover:bg-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                    <i class="fa-solid fa-bag-shopping text-xs"></i> أضف إلى السلة
                </button>
            </div>
        </div>
    `;
}

function renderProducts() {
    const homeContainer = document.getElementById('home-products');
    const catalogContainer = document.getElementById('catalog-products');
    
    if (!products || products.length === 0) {
        if (homeContainer) homeContainer.innerHTML = '<p class="text-gray-400 text-xs text-center col-span-full py-8">لا توجد منتجات مضافة حالياً.</p>';
        if (catalogContainer) catalogContainer.innerHTML = '<p class="text-gray-400 text-xs text-center col-span-full py-8">لا توجد منتجات تطابق بحثك.</p>';
        return;
    }

    const htmlContent = products.map(p => renderSingleProductCard(p)).join('');
    
    if (homeContainer) homeContainer.innerHTML = htmlContent;
    if (catalogContainer) catalogContainer.innerHTML = htmlContent;
    
    const countBadge = document.getElementById('products-count-badge');
    if (countBadge) countBadge.innerText = products.length;
}

function renderCategoryCards() {
    const container = document.getElementById('home-category-cards');
    if (!container) return;

    const defaultCats = [
        { name: 'كوسمتيك', image: 'https://via.placeholder.com/100' },
        { name: 'بلاكيور', image: 'https://via.placeholder.com/100' },
        { name: 'مايكاب', image: 'https://via.placeholder.com/100' },
        { name: 'عطور', image: 'https://via.placeholder.com/100' },
        { name: 'علب هدايا', image: 'https://via.placeholder.com/100' },
        { name: 'إكسسوارات شعر', image: 'https://via.placeholder.com/100' }
    ];

    const catsToDisplay = (typeof categories !== 'undefined' && categories.length > 0) ? categories : defaultCats;

    container.innerHTML = catsToDisplay.map(c => `
        <div onclick="filterByCategory('${c.name}')" class="bg-[#121212] border border-gray-800 rounded-2xl p-4 text-center cursor-pointer hover:border-[#D4AF37] transition group">
            <div class="w-14 h-14 mx-auto mb-2 rounded-xl bg-black border border-gray-800 flex items-center justify-center overflow-hidden">
                <img src="${c.image || 'https://via.placeholder.com/100'}" class="w-full h-full object-contain group-hover:scale-110 transition duration-300">
            </div>
            <span class="text-xs font-bold text-white group-hover:text-[#D4AF37] transition">${c.name}</span>
        </div>
    `).join('');
}

function filterByCategory(catName) {
    activeCategoryFilter = catName;
    showPage('catalog');
    if (typeof applyFilters === 'function') applyFilters();
}

function updateAppHeaderInfo() {
    renderCategoryCards();
    renderProducts();
}

// 🌟 نظام "صمّم هديتك بنفسك 🎁" 🌟
let giftState = {
    step: 1,
    occasion: 'عيد ميلاد',
    budget: 5000,
    selectedProducts: [],
    selectedBox: null,
    selectedWrapping: null,
    ribbonColor: 'ذهبي',
    wrapperColor: 'أسود ملكي',
    recipientName: '',
    senderName: '',
    messageText: ''
};

let defaultGiftOccasions = ['عيد ميلاد', 'للحبيبة / الزوجة', 'للأم', 'للأب / الرجال', 'تخرج ونجاح', 'مفاجأة خاصة'];
let giftWrappingOptions = [
    { id: 'wrap-1', name: 'تغليف فاخر مع ورود مجففة', price: 400, image: 'https://via.placeholder.com/100' },
    { id: 'wrap-2', name: 'تغليف شريطي ملكي', price: 300, image: 'https://via.placeholder.com/100' }
];
let giftRibbonColors = ['ذهبي', 'أحمر قاني', 'وردي', 'أسود', 'فضي'];
let giftWrapperColors = ['أسود ملكي', 'أبيض ناصع', 'وردي باستيل', 'أحمر مخملي'];

function initGiftBuilderUI() {
    renderOccasionsGrid();
    renderBudgetOptions();
    populateGiftWilayas();
}

function renderOccasionsGrid() {
    const grid = document.getElementById('gift-occasions-grid');
    if (!grid) return;
    grid.innerHTML = defaultGiftOccasions.map(occ => `
        <button type="button" onclick="selectGiftOccasion('${occ}')" class="occ-card border p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer ${giftState.occasion === occ ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black/40'}">
            <i class="fa-solid fa-gift text-lg text-[#D4AF37]"></i>
            <span class="text-xs font-bold text-white">${occ}</span>
        </button>
    `).join('');
}

function selectGiftOccasion(occName) {
    giftState.occasion = occName;
    renderOccasionsGrid();
}

function renderBudgetOptions() {
    const container = document.getElementById('gift-budget-options');
    if (!container) return;
    const options = [2000, 3000, 5000, 10000];
    container.innerHTML = options.map(b => `
        <button type="button" onclick="setGiftBudget(${b})" class="px-4 py-2 rounded-xl text-xs font-bold border transition ${giftState.budget === b ? 'border-[#D4AF37] gold-gradient text-black' : 'border-gray-800 bg-black text-gray-300'}">
            ${b.toLocaleString()} دج
        </button>
    `).join('');
}

function setGiftBudget(amount) {
    giftState.budget = amount;
    renderBudgetOptions();
}

function setCustomGiftBudget(val) {
    giftState.budget = parseFloat(val) || 0;
    renderBudgetOptions();
}

function goToGiftStep(stepNum) {
    giftState.step = stepNum;
    document.querySelectorAll('.gift-step-content').forEach(el => el.classList.add('hidden'));
    const currentStepEl = document.getElementById(`gift-step-${stepNum}`);
    if (currentStepEl) currentStepEl.classList.remove('hidden');

    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`step-btn-${i}`);
        if (btn) {
            const circle = btn.querySelector('div');
            if (i <= stepNum) circle.className = "w-9 h-9 rounded-full gold-gradient text-black font-black text-xs flex items-center justify-center shadow-md";
            else circle.className = "w-9 h-9 rounded-full bg-gray-800 text-gray-400 font-black text-xs flex items-center justify-center shadow-md";
        }
    }

    if (stepNum === 2) renderBuilderProducts();
    if (stepNum === 3) renderBuilderBoxes();
    if (stepNum === 4) renderBuilderWrappingAndColors();
    if (stepNum === 5) renderGiftFinalPreview();
}

function renderBuilderProducts() {
    const grid = document.getElementById('builder-products-grid');
    if (!grid) return;
    const available = (typeof products !== 'undefined' && Array.isArray(products)) ? products.filter(p => p.inStock !== false && (!p.category || !p.category.includes('علب'))) : [];

    grid.innerHTML = available.map(p => {
        const selectedItem = giftState.selectedProducts.find(sp => sp.product.id === p.id);
        const qty = selectedItem ? selectedItem.quantity : 0;
        const img = (p.images && p.images[0]) || p.image || 'https://via.placeholder.com/150';

        return `
            <div class="bg-[#121212] border border-gray-800 rounded-2xl p-3 text-right flex flex-col justify-between">
                <img src="${img}" class="w-full h-24 object-contain rounded-xl bg-black mb-2">
                <h4 class="text-xs font-bold text-white truncate">${p.name}</h4>
                <p class="text-[11px] gold-text font-black my-1">${p.price.toLocaleString()} دج</p>
                <div class="flex items-center justify-between mt-2 bg-black p-1.5 rounded-xl border border-gray-800">
                    <button type="button" onclick="updateGiftProductQty('${p.id}', -1)" class="w-7 h-7 bg-gray-800 text-white rounded-lg font-bold text-xs">-</button>
                    <span class="text-xs font-black text-white">${qty}</span>
                    <button type="button" onclick="updateGiftProductQty('${p.id}', 1)" class="w-7 h-7 gold-gradient text-black rounded-lg font-bold text-xs">+</button>
                </div>
            </div>
        `;
    }).join('');
    updateLiveBuilderTotal();
}

function updateGiftProductQty(prodId, change) {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    let existing = giftState.selectedProducts.find(sp => sp.product.id === prodId);
    if (existing) {
        existing.quantity += change;
        if (existing.quantity <= 0) giftState.selectedProducts = giftState.selectedProducts.filter(sp => sp.product.id !== prodId);
    } else if (change > 0) {
        giftState.selectedProducts.push({ product: prod, quantity: 1 });
    }
    renderBuilderProducts();
    checkBudgetExceed();
}

function updateLiveBuilderTotal() {
    const totalEl = document.getElementById('builder-live-total');
    const prodsTotal = giftState.selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const boxCost = giftState.selectedBox ? giftState.selectedBox.price : 500;
    const wrapCost = giftState.selectedWrapping ? giftState.selectedWrapping.price : 0;
    const currentTotal = prodsTotal + boxCost + wrapCost;
    if (totalEl) totalEl.innerText = currentTotal.toLocaleString() + ' دج';
}

function checkBudgetExceed() {
    const prodsTotal = giftState.selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const boxCost = giftState.selectedBox ? giftState.selectedBox.price : 500;
    const wrapCost = giftState.selectedWrapping ? giftState.selectedWrapping.price : 0;
    const currentTotal = prodsTotal + boxCost + wrapCost;

    if (currentTotal > giftState.budget) {
        showCustomAlert('تنبيه الميزانية ⚠️', `لقد تجاوزت ميزانيتك المحددة (${giftState.budget.toLocaleString()} دج)! المجموع الحالي هو ${currentTotal.toLocaleString()} دج.`, false);
    }
}

function validateAndGoToStep(targetStep) {
    if (giftState.selectedProducts.length === 0) {
        showCustomAlert('تنبيه 🎁', 'يرجى اختيار منتج واحد على الأقل لهديتك!', false);
        return;
    }
    goToGiftStep(targetStep);
}

function renderBuilderBoxes() {
    const grid = document.getElementById('builder-boxes-grid');
    if (!grid) return;
    const realBoxes = (typeof products !== 'undefined' && Array.isArray(products)) ? products.filter(p => p.category && p.category.includes('علب')) : [];
    const boxesToDisplay = realBoxes.length > 0 ? realBoxes : [
        { id: 'b1', name: 'علبة الفخامة السوداء والذهبية', price: 600, image: 'https://via.placeholder.com/150' },
        { id: 'b2', name: 'علبة الأميرة البيضاء الناعمة', price: 500, image: 'https://via.placeholder.com/150' }
    ];
    if (!giftState.selectedBox && boxesToDisplay.length > 0) giftState.selectedBox = boxesToDisplay[0];

    grid.innerHTML = boxesToDisplay.map(box => {
        const isSelected = giftState.selectedBox && giftState.selectedBox.id === box.id;
        const img = (box.images && box.images[0]) || box.image;
        return `
            <div onclick="selectGiftBox('${box.id}')" class="border p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black/40'}">
                <img src="${img}" class="w-14 h-14 object-contain bg-black rounded-xl border border-gray-800">
                <div class="text-right flex-1">
                    <h4 class="text-xs font-bold text-white">${box.name}</h4>
                    <p class="text-[11px] gold-text font-black mt-1">${box.price.toLocaleString()} دج</p>
                </div>
            </div>
        `;
    }).join('');
}

function selectGiftBox(boxId) {
    const realBox = (typeof products !== 'undefined') ? products.find(p => p.id === boxId) : null;
    giftState.selectedBox = realBox || { id: boxId, name: 'علبة فاخرة', price: 500, image: 'https://via.placeholder.com/150' };
    renderBuilderBoxes();
    updateLiveBuilderTotal();
}

function renderBuilderWrappingAndColors() {
    const wrapContainer = document.getElementById('builder-wrapping-options');
    if (wrapContainer) {
        if (!giftState.selectedWrapping && giftWrappingOptions.length > 0) giftState.selectedWrapping = giftWrappingOptions[0];
        wrapContainer.innerHTML = giftWrappingOptions.map(w => {
            const isSelected = giftState.selectedWrapping && giftState.selectedWrapping.id === w.id;
            return `
                <div onclick="selectGiftWrapping('${w.id}')" class="border p-3 rounded-xl flex items-center gap-3 cursor-pointer transition ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-800 bg-black/40'}">
                    <img src="${w.image}" class="w-10 h-10 object-contain rounded-lg bg-black">
                    <div class="text-right flex-1">
                        <h4 class="text-xs font-bold text-white">${w.name}</h4>
                        <p class="text-[11px] gold-text font-black">${w.price.toLocaleString()} دج</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    const ribbonContainer = document.getElementById('builder-ribbon-options');
    if (ribbonContainer) {
        ribbonContainer.innerHTML = giftRibbonColors.map(col => `
            <button type="button" onclick="selectRibbonColor('${col}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition ${giftState.ribbonColor === col ? 'border-[#D4AF37] gold-gradient text-black' : 'border-gray-800 bg-black text-gray-300'}">
                ${col}
            </button>
        `).join('');
    }

    const wrapperColorContainer = document.getElementById('builder-wrappercolor-options');
    if (wrapperColorContainer) {
        wrapperColorContainer.innerHTML = giftWrapperColors.map(col => `
            <button type="button" onclick="selectWrapperColor('${col}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition ${giftState.wrapperColor === col ? 'border-[#D4AF37] gold-gradient text-black' : 'border-gray-800 bg-black text-gray-300'}">
                ${col}
            </button>
        `).join('');
    }
}

function selectGiftWrapping(wrapId) {
    const w = giftWrappingOptions.find(item => item.id === wrapId);
    if (w) giftState.selectedWrapping = w;
    renderBuilderWrappingAndColors();
    updateLiveBuilderTotal();
}

function selectRibbonColor(col) {
    giftState.ribbonColor = col;
    renderBuilderWrappingAndColors();
}

function selectWrapperColor(col) {
    giftState.wrapperColor = col;
    renderBuilderWrappingAndColors();
}

function updateMsgCharCount(val) {
    giftState.messageText = val;
}

function renderGiftFinalPreview() {
    giftState.recipientName = document.getElementById('gift-recipient-name')?.value.trim() || 'أغلى الناس';
    giftState.senderName = document.getElementById('gift-sender-name')?.value.trim() || 'صديق مخلص';

    document.getElementById('preview-to-name').innerText = giftState.recipientName;
    document.getElementById('preview-from-name').innerText = giftState.senderName;
    document.getElementById('preview-card-body').innerText = giftState.messageText || 'أتمنى لك أجمل الأيام واللحظات السعيدة!';
    document.getElementById('preview-occasion-badge').innerText = giftState.occasion;
    document.getElementById('preview-ribbon-text').innerText = giftState.ribbonColor;

    if (giftState.selectedBox) {
        const boxImg = (giftState.selectedBox.images && giftState.selectedBox.images[0]) || giftState.selectedBox.image;
        document.getElementById('preview-box-img').src = boxImg;
    }

    const prodsPreviewContainer = document.getElementById('preview-products-list');
    if (prodsPreviewContainer) {
        prodsPreviewContainer.innerHTML = giftState.selectedProducts.map(sp => {
            const pImg = (sp.product.images && sp.product.images[0]) || sp.product.image;
            return `
                <div class="bg-gray-900 border border-gray-800 p-1.5 rounded-xl flex items-center gap-1.5">
                    <img src="${pImg}" class="w-6 h-6 object-contain rounded-md bg-black">
                    <span class="text-[10px] font-bold text-white">${sp.product.name} (x${sp.quantity})</span>
                </div>
            `;
        }).join('');
    }

    const prodsTotal = giftState.selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const boxCost = giftState.selectedBox ? giftState.selectedBox.price : 500;
    const wrapCost = giftState.selectedWrapping ? giftState.selectedWrapping.price : 0;

    document.getElementById('summary-prods-box-price').innerText = (prodsTotal + boxCost).toLocaleString() + ' دج';
    document.getElementById('summary-wrap-price').innerText = wrapCost.toLocaleString() + ' دج';
    document.getElementById('summary-grand-total').innerText = (prodsTotal + boxCost + wrapCost).toLocaleString() + ' دج';
    populateGiftWilayas();
}

function populateGiftWilayas() {
    const select = document.getElementById('gift-cust-wilaya');
    if (!select || typeof WILAYAS === 'undefined') return;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleGiftWilayaChange() {
    const code = document.getElementById('gift-cust-wilaya').value;
    const wilaya = (typeof WILAYAS !== 'undefined') ? WILAYAS.find(w => w.code === code) : null;
    const communeSelect = document.getElementById('gift-cust-commune');
    if (wilaya && communeSelect) {
        const communesList = wilaya.communesData || [];
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>' + communesList.map(c => `<option value="${c.name}">${c.name} (${c.cost} دج)</option>`).join('');
    }
}

function updateGiftCalculations() {}

function submitGiftOrder() {
    const name = document.getElementById('gift-cust-name')?.value.trim();
    const phone = document.getElementById('gift-cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('gift-cust-wilaya')?.value;
    const commune = document.getElementById('gift-cust-commune')?.value;

    if (!name || !wilayaCode || !phone) {
        showCustomAlert('تنبيه ⚠️', 'يرجى كتابة اسمك ورقم الهاتف والولاية لتأكيد التسليم!', false);
        return;
    }

    const wilaya = (typeof WILAYAS !== 'undefined') ? WILAYAS.find(w => w.code === wilayaCode) : null;
    const communeObj = (wilaya?.communesData || []).find(c => c.name === commune);
    const shipCost = communeObj ? communeObj.cost : (wilaya?.officeCost || 0);

    const prodsTotal = giftState.selectedProducts.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const boxCost = giftState.selectedBox ? giftState.selectedBox.price : 500;
    const wrapCost = giftState.selectedWrapping ? giftState.selectedWrapping.price : 0;
    const grandTotal = prodsTotal + boxCost + wrapCost + shipCost;

    const prodsSummaryStr = giftState.selectedProducts.map(sp => `${sp.product.name} (x${sp.quantity})`).join(', ');

    let messageStr = '';
    if (giftState.messageText && giftState.messageText.trim().length > 0) {
        messageStr = ` - [رسالة من ${giftState.senderName} إلى ${giftState.recipientName}: "${giftState.messageText}"]`;
    }

    const newGiftOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: commune || 'المكتب',
        product: `🎁 هدية مخصصة (${giftState.occasion}): [منتجات: ${prodsSummaryStr}] - [العلبة: ${giftState.selectedBox?.name || 'فاخرة'}] - [التغليف: ${giftState.selectedWrapping?.name || 'عادي'}] - [شريط: ${giftState.ribbonColor}] - [غلاف: ${giftState.wrapperColor}]${messageStr}`,
        total: grandTotal,
        status: 'جديد',
        isGiftOrder: true,
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    if (typeof db !== 'undefined') {
        db.collection("orders").add(newGiftOrder).then(() => {
            showCustomAlert('تم استلام الهدية بنجاح! 🎉', 'شكرًا لك! تم استلام طلب هديتك وسنقوم بتجهيزها بعناية فائقة.', true);
            showPage('home');
        }).catch(err => {
            showCustomAlert('خطأ', 'تعذر إرسال الطلب: ' + err.message, false);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initLuxurySplashScreen();
});
