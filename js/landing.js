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
        if (typeof showToast === 'function') {
            showToast('يرجى ملء كافة معلومات الاستمارة الضرورية!');
        } else {
            alert('يرجى ملء كافة معلومات الاستمارة الضرورية!');
        }
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
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        showOrderSuccessModal();
    });
}

// دالة إظهار النافذة المنبثقة الاحترافية باللون الأسود والذهبي
function showOrderSuccessModal() {
    let modal = document.getElementById('order-success-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'order-success-modal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 text-center dir-rtl';
        modal.innerHTML = `
            <div class="bg-[#121212] border border-[#D4AF37]/50 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_30px_rgba(212,175,55,0.2)] transform transition-all scale-100 space-y-5 text-right">
                <div class="w-16 h-16 rounded-full gold-gradient p-0.5 mx-auto flex items-center justify-center shadow-lg">
                    <div class="w-full h-full bg-black rounded-full flex items-center justify-center">
                        <i class="fa-solid fa-circle-check text-[#D4AF37] text-3xl"></i>
                    </div>
                </div>
                
                <div class="space-y-2 text-center">
                    <h3 class="text-xl font-black text-white">تم استلام طلبك بنجاح! 🎉</h3>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        شكراً لثقتك بنا. سنتصل بك هاتفياً لتأكيد التوصيل وتجهيز الطلبية في أقرب وقت.
                    </p>
                </div>

                <button onclick="closeOrderSuccessModal()" class="w-full py-3.5 gold-gradient text-black font-extrabold text-sm rounded-xl shadow-lg hover:opacity-90 transition active:scale-95">
                    متابعة التسوق ✨
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.classList.remove('hidden');
    }
}

function closeOrderSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    if (modal) modal.classList.add('hidden');
    showPage('home');
}
