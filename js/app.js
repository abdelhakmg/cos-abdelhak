let currentBannerIdx = 0;
let currentHeroIdx = 0;
let activeCategoryFilter = 'جميع المنتجات';

let logoClickCount = 0;
let logoClickTimer = null;

function initLuxurySplashScreen() {
    const splash = document.getElementById('luxury-splash-screen');
    if (!splash) return;

    splash.style.display = 'flex';
    splash.style.opacity = '1';
    splash.style.transition = 'opacity 0.7s ease-in-out';

    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 700);
    }, 3000);
}

function handleLogoClick(event) {
    if (event) event.preventDefault();
    logoClickCount++;
    
    if (logoClickTimer) clearTimeout(logoClickTimer);

    if (logoClickCount >= 3) {
        logoClickCount = 0;
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        } else {
            showPage('admin');
        }
        return;
    }

    logoClickTimer = setTimeout(() => {
        if (logoClickCount < 3) {
            showPage('home');
        }
        logoClickCount = 0;
    }, 600);
}

function populateCartWilayas() {
    const select = document.getElementById('cart-cust-wilaya');
    if (!select) return;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

function handleCartWilayaChange() {
    updateCartCalculations();
}

function updateCartCalculations() {
    const subtotalEl = document.getElementById('subtotal');
    const shipCostEl = document.getElementById('cart-shipping-cost');
    const totalEl = document.getElementById('total');

    let subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);

    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';

    let shipCost = 0;
    if (wilaya) {
        if (shipType === 'office') {
            shipCost = wilaya.officeCost || 0;
        } else {
            shipCost = (wilaya.communesData && wilaya.communesData[0] ? wilaya.communesData[0].cost : (wilaya.officeCost || 0));
        }
    }

    if (subtotalEl) subtotalEl.innerText = subtotal.toLocaleString() + ' دج';
    if (shipCostEl) shipCostEl.innerText = wilaya ? (shipCost.toLocaleString() + ' دج') : 'حدد الولاية';
    
    const grandTotal = subtotal + shipCost;
    if (totalEl) totalEl.innerText = grandTotal.toLocaleString() + ' دج';
}

function submitCartCheckout() {
    if (cart.length === 0) {
        showCustomAlert('السلة فارغة!', 'يرجى إضافة منتجات للسلة أولاً.', false);
        return;
    }

    const name = document.getElementById('cart-cust-name')?.value.trim();
    const phone = document.getElementById('cart-cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const address = document.getElementById('cart-cust-address')?.value.trim() || '';

    if (!name || !wilayaCode || !address) {
        showCustomAlert('تنبيه هام!', storeSettings.msgWarning || 'يرجى ملء كافة معلومات الاستمارة الضرورية (الاسم، الهاتف، الولاية والعنوان)!', false);
        return;
    }

    if (typeof isValidDzPhone === 'function' && !isValidDzPhone(phone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام ويبدأ بـ 05 أو 06 أو 07.', false);
        return;
    }

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    
    let shipCost = 0;
    if (wilaya) {
        if (shipType === 'office') {
            shipCost = wilaya.officeCost || 0;
        } else {
            shipCost = (wilaya.communesData && wilaya.communesData[0] ? wilaya.communesData[0].cost : (wilaya.officeCost || 0));
        }
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const itemsNames = cart.map(item => item.name).join(' + ');

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: address, // تخزين العنوان المكتوب يدوياً
        product: `طلبية سلة: (${itemsNames})`,
        total: subtotal + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        cart = [];
        localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
        updateBadges();
        renderCart();
        showCustomAlert('تم استلام الطلب الكامل! 🎉', storeSettings.msgSuccess || 'تم استلام طلبك بنجاح! سنتصل بك هاتفياً لتأكيد التوصيل.', true);
        showPage('home');
    }).catch(err => {
        showCustomAlert('خطأ', 'حدث خطأ أثناء إرسال الطلب: ' + err.message, false);
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin' && typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (pageId === 'cart') {
        renderCart();
        populateCartWilayas();
    }
    if (pageId === 'wishlist') renderWishlistPage();
}

document.addEventListener('DOMContentLoaded', () => {
    initLuxurySplashScreen();
    if (typeof updateAppHeaderInfo === 'function') updateAppHeaderInfo();
    if (typeof updateBadges === 'function') updateBadges();
    if (typeof renderHeroSlider === 'function') renderHeroSlider();
    if (typeof renderProducts === 'function') renderProducts();
});
