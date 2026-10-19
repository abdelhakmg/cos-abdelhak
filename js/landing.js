// --- ملف js/landing.js ---

import { state } from './store/state.js';
import { formatPrice, showCustomAlert, safeCall, calculateShippingCost, isValidDzPhone } from './utils/helpers.js';

let currentLandingProduct = null;

export function openLandingPage(productId) {
    currentLandingProduct = state.products.find(p => p.id === productId);
    if (!currentLandingProduct) return;

    let mainImg = (currentLandingProduct.images && currentLandingProduct.images[0]) || currentLandingProduct.image || 'https://via.placeholder.com/500';
        
    const landingImgEl = document.getElementById('landing-main-img');
    if (landingImgEl) landingImgEl.src = mainImg;

    const landingTitleEl = document.getElementById('landing-title');
    if (landingTitleEl) landingTitleEl.innerText = currentLandingProduct.name || '';

    const landingCatEl = document.getElementById('landing-category');
    if (landingCatEl) landingCatEl.innerText = currentLandingProduct.category || 'عام';

    const landingPriceEl = document.getElementById('landing-price');
    if (landingPriceEl) landingPriceEl.innerText = formatPrice(currentLandingProduct.price);

    const landingOldPriceEl = document.getElementById('landing-old-price');
    if (landingOldPriceEl) landingOldPriceEl.innerText = currentLandingProduct.oldPrice ? formatPrice(currentLandingProduct.oldPrice) : '';

    const landingDescEl = document.getElementById('landing-desc');
    if (landingDescEl) landingDescEl.innerText = currentLandingProduct.desc || '';

    renderLandingDynamicOptions(currentLandingProduct);

    const thumbsContainer = document.getElementById('landing-thumbnails-list');
    if (thumbsContainer) {
        const imagesList = (currentLandingProduct.images && currentLandingProduct.images.length > 0) ? currentLandingProduct.images : [mainImg];
        thumbsContainer.innerHTML = imagesList.map((imgUrl) => {
            const safeUrl = (imgUrl || '').replace(/'/g, "\\'");
            return `
            <div onclick="swapLandingMainImage('${safeUrl}')" class="w-16 h-16 rounded-xl border-2 border-gray-800 hover:border-[#D4AF37] p-1 cursor-pointer bg-black overflow-hidden shadow-sm">
                <img src="${imgUrl}" class="w-full h-full object-contain" loading="lazy">
            </div>
            `;
        }).join('');
    }

    populateWilayas();
    handleWilayaChange(); // يحدث الأسعار، يحسب المجموع، ويفحص الزر الذكي معاً
    safeCall('showPage', 'landing');
}

export function swapLandingMainImage(newUrl) {
    const mainImg = document.getElementById('landing-main-img');
    if (mainImg) {
        mainImg.style.opacity = '0.3';
        setTimeout(() => {
            mainImg.src = newUrl;
            mainImg.style.opacity = '1';
        }, 150);
    }
}

export function populateWilayas() {
    const select = document.getElementById('cust-wilaya');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        state.WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
    if (currentVal) select.value = currentVal;
}

export function handleWilayaChange() {
    const code = document.getElementById('cust-wilaya')?.value;
    const wilaya = state.WILAYAS.find(w => w.code === code);
    
    const officePriceEl = document.getElementById('price-shipping-office');
    const homePriceEl = document.getElementById('price-shipping-home');

    if (wilaya) {
        if (officePriceEl) officePriceEl.innerText = formatPrice(wilaya.officeCost ?? 0);
        if (homePriceEl) homePriceEl.innerText = formatPrice(wilaya.homeCost ?? wilaya.officeCost ?? 0);
    } else {
        if (officePriceEl) officePriceEl.innerText = 'حدد الولاية';
        if (homePriceEl) homePriceEl.innerText = 'حدد الولاية';
    }
    calculateLandingTotal();
    checkSmartOrderButton();
}

export function checkSmartOrderButton() {
    if (!currentLandingProduct) return;
    const wilayaCode = document.getElementById('cust-wilaya')?.value;
    const orderBtn = document.querySelector('#order-form-section button:last-of-type');
    
    if (!orderBtn) return;
    
    // 1. التحقق من توفر الكمية أولاً
    if (currentLandingProduct.inStock === false) {
        orderBtn.innerHTML = `<i class="fa-solid fa-ban"></i> نفدت الكمية مؤقتاً`;
        orderBtn.removeAttribute('onclick');
        orderBtn.className = 'w-full py-4 bg-gray-800 text-gray-400 border border-gray-700 font-extrabold text-lg rounded-2xl cursor-not-allowed flex items-center justify-center gap-2';
        return;
    }

    // 2. إذا لم يحدد الولاية بعد، نتركه للوضع الطبيعي
    if (!wilayaCode) {
        orderBtn.innerHTML = `تأكيد الطلب الآن (الدفع عند الاستلام) 🚚`;
        orderBtn.setAttribute('onclick', 'submitLandingOrder()');
        orderBtn.className = 'w-full py-4 gold-gradient text-black font-extrabold text-lg rounded-2xl shadow-xl hover:opacity-90 transition';
        return;
    }

    const localWilaya = state.storeSettings?.localWilaya;
    const minLocal = Number(state.storeSettings?.minOrderLocal) || 0;
    const minNational = Number(state.storeSettings?.minOrderNational) || 0;

    let requiredMin = (wilayaCode === localWilaya) ? minLocal : minNational;
    let currentPrice = Number(currentLandingProduct.price) || 0;

    if (currentPrice < requiredMin) {
        orderBtn.innerHTML = `أضف إلى السلة لتصل للحد الأدنى (${formatPrice(requiredMin)}) 🛒`;
        orderBtn.setAttribute('onclick', 'addToCartFromLanding()');
        orderBtn.className = 'w-full py-4 bg-[#121212] text-[#D4AF37] border border-[#D4AF37]/50 font-extrabold text-lg rounded-2xl transition hover:bg-[#1a1a1a]';
    } else {
        orderBtn.innerHTML = `تأكيد الطلب الآن (الدفع عند الاستلام) 🚚`;
        orderBtn.setAttribute('onclick', 'submitLandingOrder()');
        orderBtn.className = 'w-full py-4 gold-gradient text-black font-extrabold text-lg rounded-2xl shadow-xl hover:opacity-90 transition';
    }
}

export function addToCartFromLanding() {
    if (!currentLandingProduct) return;
    
    const selectedColor = document.querySelector('input[name="selected_product_color"]:checked')?.value || '';
    const selectedNum = document.querySelector('input[name="selected_product_number"]:checked')?.value || '';
    
    if (typeof window.addToCart === 'function') {
        window.addToCart(currentLandingProduct.id, selectedColor, selectedNum);
        showCustomAlert('تمت الإضافة للسلة 🛒', 'سعر هذا المنتج أقل من الحد الأدنى لولايتك. يرجى إضافة المزيد من المنتجات لتتمكن من إتمام الطلب.', true);
        safeCall('showPage', 'cart');
    } else {
        showCustomAlert('تنبيه', 'يجب أن يصل مجموع طلبك إلى الحد الأدنى لتأكيد التوصيل.', false);
    }
}

export function calculateLandingTotal() {
    if (!currentLandingProduct) return;
    const wilayaCode = document.getElementById('cust-wilaya')?.value;
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    
    let basePrice = Number(currentLandingProduct.price) || 0;
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    const sumProdEl = document.getElementById('sum-prod-price');
    if (sumProdEl) sumProdEl.innerText = formatPrice(basePrice);

    const sumShipEl = document.getElementById('sum-ship-price');
    if (sumShipEl) sumShipEl.innerText = wilayaCode ? formatPrice(shipCost) : 'حدد الولاية';

    const sumTotalEl = document.getElementById('sum-total-price');
    if (sumTotalEl) sumTotalEl.innerText = formatPrice(basePrice + shipCost);
}

export function submitLandingOrder() {
    if (!currentLandingProduct || currentLandingProduct.inStock === false) {
        showCustomAlert('غير متوفر', 'عذراً، هذا المنتج غير متوفر في المخزون حالياً.', false);
        return;
    }

    const name = document.getElementById('cust-name')?.value.trim();
    const rawPhone = document.getElementById('cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('cust-wilaya')?.value;
    const baladiya = document.getElementById('cust-baladiya')?.value.trim() || '';
    const address = document.getElementById('cust-address')?.value.trim() || '';

    if (!name || !wilayaCode || !baladiya || !address) {
        showCustomAlert('تنبيه هام!', state.storeSettings.msgWarning || 'يرجى ملء كافة المعلومات الأساسية!', false);
        return;
    }

    if (!isValidDzPhone(rawPhone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري صحيح مكون من 10 أرقام (يبدأ بـ 05 أو 06 أو 07).', false);
        return;
    }

    // 🌟 حماية إضافية: التحقق من الحد الأدنى للطلب قبل الإرسال الفعلي
    const localWilaya = state.storeSettings?.localWilaya;
    const minLocal = Number(state.storeSettings?.minOrderLocal) || 0;
    const minNational = Number(state.storeSettings?.minOrderNational) || 0;
    const requiredMin = (wilayaCode === localWilaya) ? minLocal : minNational;
    const basePrice = Number(currentLandingProduct.price) || 0;

    if (basePrice < requiredMin) {
        addToCartFromLanding();
        return;
    }

    const wilaya = state.WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    const selectedColor = document.querySelector('input[name="selected_product_color"]:checked')?.value || '';
    const selectedNum = document.querySelector('input[name="selected_product_number"]:checked')?.value || '';
    
    let productDetails = currentLandingProduct.name;
    if (selectedColor) productDetails += ` (اللون: ${selectedColor})`;
    if (selectedNum) productDetails += ` (الدرجة: ${selectedNum})`;

    const shippingTypeText = shipType === 'office' ? 'استلام من المكتب' : 'توصيل للمنزل';

    const newOrder = {
        customer: name,
        phone: rawPhone.replace(/\s+/g, ''),
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: `البلدية: ${baladiya} | العنوان: ${address} (${shippingTypeText})`,
        product: productDetails,
        total: basePrice + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    if (typeof window.db !== 'undefined') {
        window.db.collection("orders").add(newOrder).then(() => {
            // تفريغ حقول الاستمارة بعد نجاح الطلب
            ['cust-name', 'cust-phone', 'cust-wilaya', 'cust-baladiya', 'cust-address'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            showCustomAlert('تم استلام طلبك! 🎉', state.storeSettings.msgSuccess || 'تم تسجيل طلبك بنجاح!', true);
            safeCall('showPage', 'home');
        }).catch(err => showCustomAlert('خطأ', 'حدث خطأ: ' + err.message, false));
    }
}

function renderLandingDynamicOptions(p) {
    const container = document.getElementById('landing-options-container');
    if (!container) return;
    let html = '';
    
    if (p.jewelryMetal || p.jewelryType) {
        html += `<div class="bg-black/50 p-3 rounded-xl border border-gray-800 text-xs text-gray-200">
            <span class="text-[#D4AF37] font-bold">المعدن/النوع:</span> ${p.jewelryMetal || ''} (${p.jewelryType || ''})
        </div>`;
    }
    
    if (p.colors && p.colors.trim().length > 0) {
        const colorsArr = p.colors.split(/[,،]/).map(c => c.trim()).filter(Boolean);
        html += `<div class="space-y-1.5 pt-1"><label class="block text-xs font-bold text-gray-300">اختر اللون المتوفر *</label><div class="flex flex-wrap gap-2">
                ${colorsArr.map((col, idx) => `
                    <label class="border border-gray-800 bg-black/60 px-3 py-1.5 rounded-xl text-xs text-white cursor-pointer hover:border-[#D4AF37] flex items-center gap-2">
                        <input type="radio" name="selected_product_color" value="${col}" ${idx === 0 ? 'checked' : ''} class="accent-[#D4AF37]">
                        <span>${col}</span>
                    </label>
                `).join('')}
            </div></div>`;
    }

    if (p.numbers && p.numbers.trim().length > 0) {
        const numsArr = p.numbers.split(/[,،]/).map(n => n.trim()).filter(Boolean);
        html += `<div class="space-y-1.5 pt-1"><label class="block text-xs font-bold text-gray-300">اختر الرقم / الدرجة *</label><div class="flex flex-wrap gap-2">
                ${numsArr.map((num, idx) => `
                    <label class="border border-gray-800 bg-black/60 px-3 py-1.5 rounded-xl text-xs text-white cursor-pointer hover:border-[#D4AF37] flex items-center gap-2">
                        <input type="radio" name="selected_product_number" value="${num}" ${idx === 0 ? 'checked' : ''} class="accent-[#D4AF37]">
                        <span>الدرجة ${num}</span>
                    </label>
                `).join('')}
            </div></div>`;
    }
    container.innerHTML = html;
}

export function openLightbox() {
    const mainImg = document.getElementById('landing-main-img')?.src;
    const lightboxModal = document.getElementById('image-lightbox-modal');
    const lightboxTarget = document.getElementById('lightbox-target-img');
    if (lightboxModal && lightboxTarget && mainImg) {
        lightboxTarget.src = mainImg;
        lightboxModal.classList.remove('hidden');
        lightboxModal.classList.add('flex');
    }
}

export function closeLightbox() {
    const lightboxModal = document.getElementById('image-lightbox-modal');
    if (lightboxModal) {
        lightboxModal.classList.add('hidden');
        lightboxModal.classList.remove('flex');
    }
}

// Window Binding
window.openLandingPage = openLandingPage;
window.swapLandingMainImage = swapLandingMainImage;
window.populateWilayas = populateWilayas;
window.handleWilayaChange = handleWilayaChange;
window.calculateLandingTotal = calculateLandingTotal;
window.submitLandingOrder = submitLandingOrder;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.checkSmartOrderButton = checkSmartOrderButton;
window.addToCartFromLanding = addToCartFromLanding;
