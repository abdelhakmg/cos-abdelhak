// --- ملف js/app.js ---

// 1. استيراد البيانات والدوال المساعدة من الملفات الجديدة
import { state, saveCartToLocal, saveFavsToLocal } from './store/state.js';
import { showCustomAlert, calculateShippingCost, formatPrice, safeCall } from './utils/helpers.js';

let currentBannerIdx = 0;
let currentHeroIdx = 0;
let activeCategoryFilter = 'جميع المنتجات';
let logoClickCount = 0;
let logoClickTimer = null;

// 🌟 شاشة الافتتاح الفاخرة
export function initLuxurySplashScreen() {
    const splash = document.getElementById('luxury-splash-screen');
    if (!splash) return;

    if (localStorage.getItem('cosAdminLoggedIn') === 'true') {
        splash.style.display = 'none';
        return;
    }

    splash.style.display = 'flex';
    splash.style.opacity = '1';
    splash.style.transition = 'opacity 0.7s ease-in-out';

    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 700);
    }, 3000);
}

// الدخول السري للوحة التحكم
export function handleLogoClick(event) {
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
        if (logoClickCount < 3) showPage('home');
        logoClickCount = 0;
    }, 600);
}

// التنقل بين الصفحات
export function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (pageId === 'admin') safeCall('renderAdminDashboard');
    if (pageId === 'cart') {
        renderCart();
        populateCartWilayas();
    }
    if (pageId === 'wishlist') renderWishlistPage();
}

// 🛒 دوال السلة (Cart) المحسنة
export function addToCart(id) {
    const prod = state.products.find(p => p.id === id);
    if (prod) {
        state.cart.push(prod);
        saveCartToLocal();
        updateBadges();
        showCustomAlert('تمت الإضافة! 🛍️', `تمت إضافة "${prod.name}" إلى السلة بنجاح.`, true);
    }
}

export function renderCart() {
    const cartList = document.getElementById('cart-list');
    if (!cartList) return;

    if (state.cart.length === 0) {
        cartList.innerHTML = '<p class="text-center text-gray-400 py-8">سلة التسوق فارغة حالياً.</p>';
        updateCartCalculations();
        return;
    }

    cartList.innerHTML = state.cart.map((prod, idx) => {
        const img = (prod.images && prod.images[0]) || prod.image || 'https://via.placeholder.com/100';
        return `
            <div class="flex items-center justify-between border-b border-gray-800 pb-4">
                <div class="flex items-center gap-4">
                    <img src="${img}" class="w-16 h-16 object-contain rounded-xl bg-black border border-gray-800" loading="lazy">
                    <div>
                        <h4 class="font-bold text-sm text-white">${prod.name}</h4>
                        <span class="text-xs text-[#D4AF37] font-bold">${formatPrice(prod.price)}</span>
                    </div>
                </div>
                <button onclick="removeFromCart(${idx})" class="text-red-500 hover:text-red-400 font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                    <i class="fa-solid fa-trash-can"></i> حذف
                </button>
            </div>
        `;
    }).join('');

    updateCartCalculations();
}

export function removeFromCart(idx) {
    state.cart.splice(idx, 1);
    saveCartToLocal();
    updateBadges();
    renderCart();
}

export function populateCartWilayas() {
    const select = document.getElementById('cart-cust-wilaya');
    if (!select) return;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        state.WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
}

export function updateCartCalculations() {
    const subtotalEl = document.getElementById('subtotal');
    const shipCostEl = document.getElementById('cart-shipping-cost');
    const totalEl = document.getElementById('total');
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    
    let subtotal = state.cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    
    // استخدام الدالة الموحدة الجديدة لحساب التوصيل
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    if (subtotalEl) subtotalEl.innerText = formatPrice(subtotal);
    if (shipCostEl) shipCostEl.innerText = wilayaCode ? formatPrice(shipCost) : 'حدد الولاية';
    if (totalEl) totalEl.innerText = formatPrice(subtotal + shipCost);
}

export function submitCartCheckout() {
    if (state.cart.length === 0) {
        showCustomAlert('السلة فارغة!', 'يرجى إضافة منتجات للسلة أولاً.', false);
        return;
    }

    const name = document.getElementById('cart-cust-name')?.value.trim();
    const phone = document.getElementById('cart-cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const commune = document.getElementById('cart-cust-commune')?.value.trim();

    if (!name || !wilayaCode || !commune) {
        showCustomAlert('تنبيه هام!', state.storeSettings.msgWarning, false);
        return;
    }

    if (typeof window.isValidDzPhone === 'function' && !window.isValidDzPhone(phone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام.', false);
        return;
    }

    const wilaya = state.WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    const subtotal = state.cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const itemsNames = state.cart.map(item => item.name).join(' + ');
    const shippingTypeText = shipType === 'office' ? 'استلام من المكتب' : 'توصيل للمنزل';

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: `${commune} (${shippingTypeText})`,
        product: `طلبية سلة: (${itemsNames})`,
        total: subtotal + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    // إرسال الطلب لفايربيس
    if (typeof db !== 'undefined') {
        db.collection("orders").add(newOrder).then(() => {
            state.cart = [];
            saveCartToLocal();
            updateBadges();
            renderCart();
            showCustomAlert('تم استلام الطلب الكامل! 🎉', state.storeSettings.msgSuccess, true);
            showPage('home');
        }).catch(err => showCustomAlert('خطأ', 'حدث خطأ: ' + err.message, false));
    }
}

// الشارات (Badges) للمفضلة والسلة
export function updateBadges() {
    const cartBadge = document.getElementById('cart-badge');
    const wishBadge = document.getElementById('wishlist-badge');
    if (cartBadge) cartBadge.innerText = state.cart.length;
    if (wishBadge) wishBadge.innerText = state.favorites.length;
}

// --- ربط كل الدوال بالواجهة (Window Binding) لتظل أزرار HTML تعمل بدون مشاكل ---
window.initLuxurySplashScreen = initLuxurySplashScreen;
window.handleLogoClick = handleLogoClick;
window.showPage = showPage;
window.addToCart = addToCart;
window.renderCart = renderCart;
window.removeFromCart = removeFromCart;
window.populateCartWilayas = populateCartWilayas;
window.updateCartCalculations = updateCartCalculations;
window.submitCartCheckout = submitCartCheckout;
window.updateBadges = updateBadges;
// ملاحظة: لتبسيط الكود، قمنا بتضمين الوظائف الأساسية للسلة والتنقل. 
// سيتم نقل باقي دوال الواجهة (الفلاتر والبحث) في الخطوة القادمة أو إضافتها هنا.
