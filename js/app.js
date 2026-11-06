// --- ملف js/app.js ---

import { state, saveCartToLocal, saveFavsToLocal } from './store/state.js';
import { showCustomAlert, calculateShippingCost, formatPrice, safeCall, isValidDzPhone } from './utils/helpers.js';

let logoClickCount = 0;
let logoClickTimer = null;
let activeCartCoupon = null;
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

// الدخول السري للوحة التحكم (3 نقرات على الشعار)
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
        populateCartWilayas();
        renderCart();
    }
    if (pageId === 'wishlist') safeCall('renderWishlistPage');

    // إضافة مسار الصفحة لسجل المتصفح ليعمل زر الرجوع في الهاتف
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

    // 2. إغلاق أي نافذة منبثقة مفتوحة
    const modals = [
        'gift-builder-modal', 
        'custom-builder-modal', 
        'image-lightbox-modal', 
        'admin-auth-modal', 
        'admin-custom-prod-modal', 
        'add-wrapping-modal',
        'custom-alert-modal',
        'custom-confirm-modal',
        'advisor-modal'
    ];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            modal.style.display = '';
            overlayClosed = true;
        }
    });

    // إذا تم إغلاق نافذة للتو، نمنع تغيير الصفحة ونبقى في مكاننا
    if (overlayClosed) {
        const currentPage = document.querySelector('.page-sec.active')?.id.replace('page-', '') || 'home';
        window.history.pushState({ page: currentPage }, '', '#' + currentPage);
        return;
    }

    // 3. التنقل الفعلي بين الصفحات (الرجوع للصفحة السابقة أو لمنتج مخصص)
    if (event.state && event.state.productId) {
        safeCall('openLandingPage', event.state.productId, false);
    } else if (event.state && event.state.page) {
        showPage(event.state.page, false);
    } else {
        const hash = window.location.hash;
        if (hash.startsWith('#product=')) {
            safeCall('checkInitialProductDeepLink');
        } else {
            showPage(hash.replace('#', '') || 'home', false);
        }
    }
});

// تسجيل الصفحة الرئيسية كأول محطة عند فتح الموقع (إلا إذا كان الرابط يوجه لمنتج معين)
document.addEventListener('DOMContentLoaded', () => {
    if (!window.history.state && !window.location.hash.startsWith('#product=')) {
        window.history.replaceState({ page: 'home' }, '', '#home');
    }
});

// ==========================================
// 🛒 دوال السلة الذكية (Smart Cart مع دعم الكميات + / -)
// ==========================================

export function addToCart(id, selectedColor = '', selectedNum = '', qtyToAdd = 1, specificImage = null) {
    const prod = state.products.find(p => p.id === id);
    if (!prod) return;

    const addedQty = Math.max(1, parseInt(qtyToAdd) || 1);
    let optionsArr = [];
    if (selectedColor) optionsArr.push(`الخيار: ${selectedColor}`);
    if (selectedNum) optionsArr.push(`الدرجة: ${selectedNum}`);
    const optsText = optionsArr.length > 0 ? `(${optionsArr.join(' - ')})` : '';

    // 🌟 البحث عما إذا كان نفس المنتج بنفس الخيار/الدرجة موجوداً مسبقاً في السلة لدمج الكمية
    const existingItem = state.cart.find(item => 
        item.id === id && (item.selectedOptionsText || '') === optsText
    );

    if (existingItem) {
        existingItem.qty = (Number(existingItem.qty) || 1) + addedQty;
        // تحديث الصورة في السلة إذا اختار الزبون صورة مخصصة جديدة
        if (specificImage) existingItem.image = specificImage;
    } else {
        const cartItem = { 
            ...prod,
            qty: addedQty,
            image: specificImage || prod.image || (prod.images && prod.images[0]) // 🌟 الأولوية لصورة الخيار المخصص!
        };
        if (optsText) {
            cartItem.selectedOptionsText = optsText;
            cartItem.customDetails = optsText;
        }
        state.cart.push(cartItem);
    }

    saveCartToLocal();
    updateBadges();
    showCustomAlert('تمت الإضافة! 🛍️', `تمت إضافة "${prod.name}" (${addedQty > 1 ? addedQty + ' قطع' : 'قطعة واحدة'}) إلى السلة بنجاح.`, true);
}
export function updateCartItemQty(idx, delta) {
    if (!state.cart[idx]) return;
    const currentQty = Number(state.cart[idx].qty) || 1;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
        removeFromCart(idx);
    } else {
        state.cart[idx].qty = newQty;
        saveCartToLocal();
        updateBadges();
        renderCart();
    }
}

