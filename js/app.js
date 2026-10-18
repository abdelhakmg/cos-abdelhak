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
export function showPage(pageId, addToHistory = true) {
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

    // 🌟 إضافة مسار الصفحة لسجل المتصفح ليعمل زر الرجوع
    if (addToHistory) {
        window.history.pushState({ page: pageId }, '', '#' + pageId);
    }
}

// 🌟 مراقب ذكي لزر "الرجوع" في الهاتف والمتصفح
window.addEventListener('popstate', (event) => {
    let overlayClosed = false;

    // 1. إغلاق القائمة الجانبية للهاتف إن كانت مفتوحة
    const drawer = document.getElementById('mobile-drawer');
    if (drawer && !drawer.classList.contains('hidden')) {
        drawer.classList.add('hidden');
        overlayClosed = true;
    }

    // 2. إغلاق أي نافذة منبثقة مفتوحة (مثل صانع الهدايا، مكبر الصور، الخ)
    const modals = ['gift-builder-modal', 'custom-builder-modal', 'image-lightbox-modal', 'admin-auth-modal', 'admin-custom-prod-modal', 'add-wrapping-modal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            overlayClosed = true;
        }
    });

    // إذا تم إغلاق نافذة للتو، نمنع تغيير الصفحة ونبقى في مكاننا
    if (overlayClosed) {
        const currentPage = document.querySelector('.page-sec.active')?.id.replace('page-', '') || 'home';
        window.history.pushState({ page: currentPage }, '', '#' + currentPage);
        return;
    }

    // 3. التنقل الفعلي بين الصفحات (الرجوع للصفحة السابقة)
    if (event.state && event.state.page) {
        showPage(event.state.page, false); // false تمنع التكرار في السجل
    } else {
        const hash = window.location.hash.replace('#', '');
        showPage(hash || 'home', false);
    }
});

// تسجيل الصفحة الرئيسية كأول محطة عند فتح الموقع
document.addEventListener('DOMContentLoaded', () => {
    if (!window.history.state) {
        window.history.replaceState({ page: 'home' }, '', '#home');
    }
});

