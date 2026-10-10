let currentBSProduct = null;

// فتح اللوحة السفلية المنبثقة
function openBottomSheet(productId) {
    currentBSProduct = products.find(p => p.id === productId);
    if (!currentBSProduct) return;

    const mainImg = currentBSProduct.images && currentBSProduct.images.length > 0 
        ? currentBSProduct.images[0] 
        : 'https://via.placeholder.com/500';

    document.getElementById('bs-main-img').src = mainImg;
    document.getElementById('bs-title').innerText = currentBSProduct.name;
    document.getElementById('bs-category').innerText = currentBSProduct.category || 'عام';
    document.getElementById('bs-price').innerText = currentBSProduct.price.toLocaleString() + ' دج';
    document.getElementById('bs-old-price').innerText = currentBSProduct.oldPrice ? currentBSProduct.oldPrice.toLocaleString() + ' دج' : '';
    document.getElementById('bs-desc').innerText = currentBSProduct.desc || '';

    const thumbsContainer = document.getElementById('bs-thumbnails-list');
    const imagesList = currentBSProduct.images && currentBSProduct.images.length > 0 ? currentBSProduct.images : [mainImg];

    thumbsContainer.innerHTML = imagesList.map((imgUrl) => `
        <div onclick="swapBSMainImage('${imgUrl}')" class="w-12 h-12 rounded-xl border border-gray-800 hover:border-[#D4AF37] p-1 cursor-pointer bg-black overflow-hidden">
            <img src="${imgUrl}" class="w-full h-full object-contain">
        </div>
    `).join('');

    populateBSWilayas();
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

    setTimeout(() => {
        backdrop.classList.add('hidden');
    }, 300);
}

// تكبير الصور (Image Zoom Lightbox)
function openLightbox(imgSrc) {
    const modal = document.getElementById('image-lightbox-modal');
    const img = document.getElementById('lightbox-target-img');
    if (modal && img) {
        img.src = imgSrc;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeLightbox() {
    const modal = document.getElementById('image-lightbox-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function swapBSMainImage(newUrl) {
    const mainImg = document.getElementById('bs-main-img');
    mainImg.style.opacity = '0.3';
    setTimeout(() => {
        mainImg.src = newUrl;
        mainImg.style.opacity = '1';
    }, 150);
}

function populateBSWilayas() {
    const select = document.getElementById('bs-cust-wilaya');
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleBSWilayaChange() {
    const code = document.getElementById('bs-cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeSelect = document.getElementById('bs-cust-commune');
    
    if (wilaya) {
        communeSelect.innerHTML = wilaya.communes.map(c => `<option value="${c}">${c}</option>`).join('');
    } else {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
    }
    calculateBSTotal();
}

function calculateBSTotal() {
    if (!currentBSProduct) return;
    const code = document.getElementById('bs-cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const shipType = document.querySelector('input[name="bs_shipping_type"]:checked')?.value || 'home';
    
    let basePrice = currentBSProduct.price;
    let shipCost = wilaya ? (shipType === 'home' ? wilaya.homeCost : wilaya.officeCost) : 0;
    let grandTotal = basePrice + shipCost;

    document.getElementById('bs-sum-prod').innerText = basePrice.toLocaleString() + ' دج';
    document.getElementById('bs-sum-ship').innerText = wilaya ? shipCost.toLocaleString() + ' دج' : '0 دج (حدد الولاية)';
    document.getElementById('bs-sum-total').innerText = grandTotal.toLocaleString() + ' دج';
}

function submitBSOrder() {
    const name = document.getElementById('bs-cust-name').value.trim();
    const phone = document.getElementById('bs-cust-phone').value.trim();
    const wilayaCode = document.getElementById('bs-cust-wilaya').value;
    const commune = document.getElementById('bs-cust-commune').value;

    if (!name) {
        showCustomAlert('تنبيه', 'يرجى كتابة الاسم واللقب!', false);
        return;
    }

    if (!isAlgerianPhoneValid(phone)) {
        showCustomAlert('رقم هاتف غير صحيح ❌', 'يرجى كتابة رقم هاتف جزائري صحيح يبدأ بـ 05 أو 06 أو 07 ومكون من 10 أرقام.', false);
        return;
    }

    if (!wilayaCode) {
        showCustomAlert('تنبيه', 'يرجى اختيار الولاية!', false);
        return;
    }

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="bs_shipping_type"]:checked')?.value || 'home';
    const shipCost = shipType === 'home' ? wilaya.homeCost : wilaya.officeCost;
    const totalAmount = currentBSProduct.price + shipCost;

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya.name,
        commune: commune,
        product: currentBSProduct.name,
        total: totalAmount,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        closeBottomSheet();
        showCustomAlert('تم استلام طلبك! 🎉', 'تم تسليم طلبك بنجاح وسنتصل بك هاتفياً لتأكيد التوصيل.', true);
    });
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
