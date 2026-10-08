let currentLandingProduct = null;

function openLandingPage(productId) {
    currentLandingProduct = products.find(p => p.id === productId);
    if (!currentLandingProduct) return;

    const mainImg = currentLandingProduct.images && currentLandingProduct.images.length > 0 
        ? currentLandingProduct.images[0] 
        : 'https://via.placeholder.com/500';
        
    document.getElementById('landing-main-img').src = mainImg;
    document.getElementById('landing-title').innerText = currentLandingProduct.name;
    document.getElementById('landing-category').innerText = currentLandingProduct.category;
    document.getElementById('landing-price').innerText = currentLandingProduct.price.toLocaleString() + ' دج';
    document.getElementById('landing-old-price').innerText = currentLandingProduct.oldPrice ? currentLandingProduct.oldPrice.toLocaleString() + ' دج' : '';
    document.getElementById('landing-desc').innerText = currentLandingProduct.desc;

    const thumbsContainer = document.getElementById('landing-thumbnails-list');
    const imagesList = currentLandingProduct.images && currentLandingProduct.images.length > 0 
        ? currentLandingProduct.images 
        : [mainImg];

    thumbsContainer.innerHTML = imagesList.map((imgUrl) => `
        <div onclick="swapLandingMainImage('${imgUrl}')" class="w-16 h-16 rounded-xl border-2 border-gray-200 hover:border-[#D4AF37] p-1 cursor-pointer bg-white overflow-hidden shadow-sm">
            <img src="${imgUrl}" class="w-full h-full object-contain">
        </div>
    `).join('');

    populateWilayas();
    calculateLandingTotal();
    showPage('landing');
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
    }
    calculateLandingTotal();
}

function calculateLandingTotal() {
    if (!currentLandingProduct) return;
    const code = document.getElementById('cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    
    let shipCost = wilaya ? (shipType === 'home' ? wilaya.homeCost : wilaya.officeCost) : 600;
    let grandTotal = currentLandingProduct.price + shipCost;

    document.getElementById('sum-prod-price').innerText = currentLandingProduct.price.toLocaleString() + ' دج';
    document.getElementById('sum-ship-price').innerText = shipCost.toLocaleString() + ' دج';
    document.getElementById('sum-total-price').innerText = grandTotal.toLocaleString() + ' دج';
    document.getElementById('sticky-bar-price').innerText = grandTotal.toLocaleString() + ' دج';
}

function scrollToOrderForm() {
    document.getElementById('order-form-section').scrollIntoView({ behavior: 'smooth' });
}

function submitLandingOrder() {
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const wilayaCode = document.getElementById('cust-wilaya').value;
    const commune = document.getElementById('cust-commune').value;

    if (!name || !phone || !wilayaCode) {
        alert('يرجى ملء كافة معلومات الاستمارة الضرورية!');
        return;
    }

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="shipping_type"]:checked').value;
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
        alert('تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.');
        showPage('home');
    });
}