export function renderCart() {
    const cartList = document.getElementById('cart-list');
    if (!cartList) return;

    if (state.cart.length === 0) {
        cartList.innerHTML = '<p class="text-center text-gray-400 py-8">سلة التسوق فارغة حالياً.</p';
      // 🌟 منطق إظهار/إخفاء طرق الدفع بناءً على نوع المنتجات
    const hasCustomItem = state.cart.some(item => String(item.id).startsWith('custom_') || String(item.id).startsWith('gift_'));
    const codOption = document.getElementById('payment-cod');
    const inStoreOption = document.getElementById('payment-instore');
    if (hasCustomItem) {
        if (codOption) codOption.style.display = 'none';
        if (inStoreOption) inStoreOption.style.display = 'flex';
        if (document.querySelector('input[name="cart_payment_method"]:checked')?.value === 'cod') {
            const inStoreRadio = document.querySelector('input[value="in_store"]');
            if (inStoreRadio) inStoreRadio.checked = true;
        }
    } else {
        if (codOption) codOption.style.display = 'flex';
        if (inStoreOption) inStoreOption.style.display = 'none';
        if (document.querySelector('input[name="cart_payment_method"]:checked')?.value === 'in_store') {
            const codRadio = document.querySelector('input[value="cod"]');
            if(codRadio) codRadio.checked = true;
        }
    }    
        updateCartCalculations();
        return;
    }

    cartList.innerHTML = state.cart.map((prod, idx) => {
        const img = (prod.images && prod.images[0]) || prod.image || 'https://via.placeholder.com/100';
        const qty = Number(prod.qty) || 1;
        const itemTotal = (Number(prod.price) || 0) * qty;
        const extraInfo = prod.selectedOptionsText ? `<span class="block text-[11px] text-gray-400 mt-0.5">${prod.selectedOptionsText}</span>` : '';
        
        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                <div class="flex items-center gap-3">
                    <img src="${img}" class="w-16 h-16 object-contain rounded-xl bg-black border border-gray-800 flex-shrink-0" loading="lazy">
                    <div>
                        <h4 class="font-bold text-sm text-white line-clamp-1">${prod.name}</h4>
                        ${extraInfo}
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-[#D4AF37] font-black">${formatPrice(itemTotal)}</span>
                            ${qty > 1 ? `<span class="text-[10px] text-gray-500">(${formatPrice(prod.price)} للقطعة)</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- أزرار التحكم في الكمية والحذف -->
                <div class="flex items-center justify-between sm:justify-end gap-3 bg-black/40 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                    <div class="flex items-center gap-2 bg-black border border-gray-800 rounded-xl p-1">
                        <button type="button" onclick="updateCartItemQty(${idx}, -1)" class="w-7 h-7 rounded-lg bg-[#1a1a1a] hover:bg-gray-800 text-white font-bold text-xs flex items-center justify-center transition cursor-pointer">-</button>
                        <span class="w-6 text-center font-black text-xs text-[#D4AF37]">${qty}</span>
                        <button type="button" onclick="updateCartItemQty(${idx}, 1)" class="w-7 h-7 rounded-lg gold-gradient text-black font-black text-xs flex items-center justify-center hover:opacity-90 transition cursor-pointer">+</button>
                    </div>
                    <button type="button" onclick="removeFromCart(${idx})" class="text-red-500 hover:text-red-400 font-bold text-xs bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20 cursor-pointer" title="حذف من السلة">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
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
    const currentVal = select.value;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        state.WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
    if (currentVal) select.value = currentVal;
}

export function handleCartWilayaChange() {
    updateCartCalculations();
}

export function applyCartCoupon() {
    const input = document.getElementById('cart-coupon-input');
    const msgEl = document.getElementById('cart-coupon-msg');
    if (!input || !msgEl) return;

    const code = input.value.trim().toUpperCase();
    if (!code) return;

    const found = (state.coupons || []).find(c => c.code === code);
    msgEl.classList.remove('hidden', 'text-emerald-400', 'text-red-400');

    if (!found) {
        activeCartCoupon = null;
        msgEl.innerText = '❌ كود الخصم غير صحيح.';
        msgEl.classList.add('text-red-400');
        updateCartCalculations();
        return;
    }

    if (found.targetProductId !== 'all') {
        const hasTargetInCart = state.cart.some(item => item.id === found.targetProductId);
        if (!hasTargetInCart) {
            activeCartCoupon = null;
            msgEl.innerText = `⚠️ هذا الكوبون مخصص فقط لمنتج (${found.targetProductName}) وهو غير موجود في سلتك.`;
            msgEl.classList.add('text-red-400');
            updateCartCalculations();
            return;
        }
    }

    activeCartCoupon = found;
    msgEl.innerText = `✅ تم تطبيق كوبون (${found.code}) بنجاح!`;
    msgEl.classList.add('text-emerald-400');
    updateCartCalculations();
}

export function getCartDiscountAmount() {
    if (!activeCartCoupon || state.cart.length === 0) return 0;

    if (activeCartCoupon.targetProductId === 'all') {
        const subtotal = state.cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
        const disc = activeCartCoupon.type === 'percent' ? Math.round(subtotal * (activeCartCoupon.value / 100)) : Number(activeCartCoupon.value);
        return Math.min(disc, subtotal);
    } else {
        // إذا كان الكوبون مخصصاً لمنتج معين، يُحسب الخصم على ذلك المنتج فقط داخل السلة!
        const targetItemsTotal = state.cart
            .filter(item => item.id === activeCartCoupon.targetProductId)
            .reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
        if (targetItemsTotal <= 0) return 0;
        const disc = activeCartCoupon.type === 'percent' ? Math.round(targetItemsTotal * (activeCartCoupon.value / 100)) : Number(activeCartCoupon.value);
        return Math.min(disc, targetItemsTotal);
    }
}

export function updateCartCalculations() {
    const subtotalEl = document.getElementById('subtotal');
    const shipCostEl = document.getElementById('cart-shipping-cost');
    const totalEl = document.getElementById('total');
    const discountRow = document.getElementById('cart-discount-row');
    const discountAmountEl = document.getElementById('cart-discount-amount');
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    
    let subtotal = state.cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
    let discount = getCartDiscountAmount();
    let finalSubtotal = Math.max(0, subtotal - discount);

    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    if (subtotalEl) subtotalEl.innerText = formatPrice(subtotal);
    if (discountRow && discountAmountEl) {
        if (discount > 0) {
            discountRow.classList.remove('hidden');
            discountAmountEl.innerText = `- ${formatPrice(discount)}`;
        } else {
            discountRow.classList.add('hidden');
        }
    }
    if (shipCostEl) shipCostEl.innerText = wilayaCode ? formatPrice(shipCost) : 'حدد الولاية';
    if (totalEl) totalEl.innerText = formatPrice(finalSubtotal + shipCost);
}

export function submitCartCheckout() {
    if (state.cart.length === 0) return showCustomAlert('السلة فارغة!', 'يرجى إضافة منتجات للسلة أولاً.', false);

    const name = document.getElementById('cart-cust-name')?.value.trim();
    const rawPhone = document.getElementById('cart-cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const baladiya = document.getElementById('cart-cust-baladiya')?.value.trim() || '';

    if (!name || !wilayaCode || !baladiya) return showCustomAlert('تنبيه هام!', 'يرجى ملء المعلومات الأساسية!', false);
    if (!isValidDzPhone(rawPhone)) return showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري صحيح.', false);

    const paymentMethod = document.querySelector('input[name="cart_payment_method"]:checked')?.value || 'cod';

    if (paymentMethod === 'baridimob') {
        const modal = document.getElementById('baridimob-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        return; // نتوقف هنا لكي يرفع الزبون الوصل أولاً
    }

    finalizeOrderSubmit(paymentMethod, paymentMethod === 'in_store' ? 'pending' : 'cod_pending', null);
}

// 🌟 دوال بريدي موب
let currentBaridiMobReceipt = null;

export async function uploadBaridiMobReceipt(event) {
    const file = event.target.files[0];
    if (!file) return;
    const btn = document.getElementById('baridi-submit-btn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الوصل...';
    btn.className = "w-full py-3 bg-gray-800 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-wait";
    btn.disabled = true;
    
    try {
        currentBaridiMobReceipt = await window.compressAndUploadImage(file, 'customer_uploads', 800);
        btn.innerHTML = '<i class="fa-solid fa-check"></i> تأكيد الطلب';
        btn.className = "w-full py-3.5 gold-gradient text-black font-black rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer";
        btn.disabled = false;
    } catch (error) {
        btn.innerHTML = '❌ فشل الرفع، أعد المحاولة';
        btn.className = "w-full py-3.5 bg-red-600 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2";
    }
}

export function closeBaridiMobModal() {
    document.getElementById('baridimob-modal').classList.add('hidden');
    document.getElementById('baridimob-modal').classList.remove('flex');
}

export function confirmBaridiMobCheckout() {
    if (!currentBaridiMobReceipt) return showCustomAlert('تنبيه', 'يرجى إرفاق صورة وصل الدفع أولاً!', false);
    closeBaridiMobModal();
    finalizeOrderSubmit('baridimob', 'paid_pending_check', currentBaridiMobReceipt);
}

export function finalizeOrderSubmit(paymentMethod, paymentStatus, receiptUrl) {
    const name = document.getElementById('cart-cust-name')?.value.trim();
    const rawPhone = document.getElementById('cart-cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const baladiya = document.getElementById('cart-cust-baladiya')?.value.trim() || '';
    const address = document.getElementById('cart-cust-address')?.value.trim() || '';
    
    const subtotal = state.cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);
    const discount = getCartDiscountAmount();
    const finalSubtotal = Math.max(0, subtotal - discount);

    const itemsNames = state.cart.map(item => {
        const qty = Number(item.qty) || 1;
        return item.customDetails ? `\n${item.name} (x${qty}) ${item.customDetails}\n` : `${item.name} (x${qty})`;
    }).join(' + ');

    let attachedImages = [];
    state.cart.forEach(item => {
        if (item.attachedImage1) attachedImages.push(item.attachedImage1);
        if (item.attachedImage2) attachedImages.push(item.attachedImage2);
        if (item.attachedImage3) attachedImages.push(item.attachedImage3);
    });

    const newOrder = {
        customer: name,
        phone: rawPhone.replace(/\s+/g, ''),
        wilaya: state.WILAYAS.find(w => w.code === wilayaCode)?.name || wilayaCode,
        commune: `البلدية: ${baladiya}${address ? ' | العنوان: ' + address : ''} (${shipType === 'office' ? 'من المكتب' : 'للمنزل'})`,
        product: `طلبية سلة: (${itemsNames})`,
        total: finalSubtotal + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date(),
        paymentMethod: paymentMethod, 
        paymentStatus: paymentStatus, 
        baridimobReceipt: receiptUrl || null, 
        attachedImage1: attachedImages[0] || null,
        attachedImage2: attachedImages[1] || null,
        attachedImage3: attachedImages[2] || null
    };

    const checkoutBtn = document.getElementById('final-checkout-btn');
    if (checkoutBtn) checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

    fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOrder, purchasedItems: [...state.cart] })
    }).then(res => res.json()).then(data => {
        if (data.error) throw new Error(data.error);
        state.cart = []; saveCartToLocal(); updateBadges(); renderCart();
        ['cart-cust-name', 'cart-cust-phone', 'cart-cust-wilaya', 'cart-cust-baladiya', 'cart-cust-address'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        showCustomAlert('تم استلام الطلب! 🎉', 'تم تسجيل طلبك بنجاح وسنتصل بك قريباً.', true);
        showPage('home');
        if (checkoutBtn) checkoutBtn.innerHTML = 'تأكيد طلب كافة السلة 🛍️';
        currentBaridiMobReceipt = null;
    }).catch(err => {
        showCustomAlert('خطأ', err.message, false);
        if (checkoutBtn) checkoutBtn.innerHTML = 'تأكيد طلب كافة السلة 🛍️';
    });
}
// 🌟 حساب إجمالي عدد القطع في شارة السلة العلوية
export function updateBadges() {
    const cartBadge = document.getElementById('cart-badge');
    const wishBadge = document.getElementById('wishlist-badge');
    const totalCartQty = state.cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
    if (cartBadge) cartBadge.innerText = totalCartQty;
    if (wishBadge) wishBadge.innerText = state.favorites.length;
}

// ==========================================
// 📦 تتبع الطلبات وإشعارات المبيعات والفوتر
// ==========================================
export function searchOrderTracking() {
    const input = document.getElementById('track-phone-input');
    const container = document.getElementById('tracking-results-container');
    if (!input || !container) return;

    let phone = input.value.trim().replace(/\s+/g, '');
    if (phone.startsWith('+213')) phone = '0' + phone.substring(4);
    else if (phone.startsWith('00213')) phone = '0' + phone.substring(5);

    if (!isValidDzPhone(phone)) {
        showCustomAlert('تنبيه', 'يرجى إدخال رقم هاتف جزائري صحيح مكون من 10 أرقام!', false);
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = '<p class="text-center text-gray-400 py-6 text-xs">جاري البحث عن الطلبيات... ⏳</p>';

    if (typeof window.firebase !== 'undefined') {
        const trackOrderFn = window.firebase.functions().httpsCallable('trackOrder');
        trackOrderFn({ phone: phone }).then((result) => {
            const orders = result.data.orders;
            
            if (!orders || orders.length === 0) {
                container.innerHTML = `<div class="bg-black/50 border border-gray-800 rounded-2xl p-6 text-center space-y-2"><i class="fa-solid fa-box-open text-3xl text-gray-600"></i><p class="text-sm font-bold text-gray-300">لم نجد أي طلب مسجل برقم الهاتف هذا (${phone})</p></div>`;
                return;
            }
            
            let html = '<h3 class="font-bold text-sm text-[#D4AF37] mb-3">📋 الطلبات المسجلة برقمك:</h3>';
            orders.forEach((o) => {
                html += `<div class="bg-black/60 border border-gray-800 rounded-2xl p-5 mt-2 text-right shadow-md">
                    <p class="text-[#D4AF37] font-bold">${o.status || 'جديد'}</p>
                    <h4 class="font-bold text-sm text-white whitespace-pre-line mt-1">${o.product}</h4>
                    <p class="text-xs text-gray-400 mt-2">المبلغ الإجمالي: ${formatPrice(o.total)}</p>
                </div>`;
            });
            container.innerHTML = html;
        }).catch((error) => {
            console.error("Tracking error:", error);
            container.innerHTML = '<p class="text-center text-red-500 text-xs py-4">حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.</p>';
        });
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

    // 3. تحديث روابط السوشيال ميديا (فيسبوك، إنستغرام، واتساب، تليغرام)
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
    const floatingWa = document.getElementById('floating-whatsapp');
    if (s.whatsappNum) {
        let cleanWa = s.whatsappNum.replace(/\s+/g, '');
        if (waEl) {
            waEl.href = `https://wa.me/${cleanWa}`;
            waEl.style.display = 'flex';
        }
        if (floatingWa) {
            floatingWa.href = `https://wa.me/${cleanWa}`;
        }
    } else if (waEl) {
        waEl.style.display = 'none';
    }

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

// ==========================================
// ربط الدوال بالواجهة العامة (Window Bindings)
// ==========================================
window.initLuxurySplashScreen = initLuxurySplashScreen;
window.handleLogoClick = handleLogoClick;
window.showPage = showPage;
window.addToCart = addToCart;
window.renderCart = renderCart;
window.removeFromCart = removeFromCart;
window.populateCartWilayas = populateCartWilayas;
window.handleCartWilayaChange = handleCartWilayaChange;
window.updateCartCalculations = updateCartCalculations;
window.submitCartCheckout = submitCartCheckout;
window.uploadBaridiMobReceipt = uploadBaridiMobReceipt;
window.closeBaridiMobModal = closeBaridiMobModal;
window.confirmBaridiMobCheckout = confirmBaridiMobCheckout;
window.updateBadges = updateBadges;
window.searchOrderTracking = searchOrderTracking;
window.initRealOrdersTicker = initRealOrdersTicker;
window.updateStoreFooterLinks = updateStoreFooterLinks;
window.updateCartItemQty = updateCartItemQty;
window.applyCartCoupon = applyCartCoupon;

