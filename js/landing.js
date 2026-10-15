// --- ملف js/landing.js ---

import { state } from './store/state.js';
import { formatPrice, showCustomAlert, safeCall, calculateShippingCost } from './utils/helpers.js';

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
        thumbsContainer.innerHTML = imagesList.map((imgUrl) => `
            <div onclick="swapLandingMainImage('${imgUrl}')" class="w-16 h-16 rounded-xl border-2 border-gray-800 hover:border-[#D4AF37] p-1 cursor-pointer bg-black overflow-hidden shadow-sm">
                <img src="${imgUrl}" class="w-full h-full object-contain" loading="lazy">
            </div>
        `).join('');
    }

    populateWilayas();
    calculateLandingTotal();
    safeCall('showPage', 'landing');

    setTimeout(() => {
        const orderSection = document.getElementById('order-form-section');
        if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth' });
    }, 200);
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
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        state.WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

export function handleWilayaChange() {
    const code = document.getElementById('cust-wilaya').value;
    const wilaya = state.WILAYAS.find(w => w.code === code);
    
    const officePriceEl = document.getElementById('price-shipping-office');
    const homePriceEl = document.getElementById('price-shipping-home');

    if (wilaya) {
        if (officePriceEl) officePriceEl.innerText = formatPrice(wilaya.officeCost);
        if (homePriceEl) homePriceEl.innerText = formatPrice(wilaya.homeCost || wilaya.officeCost);
    } else {
        if (officePriceEl) officePriceEl.innerText = 'حدد الولاية';
        if (homePriceEl) homePriceEl.innerText = 'حدد الولاية';
    }
    calculateLandingTotal();
}

export function calculateLandingTotal() {
    if (!currentLandingProduct) return;
    const wilayaCode = document.getElementById('cust-wilaya')?.value;
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    
    let basePrice = currentLandingProduct.price || 0;
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    const sumProdEl = document.getElementById('sum-prod-price');
    if (sumProdEl) sumProdEl.innerText = formatPrice(basePrice);

    const sumShipEl = document.getElementById('sum-ship-price');
    if (sumShipEl) sumShipEl.innerText = wilayaCode ? formatPrice(shipCost) : 'حدد الولاية';

    const sumTotalEl = document.getElementById('sum-total-price');
    if (sumTotalEl) sumTotalEl.innerText = formatPrice(basePrice + shipCost);
}

export function submitLandingOrder() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const wilayaCode = document.getElementById('cust-wilaya').value;
    const commune = document.getElementById('cust-commune').value.trim();

    if (!name || !wilayaCode || !commune) {
        showCustomAlert('تنبيه هام!', state.storeSettings.msgWarning, false);
        return;
    }

    if (typeof window.isValidDzPhone === 'function' && !window.isValidDzPhone(phone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام.', false);
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
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: `${commune} (${shippingTypeText})`,
        product: productDetails,
        total: (currentLandingProduct.price || 0) + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    if (typeof window.db !== 'undefined') {
        window.db.collection("orders").add(newOrder).then(() => {
            showCustomAlert('تم استلام طلبك! 🎉', state.storeSettings.msgSuccess, true);
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
        const colorsArr = p.colors.split(',').map(c => c.trim()).filter(Boolean);
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
        const numsArr = p.numbers.split(',').map(n => n.trim()).filter(Boolean);
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
    const mainImg = document.getElementById('landing-main-img').src;
    const lightboxModal = document.getElementById('image-lightbox-modal');
    const lightboxTarget = document.getElementById('lightbox-target-img');
    if (lightboxModal && lightboxTarget) {
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
