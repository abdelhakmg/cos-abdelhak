let currentLandingProduct = null;

function openLandingPage(productId) {
    currentLandingProduct = products.find(p => p.id === productId);
    if (!currentLandingProduct) return;

    let mainImg = 'https://via.placeholder.com/500';
    if (currentLandingProduct.images && Array.isArray(currentLandingProduct.images) && currentLandingProduct.images[0]) {
        mainImg = currentLandingProduct.images[0];
    } else if (currentLandingProduct.image) {
        mainImg = currentLandingProduct.image;
    }
        
    const landingImgEl = document.getElementById('landing-main-img');
    if (landingImgEl) landingImgEl.src = mainImg;

    const landingTitleEl = document.getElementById('landing-title');
    if (landingTitleEl) landingTitleEl.innerText = currentLandingProduct.name || '';

    const landingCatEl = document.getElementById('landing-category');
    if (landingCatEl) landingCatEl.innerText = currentLandingProduct.category || 'عام';

    const landingPriceEl = document.getElementById('landing-price');
    if (landingPriceEl) landingPriceEl.innerText = (currentLandingProduct.price || 0).toLocaleString() + ' دج';

    const landingOldPriceEl = document.getElementById('landing-old-price');
    if (landingOldPriceEl) landingOldPriceEl.innerText = currentLandingProduct.oldPrice ? currentLandingProduct.oldPrice.toLocaleString() + ' دج' : '';

    const landingDescEl = document.getElementById('landing-desc');
    if (landingDescEl) landingDescEl.innerText = currentLandingProduct.desc || '';

    renderLandingDynamicOptions(currentLandingProduct);

    const cdBox = document.getElementById('landing-countdown-box');
    if (cdBox) {
        if (currentLandingProduct.hasCountdown && currentLandingProduct.countdownHours > 0) {
            cdBox.classList.remove('hidden');
            startCountdownTimer(currentLandingProduct.countdownHours);
        } else {
            cdBox.classList.add('hidden');
            if (window.cdInterval) clearInterval(window.cdInterval);
        }
    }

    const thumbsContainer = document.getElementById('landing-thumbnails-list');
    if (thumbsContainer) {
        const imagesList = (currentLandingProduct.images && Array.isArray(currentLandingProduct.images) && currentLandingProduct.images.length > 0) 
            ? currentLandingProduct.images 
            : [mainImg];

        thumbsContainer.innerHTML = imagesList.map((imgUrl) => `
            <div onclick="swapLandingMainImage('${imgUrl}')" class="w-16 h-16 rounded-xl border-2 border-gray-800 hover:border-[#D4AF37] p-1 cursor-pointer bg-black overflow-hidden shadow-sm">
                <img src="${imgUrl}" class="w-full h-full object-contain">
            </div>
        `).join('');
    }

    populateWilayas();
    calculateLandingTotal();
    showPage('landing');

    setTimeout(() => {
        const orderSection = document.getElementById('order-form-section');
        if (orderSection) {
            orderSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 200);
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

    if (p.giftboxShape) {
        html += `<div class="bg-black/50 p-3 rounded-xl border border-gray-800 text-xs text-gray-200">
            <span class="text-[#D4AF37] font-bold">شكل العلبة:</span> ${p.giftboxShape}
        </div>`;
    }

    if (p.colors && p.colors.trim().length > 0) {
        const colorsArr = p.colors.split(',').map(c => c.trim()).filter(Boolean);
        html += `<div class="space-y-1.5 pt-1">
            <label class="block text-xs font-bold text-gray-300">اختر اللون المتوفر *</label>
            <div class="flex flex-wrap gap-2" id="landing-colors-selection">
                ${colorsArr.map((col, idx) => `
                    <label class="border border-gray-800 bg-black/60 px-3 py-1.5 rounded-xl text-xs text-white cursor-pointer hover:border-[#D4AF37] transition flex items-center gap-2">
                        <input type="radio" name="selected_product_color" value="${col}" ${idx === 0 ? 'checked' : ''} class="accent-[#D4AF37]">
                        <span>${col}</span>
                    </label>
                `).join('')}
            </div>
        </div>`;
    }

    if (p.numbers && p.numbers.trim().length > 0) {
        const numsArr = p.numbers.split(',').map(n => n.trim()).filter(Boolean);
        html += `<div class="space-y-1.5 pt-1">
            <label class="block text-xs font-bold text-gray-300">اختر الرقم / الدرجة *</label>
            <div class="flex flex-wrap gap-2" id="landing-numbers-selection">
                ${numsArr.map((num, idx) => `
                    <label class="border border-gray-800 bg-black/60 px-3 py-1.5 rounded-xl text-xs text-white cursor-pointer hover:border-[#D4AF37] transition flex items-center gap-2">
                        <input type="radio" name="selected_product_number" value="${num}" ${idx === 0 ? 'checked' : ''} class="accent-[#D4AF37]">
                        <span>الدرجة ${num}</span>
                    </label>
                `).join('')}
            </div>
        </div>`;
    }

    container.innerHTML = html;
}

function openLightbox() {
    const mainImg = document.getElementById('landing-main-img').src;
    const lightboxModal = document.getElementById('image-lightbox-modal');
    const lightboxTarget = document.getElementById('lightbox-target-img');
    if (lightboxModal && lightboxTarget) {
        lightboxTarget.src = mainImg;
        lightboxModal.classList.remove('hidden');
        lightboxModal.classList.add('flex');
    }
}

function closeLightbox() {
    const lightboxModal = document.getElementById('image-lightbox-modal');
    if (lightboxModal) {
        lightboxModal.classList.add('hidden');
        lightboxModal.classList.remove('flex');
    }
}

function swapLandingMainImage(newUrl) {
    const mainImg = document.getElementById('landing-main-img');
    if (mainImg) {
        mainImg.style.opacity = '0.3';
        setTimeout(() => {
            mainImg.src = newUrl;
            mainImg.style.opacity = '1';
        }, 150);
    }
}

function populateWilayas() {
    const select = document.getElementById('cust-wilaya');
    if (!select) return;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleWilayaChange() {
    const code = document.getElementById('cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeSelect = document.getElementById('cust-commune');
    
    if (wilaya && communeSelect) {
        const communesList = wilaya.communesData || [];
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>' + 
            communesList.map(c => `<option value="${c.name}">${c.name} (${c.cost} دج)</option>`).join('');
            
        const officePriceEl = document.getElementById('price-shipping-office');
        if (officePriceEl) officePriceEl.innerText = (wilaya.officeCost || 0) + ' دج';
    } else if (communeSelect) {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
        const officePriceEl = document.getElementById('price-shipping-office');
        if (officePriceEl) officePriceEl.innerText = 'حدد الولاية';
    }
    calculateLandingTotal();
}

function calculateLandingTotal() {
    if (!currentLandingProduct) return;
    const code = document.getElementById('cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeName = document.getElementById('cust-commune').value;
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    
    let basePrice = currentLandingProduct.price || 0;
    let shipCost = 0;

    if (wilaya) {
        if (shipType === 'office') {
            shipCost = wilaya.officeCost || 0;
        } else {
            const communeObj = (wilaya.communesData || []).find(c => c.name === communeName);
            shipCost = communeObj ? communeObj.cost : (wilaya.communesData && wilaya.communesData[0] ? wilaya.communesData[0].cost : 0);
        }
    }

    const homePriceEl = document.getElementById('price-shipping-home');
    if (homePriceEl) homePriceEl.innerText = (wilaya && communeName) ? shipCost + ' دج' : 'حدد البلدية';

    const sumProdEl = document.getElementById('sum-prod-price');
    if (sumProdEl) sumProdEl.innerText = basePrice.toLocaleString() + ' دج';

    const sumShipEl = document.getElementById('sum-ship-price');
    if (sumShipEl) sumShipEl.innerText = shipCost.toLocaleString() + ' دج';

    const sumTotalEl = document.getElementById('sum-total-price');
    if (sumTotalEl) sumTotalEl.innerText = (basePrice + shipCost).toLocaleString() + ' دج';
    
    const stickyPrice = document.getElementById('sticky-bar-price');
    if (stickyPrice) stickyPrice.innerText = (basePrice + shipCost).toLocaleString() + ' دج';
}

function isValidDzPhone(phone) {
    const cleanPhone = phone.trim();
    const dzPhoneRegex = /^(05|06|07)[0-9]{8}$/;
    return dzPhoneRegex.test(cleanPhone);
}

function submitLandingOrder() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const wilayaCode = document.getElementById('cust-wilaya').value;
    const commune = document.getElementById('cust-commune').value;

    if (!name || !wilayaCode) {
        showCustomAlert('تنبيه هام!', storeSettings.msgWarning || 'يرجى ملء كافة معلومات الاستمارة الضرورية!', false);
        return;
    }

    if (!isValidDzPhone(phone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام ويبدأ بـ 05 أو 06 أو 07.', false);
        return;
    }

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    
    let shipCost = 0;
    if (wilaya) {
        if (shipType === 'office') {
            shipCost = wilaya.officeCost || 0;
        } else {
            const communeObj = (wilaya.communesData || []).find(c => c.name === commune);
            shipCost = communeObj ? communeObj.cost : (wilaya.officeCost || 0);
        }
    }

    const selectedColor = document.querySelector('input[name="selected_product_color"]:checked')?.value || '';
    const selectedNum = document.querySelector('input[name="selected_product_number"]:checked')?.value || '';
    
    let productDetails = currentLandingProduct.name;
    if (selectedColor) productDetails += ` (اللون: ${selectedColor})`;
    if (selectedNum) productDetails += ` (الدرجة: ${selectedNum})`;

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: commune || 'المكتب',
        product: productDetails,
        total: (currentLandingProduct.price || 0) + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        showCustomAlert('تم استلام طلبك! 🎉', storeSettings.msgSuccess || 'تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.', true);
        showPage('home');
    }).catch(err => {
        showCustomAlert('خطأ', 'حدث خطأ أثناء إرسال الطلب: ' + err.message, false);
    });
}

function startCountdownTimer(hours) {
    let duration = hours * 3600;
    if (window.cdInterval) clearInterval(window.cdInterval);

    window.cdInterval = setInterval(() => {
        if (duration <= 0) {
            clearInterval(window.cdInterval);
            return;
        }
        duration--;

        const h = Math.floor(duration / 3600);
        const m = Math.floor((duration % 3600) / 60);
        const s = duration % 60;

        if (document.getElementById('cd-hours')) document.getElementById('cd-hours').innerText = String(h).padStart(2, '0');
        if (document.getElementById('cd-minutes')) document.getElementById('cd-minutes').innerText = String(m).padStart(2, '0');
        if (document.getElementById('cd-seconds')) document.getElementById('cd-seconds').innerText = String(s).padStart(2, '0');
    }, 1000);
}

function scrollToOrderForm() {
    const orderSection = document.getElementById('order-form-section');
    if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth' });
}
