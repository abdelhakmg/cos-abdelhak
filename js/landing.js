// js/landing.js - إدارة اللوحة السفلية ومكبر الصور

let currentBSProduct = null;

function openBottomSheet(productId) {
    currentBSProduct = products.find(p => p.id === productId);
    if (!currentBSProduct) return;

    const mainImg = (currentBSProduct.images && currentBSProduct.images[0]) || 'https://via.placeholder.com/300';
    document.getElementById('bs-main-img').src = mainImg;
    document.getElementById('bs-title').innerText = currentBSProduct.name;
    document.getElementById('bs-category').innerText = currentBSProduct.category || 'عام';
    document.getElementById('bs-price').innerText = currentBSProduct.price.toLocaleString() + ' دج';
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

// مكبر الصورة المباشر بنقرة واحدة
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
    orders.push({ id: Date.now().toString(), customer: name, phone, wilaya: wilaya.name, commune: '', product: currentBSProduct.name, total: currentBSProduct.price + wilaya.homeCost, status: 'جديد' });

    closeBottomSheet();
    showCustomAlert('تم الطلب 🎉', 'تم تسليم طلبك بنجاح وسنتصل بك لتأكيد التوصيل.', true);
}

function showCustomAlert(title, message, isSuccess = true) {
    const modal = document.getElementById('custom-alert-modal');
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
