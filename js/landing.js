let currentLandingProduct = null;
let currentBSProduct = null;

function openLandingPage(productId) {
    currentLandingProduct = products.find(p => p.id === productId);
    if (!currentLandingProduct) return;

    const mainImg = currentLandingProduct.images && currentLandingProduct.images.length > 0 
        ? currentLandingProduct.images[0] 
        : 'https://via.placeholder.com/500';
        
    document.getElementById('landing-main-img').src = mainImg;
    document.getElementById('landing-title').innerText = currentLandingProduct.name;
    document.getElementById('landing-category').innerText = currentLandingProduct.category || 'عام';
    document.getElementById('landing-price').innerText = currentLandingProduct.price.toLocaleString() + ' دج';
    document.getElementById('landing-old-price').innerText = currentLandingProduct.oldPrice ? currentLandingProduct.oldPrice.toLocaleString() + ' دج' : '';
    document.getElementById('landing-desc').innerText = currentLandingProduct.desc || '';

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

// دالة فتح اللوحة السفلية للطلب السريع المباشر (Bottom Sheet Checkout)
function openBottomSheet(productId) {
    currentBSProduct = products.find(p => p.id === productId);
    if (!currentBSProduct) return;

    const mainImg = (currentBSProduct.images && currentBSProduct.images[0]) || 'https://via.placeholder.com/300';
    document.getElementById('bs-main-img').src = mainImg;
    document.getElementById('bs-title').innerText = currentBSProduct.name;
    document.getElementById('bs-category').innerText = currentBSProduct.category || 'عام';
    document.getElementById('bs-price').innerText = currentBSProduct.price.toLocaleString() + ' دج';
    document.getElementById('bs-old-price').innerText = currentBSProduct.oldPrice ? currentBSProduct.oldPrice.toLocaleString() + ' دج' : '';
    document.getElementById('bs-desc').innerText = currentBSProduct.desc || '';

    const select = document.getElementById('bs-cust-wilaya');
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');

    calculateBSTotal();

    const backdrop = document.getElementById('bottom-sheet-backdrop');
    const sheet = document.getElementById('bottom-sheet-modal');
    backdrop.classList.remove('hidden');
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        sheet.classList.remove('translate-y-full');
    }, 10);
}

function closeBottomSheet() {
    const backdrop = document.getElementById('bottom-sheet-backdrop');
    const sheet = document.getElementById('bottom-sheet-modal');
    backdrop.classList.add('opacity-0');
    sheet.classList.add('translate-y-full');
    setTimeout(() => backdrop.classList.add('hidden'), 300);
}

function handleBSWilayaChange() {
    const code = document.getElementById('bs-cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeSelect = document.getElementById('bs-cust-commune');

    if (wilaya && communeSelect) {
        communeSelect.innerHTML = wilaya.communes.map(c => `<option value="${c}">${c}</option>`).join('');
    } else if (communeSelect) {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
    }
    calculateBSTotal();
}

function calculateBSTotal() {
    if (!currentBSProduct) return;
    const code = document.getElementById('bs-cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const shipType = document.querySelector('input[name="bs_shipping_type"]:checked')?.value || 'home';

    let shipCost = wilaya ? (shipType === 'home' ? wilaya.homeCost : wilaya.officeCost) : 0;
    let total = currentBSProduct.price + shipCost;

    document.getElementById('bs-sum-prod').innerText = currentBSProduct.price.toLocaleString() + ' دج';
    document.getElementById('bs-sum-ship').innerText = wilaya ? shipCost.toLocaleString() + ' دج' : '0 دج (حدد الولاية)';
    document.getElementById('bs-sum-total').innerText = total.toLocaleString() + ' دج';
}

function submitBSOrder() {
    const name = document.getElementById('bs-cust-name').value.trim();
    const phone = document.getElementById('bs-cust-phone').value.trim();
    const wilayaCode = document.getElementById('bs-cust-wilaya').value;

    if (!name) return showCustomAlert('تنبيه', 'يرجى كتابة الاسم واللقب!', false);
    if (!isAlgerianPhoneValid(phone)) return showCustomAlert('خطأ', 'يرجى إدخال رقم هاتف جزائري صحيح مكون من 10 أرقام (05/06/07).', false);
    if (!wilayaCode) return showCustomAlert('تنبيه', 'يرجى اختيار الولاية!', false);

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="bs_shipping_type"]:checked')?.value || 'home';
    const shipCost = shipType === 'home' ? wilaya.homeCost : wilaya.officeCost;

    db.collection("orders").add({
        customer: name,
        phone: phone,
        wilaya: wilaya.name,
        commune: document.getElementById('bs-cust-commune').value || '',
        product: currentBSProduct.name,
        total: currentBSProduct.price + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    }).then(() => {
        closeBottomSheet();
        showCustomAlert('تم الطلب 🎉', 'تم تسليم طلبك بنجاح وسنتصل بك لتأكيد التوصيل.', true);
    });
}

function openLightbox(imgSrc) {
    const targetSrc = imgSrc || document.getElementById('landing-main-img').src;
    const lightboxModal = document.getElementById('image-lightbox-modal');
    const lightboxTarget = document.getElementById('lightbox-target-img');
    if (lightboxModal && lightboxTarget) {
        lightboxTarget.src = targetSrc;
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
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleWilayaChange() {
    const code = document.getElementById('cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeSelect = document.getElementById('cust-commune');
    
    if (wilaya) {
        communeSelect.innerHTML = wilaya.communes.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('price-shipping-home').innerText = wilaya.homeCost + ' دج';
        document.getElementById('price-shipping-office').innerText = wilaya.officeCost + ' دج';
    } else {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
        document.getElementById('price-shipping-home').innerText = 'حدد الولاية';
        document.getElementById('price-shipping-office').innerText = 'حدد الولاية';
    }
    calculateLandingTotal();
}

function calculateLandingTotal() {
    if (!currentLandingProduct) return;
    const code = document.getElementById('cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    
    let basePrice = currentLandingProduct.price;
    let shipCost = wilaya ? (shipType === 'home' ? wilaya.homeCost : wilaya.officeCost) : 0;
    let grandTotal = basePrice + shipCost;

    document.getElementById('sum-prod-price').innerText = basePrice.toLocaleString() + ' دج';
    document.getElementById('sum-ship-price').innerText = wilaya ? shipCost.toLocaleString() + ' دج' : '0 دج (حدد الولاية)';
    document.getElementById('sum-total-price').innerText = grandTotal.toLocaleString() + ' دج';
    document.getElementById('sticky-bar-price').innerText = grandTotal.toLocaleString() + ' دج';
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
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function submitLandingOrder() {
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const wilayaCode = document.getElementById('cust-wilaya').value;
    const commune = document.getElementById('cust-commune').value;

    const warnMsg = storeSettings.msgWarning || 'يرجى ملء كافة معلومات الاستمارة الضرورية!';
    const succMsg = storeSettings.msgSuccess || 'تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.';

    if (!name || !wilayaCode) {
        showCustomAlert('تنبيه هام!', warnMsg, false);
        return;
    }

    if (!isAlgerianPhoneValid(phone)) {
        showCustomAlert('رقم هاتف غير صحيح ❌', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام ويبدأ حصراً بـ 05 أو 06 أو 07.', false);
        return;
    }

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    const shipCost = shipType === 'home' ? wilaya.homeCost : wilaya.officeCost;

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya.name,
        commune: commune,
        product: currentLandingProduct.name,
        total: currentLandingProduct.price + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        showCustomAlert('تم استلام طلبك! 🎉', succMsg, true);
        showPage('home');
    });
}