// 🛒 دوال السلة (Cart) المحسنة (تبقى كما هي تماماً لا تمسحها)
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
    
    // 1. جلب البلدية والعنوان (التعديل الجديد)
    const baladiya = document.getElementById('cart-cust-baladiya')?.value.trim() || '';
    const address = document.getElementById('cart-cust-address')?.value.trim() || document.getElementById('cart-cust-commune')?.value.trim() || '';

    if (!name || !wilayaCode || !baladiya || !address) {
        showCustomAlert('تنبيه هام!', state.storeSettings.msgWarning || 'يرجى ملء كافة المعلومات الأساسية (البلدية والعنوان)!', false);
        return;
    }

    if (typeof window.isValidDzPhone === 'function' && !window.isValidDzPhone(phone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام.', false);
        return;
    }

    // 2. التحقق من "الحد الأدنى للطلب الذكي" (التعديل الجديد)
    const localWilaya = state.storeSettings?.localWilaya;
    const minLocal = state.storeSettings?.minOrderLocal || 0;
    const minNational = state.storeSettings?.minOrderNational || 0;
    
    // حساب المجموع الحالي للسلة (بدون توصيل)
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price || 0), 0);
    
    // تحديد الحد الأدنى المطلوب حسب الولاية
    const requiredMin = (wilayaCode === localWilaya) ? minLocal : minNational;

    // إذا كان المجموع أقل من الحد الأدنى، نمنع الطلب ونظهر تنبيهاً
    if (subtotal < requiredMin) {
        showCustomAlert(
            'لم تصل للحد الأدنى ⚠️', 
            `الحد الأدنى للطلب لولايتك هو ${formatPrice(requiredMin)}. مجموع سلتك الحالي هو ${formatPrice(subtotal)}. يرجى إضافة المزيد من المنتجات!`, 
            false
        );
        return;
    }

    // 3. استكمال إجراءات الطلب الطبيعية
    const wilaya = state.WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    const itemsNames = state.cart.map(item => {
        return item.customDetails ? `\n${item.name}\n${item.customDetails}\n` : item.name;
    }).join(' + ');
    const shippingTypeText = shipType === 'office' ? 'استلام من المكتب' : 'توصيل للمنزل';

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        // دمج البلدية والعنوان بشكل مرتب لمدير المتجر
        commune: `البلدية: ${baladiya} | العنوان: ${address} (${shippingTypeText})`,
        product: `طلبية سلة: (${itemsNames})`,
        total: subtotal + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    // إرسال الطلب لفايربيس
    if (typeof window.db !== 'undefined') {
        window.db.collection("orders").add(newOrder).then(() => {
            state.cart = [];
            saveCartToLocal();
            updateBadges();
            renderCart();
            showCustomAlert('تم استلام الطلب الكامل! 🎉', state.storeSettings.msgSuccess || 'تم تسجيل طلبك بنجاح', true);
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

export function searchOrderTracking() {
    const input = document.getElementById('track-phone-input');
    const container = document.getElementById('tracking-results-container');
    if (!input || !container) return;

    const phone = input.value.trim();
    if (!phone || phone.length < 10) {
        showCustomAlert('تنبيه', 'يرجى إدخال رقم هاتف جزائري صحيح!', false);
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = '<p class="text-center text-gray-400 py-6 text-xs">جاري البحث عن الطلبيات... ⏳</p>';

    if (typeof db !== 'undefined') {
        db.collection("orders").where("phone", "==", phone).get().then((snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = `<div class="bg-black/50 border border-gray-800 rounded-2xl p-6 text-center space-y-2"><i class="fa-solid fa-box-open text-3xl text-gray-600"></i><p class="text-sm font-bold text-gray-300">لم نجد أي طلب مسجل برقم الهاتف هذا (${phone})</p></div>`;
                return;
            }
            let html = '<h3 class="font-bold text-sm text-[#D4AF37] mb-3">📋 الطلبات المسجلة برقمك:</h3>';
            snapshot.forEach((doc) => {
                const o = doc.data();
                html += `<div class="bg-black/60 border border-gray-800 rounded-2xl p-5 mt-2 text-right shadow-md">
                    <p class="text-[#D4AF37] font-bold">${o.status || 'جديد'}</p>
                    <h4 class="font-bold text-sm text-white">${o.product}</h4>
                    <p class="text-xs text-gray-400 mt-1">المبلغ الإجمالي: ${(o.total || 0).toLocaleString()} دج</p>
                </div>`;
            });
            container.innerHTML = html;
        }).catch(() => container.innerHTML = '<p class="text-center text-red-500 text-xs py-4">حدث خطأ أثناء البحث.</p>');
    }
}

let currentOrderTickerIndex = 0;
export function initRealOrdersTicker() {
    const toast = document.getElementById('social-proof-toast');
    const spCustomer = document.getElementById('sp-customer');
    const spProduct = document.getElementById('sp-product');
    if (!toast || !spCustomer || !spProduct) return;
    if (window.ordersTickerTimer) clearInterval(window.ordersTickerTimer);

    window.ordersTickerTimer = setInterval(() => {
        if (!state.orders || state.orders.length === 0) return;
        if (currentOrderTickerIndex >= state.orders.length) currentOrderTickerIndex = 0;
        const currentOrder = state.orders[currentOrderTickerIndex];
        spCustomer.innerText = `${currentOrder.customer || 'زبون'} من ${currentOrder.wilaya || 'الجزائر'}`;
        spProduct.innerText = `اشترى منتجاً منذ قليل`;
        toast.classList.remove('translate-y-28', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-28', 'opacity-0'), 4500);
        currentOrderTickerIndex++;
    }, 12000);
}
// ==========================================
// 🔗 الدالة النهائية المتوافقة مع الفوتر لديك
// ==========================================
export function updateStoreFooterLinks() {
    const s = state.storeSettings || {};

    // 1. تحديث رقم الهاتف
    const phoneEl = document.getElementById('footer-phone');
    if (phoneEl && s.phone) {
        const span = phoneEl.querySelector('span');
        if (span) span.innerText = s.phone;
    }

    // 2. تحديث البريد الإلكتروني
    const emailEl = document.getElementById('footer-email');
    if (emailEl && s.email) {
        const span = emailEl.querySelector('span');
        if (span) span.innerText = s.email;
    }

    // 3. تحديث روابط السوشيال ميديا (فيسبوك، إنستغرام، واتساب)
    const fbEl = document.getElementById('link-facebook');
    if (fbEl) {
        if (s.facebook) { fbEl.href = s.facebook; fbEl.style.display = 'flex'; }
        else { fbEl.style.display = 'none'; }
    }

    const igEl = document.getElementById('link-instagram');
    if (igEl) {
        if (s.instagram) { igEl.href = s.instagram; igEl.style.display = 'flex'; }
        else { igEl.style.display = 'none'; }
    }

    const waEl = document.getElementById('link-whatsapp');
    if (waEl) {
        if (s.whatsappNum) {
            let cleanWa = s.whatsappNum.replace(/\s+/g, '');
            waEl.href = `https://wa.me/${cleanWa}`;
            waEl.style.display = 'flex';
        } else {
            waEl.style.display = 'none';
        }
    }

    // 4. تحديث رابط تليغرام (أصبح الآن داخل الدالة)
    const tgEl = document.getElementById('link-telegram');
    if (tgEl) {
        if (s.telegram) { 
            tgEl.href = s.telegram; 
            tgEl.style.display = 'flex'; 
        } else { 
            tgEl.style.display = 'none'; 
        }
    }
}

// تصدير الدوال للنافذة العامة
window.updateStoreFooterLinks = updateStoreFooterLinks;
window.searchOrderTracking = searchOrderTracking;
window.initRealOrdersTicker = initRealOrdersTicker;
