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
    loadSavedCustomerData();
    calculateLandingTotal();
    showPage('landing');
}

function loadSavedCustomerData() {
    const savedName = localStorage.getItem('lb_cust_name');
    const savedPhone = localStorage.getItem('lb_cust_phone');
    const savedWilaya = localStorage.getItem('lb_cust_wilaya');

    if (savedName) document.getElementById('cust-name').value = savedName;
    if (savedPhone) document.getElementById('cust-phone').value = savedPhone;
    if (savedWilaya) {
        document.getElementById('cust-wilaya').value = savedWilaya;
        handleWilayaChange();
    }
}

function clearSavedCustomerData() {
    localStorage.removeItem('lb_cust_name');
    localStorage.removeItem('lb_cust_phone');
    localStorage.removeItem('lb_cust_wilaya');
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-wilaya').value = '';
    document.getElementById('cust-commune').innerHTML = '<option value="">اختر البلدية...</option>';
    showCustomAlert('تم المسح', 'يمكنك الآن إدخال بيانات الشخص الجديد والعنوان الجديد.', true);
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
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} -${w.name}</option>`).join('');
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
    document.getElementById('sum-ship-price').innerText = shipCost.toLocaleString() + ' دج';
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
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const wilayaCode = document.getElementById('cust-wilaya').value;
    const commune = document.getElementById('cust-commune').value;

    const warnMsg = storeSettings.msgWarning || 'يرجى ملء كافة معلومات الاستمارة الضرورية!';
    const succMsg = storeSettings.msgSuccess || 'تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.';

    if (!name || !phone || !wilayaCode) {
        showCustomAlert('تنبيه هام!', warnMsg, false);
        return;
    }

    localStorage.setItem('lb_cust_name', name);
    localStorage.setItem('lb_cust_phone', phone);
    localStorage.setItem('lb_cust_wilaya', wilayaCode);

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    const shipCost = shipType === 'home' ? wilaya.homeCost : wilaya.officeCost;
    const affiliateRef = localStorage.getItem('lb_affiliate_ref') || 'مباشر';

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya.name,
        commune: commune,
        product: currentLandingProduct.name,
        total: currentLandingProduct.price + shipCost,
        affiliateRef: affiliateRef,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        showCustomAlert('تم استلام طلبك! 🎉', succMsg, true);
        showPage('home');
    });
}
