let currentLandingProduct = null;

function openLandingPage(productId) {
    currentLandingProduct = products.find(p => p.id === productId);
    if (!currentLandingProduct) return;

    const mainImg = currentLandingProduct.images && currentLandingProduct.images.length > 0 
        ? currentLandingProduct.images[0] 
        : 'https://via.placeholder.com/500';
        
    document.getElementById('landing-main-img').src = mainImg;
    document.getElementById('landing-title').innerText = currentLandingProduct.name;
    document.getElementById('landing-category').innerText = currentLandingProduct.category || 'عام';
    document.getElementById('landing-price').innerText = (currentLandingProduct.price || 0).toLocaleString() + ' دج';
    document.getElementById('landing-old-price').innerText = currentLandingProduct.oldPrice ? currentLandingProduct.oldPrice.toLocaleString() + ' دج' : '';
    document.getElementById('landing-desc').innerText = currentLandingProduct.desc || '';

    renderLandingDynamicOptions(currentLandingProduct);

    const cdBox = document.getElementById('landing-countdown-box');
    if (currentLandingProduct.hasCountdown && currentLandingProduct.countdownHours > 0) {
        cdBox.classList.remove('hidden');
        startCountdownTimer(currentLandingProduct.countdownHours);
    } else {
        cdBox.classList.add('hidden');
        if (window.cdInterval) clearInterval(window.cdInterval);
    }

    const thumbsContainer = document.getElementById('landing-thumbnails-list');
    const imagesList = currentLandingProduct.images && currentLandingProduct.images.length > 0 
        ? currentLandingProduct.images 
        : [mainImg];

    thumbsContainer.innerHTML = imagesList.map((imgUrl) => `
        <div onclick="swapLandingMainImage('${imgUrl}')" class="w-16 h-16 rounded-xl border-2 border-gray-800 hover:border-[#D4AF37] p-1 cursor-pointer bg-black overflow-hidden shadow-sm">
            <img src="${imgUrl}" class="w-full h-full object-contain">
        </div>
    `).join('');

    populateWilayas();
    calculateLandingTotal();
    showPage('landing');
}

function renderLandingDynamicOptions(p) {
    const container = document.getElementById('landing-options-container');
    if (!container) return;

    let html = '';

    if (p.skinType) {
        html += `<div class="bg-black/50 p-3 rounded-xl border border-gray-800 text-xs">
            <span class="text-[#D4AF37] font-bold">نوع البشرة المناسب:</span> <span class="text-white font-semibold">${p.skinType}</span>
        </div>`;
    }

    if (p.hairType) {
        html += `<div class="bg-black/50 p-3 rounded-xl border border-gray-800 text-xs">
            <span class="text-[#D4AF37] font-bold">نوع الشعر المناسب:</span> <span class="text-white font-semibold">${p.hairType}</span>
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
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
        mainImg.src = newUrl;
        mainImg.style.opacity = '1';
    }, 150);
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
            
        document.getElementById('price-shipping-office').innerText = (wilaya.officeCost || 0) + ' دج';
    } else if (communeSelect) {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
        document.getElementById('price-shipping-office').innerText = 'حدد الولاية';
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

    document.getElementById('price-shipping-home').innerText = (wilaya && communeName) ? shipCost + ' دج' : 'حدد البلدية';
    document.getElementById('sum-prod-price').innerText = basePrice.toLocaleString() + ' دج';
    document.getElementById('sum-ship-price').innerText = shipCost.toLocaleString() + ' دج';
    document.getElementById('sum-total-price').innerText = (basePrice + shipCost).toLocaleString() + ' دج';
    document.getElementById('sticky-bar-price').innerText = (basePrice + shipCost).toLocaleString() + ' دج';
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
    document.getElementById('order-form-section').scrollIntoView({ behavior: 'smooth' });
}

function showCustomAlert(title, message, isSuccess = true) {
    const modal = document.getElementById('custom-alert-modal');
    const iconBox = document.getElementById('alert-icon-box');
    const icon = document.getElementById('alert-icon');
    const titleEl = document.getElementById('alert-title');
    const msgEl = document.getElementById('alert-message');

    if (!modal) return;

    titleEl.innerText = title;
    msgEl.innerText = message;

    if (isSuccess) {
        iconBox.className = "w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto text-black text-2xl shadow-lg";
        icon.className = "fa-solid fa-check";
    } else {
        iconBox.className = "w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-500 text-2xl shadow-lg";
        icon.className = "fa-solid fa-circle-exclamation";
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
