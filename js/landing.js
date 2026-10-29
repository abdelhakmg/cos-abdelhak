// --- ملف js/landing.js ---

import { state } from './store/state.js';
import { formatPrice, showCustomAlert, safeCall, calculateShippingCost, isValidDzPhone } from './utils/helpers.js';

let currentLandingProduct = null;
let currentLandingQty = 1; // 🌟 متغير الكمية في صفحة المنتج
let activeLandingCoupon = null; // 🌟 الكوبون المطبق حالياً في صفحة المنتج
let currentSelectedVariant = null; // 🌟 حفظ الخيار الذي حدده الزبون
export async function openLandingPage(productId, updateUrl = true) {
    if (!productId) return;
    currentSelectedVariant = null; // إعادة الضبط عند فتح أي منتج
    
    // 1. البحث في state.products أو في فهرس البحث المحلي
    currentLandingProduct = state.products.find(p => p.id === productId) || 
                            (window.localSearchIndex || []).find(p => p.id === productId);

    // 2. إذا لم يكن المنتج محملاً بعد (أو كان قادماً من الفهرس المختصر بدون تفاصيل الأذواق)، نجلبه من Firebase
    if ((!currentLandingProduct || typeof currentLandingProduct.variants === 'undefined') && typeof window.fetchProductById === 'function') {
        const fetched = await window.fetchProductById(productId);
        if (fetched) currentLandingProduct = fetched;
    }

    if (!currentLandingProduct) return;

    activeLandingCoupon = null;
    if (document.getElementById('landing-coupon-input')) document.getElementById('landing-coupon-input').value = '';
    if (document.getElementById('landing-coupon-msg')) document.getElementById('landing-coupon-msg').classList.add('hidden');
    
    let mainImg = currentLandingProduct.image || 
                  (Array.isArray(currentLandingProduct.images) && currentLandingProduct.images[0]) || 
                  (Array.isArray(currentLandingProduct.variants) && currentLandingProduct.variants[0]?.image) || 
                  'https://via.placeholder.com/500';
        
    const landingImgEl = document.getElementById('landing-main-img');
    if (landingImgEl) landingImgEl.src = mainImg;

    const landingTitleEl = document.getElementById('landing-title');
    if (landingTitleEl) landingTitleEl.innerText = currentLandingProduct.name || '';

    const landingCatEl = document.getElementById('landing-category');
    if (landingCatEl) landingCatEl.innerText = currentLandingProduct.category || 'عام';

    const landingPriceEl = document.getElementById('landing-price');
    if (landingPriceEl) landingPriceEl.innerText = formatPrice(currentLandingProduct.price);

    const landingOldPriceEl = document.getElementById('landing-old-price');
    if (landingOldPriceEl) landingOldPriceEl.innerText = currentLandingProduct.oldPrice ? formatPrice(currentLandingProduct.oldPrice) : '';

    const landingDescEl = document.getElementById('landing-desc');
    if (landingDescEl) landingDescEl.innerText = currentLandingProduct.desc || '';

    renderLandingDynamicOptions(currentLandingProduct);

    // 🔒 قفل عرض صفحة الهبوط لمنع تحرك الشاشة يميناً ويساراً على الهاتف نهائياً
    const landingPageSec = document.getElementById('page-landing');
    if (landingPageSec) {
        landingPageSec.style.overflowX = 'hidden';
        landingPageSec.style.maxWidth = '100vw';
    }

    const thumbsContainer = document.getElementById('landing-thumbnails-list');
    if (thumbsContainer) {
        // جعل الحاوية تلتف تلقائياً (flex-wrap) ولا تتجاوز عرض شاشة الهاتف أبداً
        thumbsContainer.className = 'flex flex-wrap items-center justify-center gap-2 max-w-full overflow-hidden py-2';
        if (thumbsContainer.parentElement) {
            thumbsContainer.parentElement.style.minWidth = '0';
            thumbsContainer.parentElement.style.maxWidth = '100%';
        }

        // جمع الصورة الرئيسية + مصفوفة الصور القديمة + صور الأذواق بدون تكرار
        const rawImages = [
            mainImg,
            ...(Array.isArray(currentLandingProduct.images) ? currentLandingProduct.images : []),
            ...(Array.isArray(currentLandingProduct.variants) ? currentLandingProduct.variants.map(v => v?.image) : [])
        ].filter(Boolean);
        const imagesList = [...new Set(rawImages)];

        thumbsContainer.innerHTML = imagesList.map((imgUrl) => {
            const safeUrl = String(imgUrl || '').replace(/'/g, "\\'");
            return `
            <div onclick="swapLandingMainImage('${safeUrl}')" class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl border-2 border-gray-800 hover:border-[#D4AF37] p-1 cursor-pointer bg-black overflow-hidden shadow-sm">
                <img src="${imgUrl}" class="w-full h-full object-contain" loading="lazy">
            </div>
            `;
        }).join('');
    }

    currentLandingQty = 1;
    const qtyEl = document.getElementById('landing-qty-val');
    if (qtyEl) qtyEl.innerText = '1';
    
    populateWilayas();
    handleWilayaChange();
    renderRelatedProducts(currentLandingProduct);

    safeCall('showPage', 'landing', false);
    if (updateUrl) {
        window.history.pushState({ page: 'landing', productId: currentLandingProduct.id }, '', `#product=${currentLandingProduct.id}`);
    }
}

export function swapLandingMainImage(newUrl) {
    const mainImg = document.getElementById('landing-main-img');
    if (mainImg) {
        mainImg.style.opacity = '0.3';
        setTimeout(() => {
            mainImg.src = newUrl;
            mainImg.style.opacity = '1';
        }, 150);
    }
}

export function populateWilayas() {
    const select = document.getElementById('cust-wilaya');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">اختر الولاية...</option>' + 
        state.WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
    if (currentVal) select.value = currentVal;
}

export function handleWilayaChange() {
    const code = document.getElementById('cust-wilaya')?.value;
    const wilaya = state.WILAYAS.find(w => w.code === code);
    
    const officePriceEl = document.getElementById('price-shipping-office');
    const homePriceEl = document.getElementById('price-shipping-home');

    if (wilaya) {
        if (officePriceEl) officePriceEl.innerText = formatPrice(wilaya.officeCost ?? 0);
        if (homePriceEl) homePriceEl.innerText = formatPrice(wilaya.homeCost ?? wilaya.officeCost ?? 0);
    } else {
        if (officePriceEl) officePriceEl.innerText = 'حدد الولاية';
        if (homePriceEl) homePriceEl.innerText = 'حدد الولاية';
    }
    calculateLandingTotal();
    checkSmartOrderButton();
}
// 🌟 تطبيق كود الخصم في صفحة الهبوط
export function applyLandingCoupon() {
    if (!currentLandingProduct) return;
    const input = document.getElementById('landing-coupon-input');
    const msgEl = document.getElementById('landing-coupon-msg');
    if (!input || !msgEl) return;

    const code = input.value.trim().toUpperCase();
    if (!code) return;

    const found = (state.coupons || []).find(c => c.code === code);
    msgEl.classList.remove('hidden', 'text-emerald-400', 'text-red-400');

    if (!found) {
        activeLandingCoupon = null;
        msgEl.innerText = '❌ كود الخصم غير صحيح أو انتهت صلاحيته.';
        msgEl.classList.add('text-red-400');
        calculateLandingTotal();
        return;
    }

    // التحقق مما إذا كان الكوبون مخصصاً لمنتج آخر
    if (found.targetProductId !== 'all' && found.targetProductId !== currentLandingProduct.id) {
        activeLandingCoupon = null;
        msgEl.innerText = `⚠️ هذا الكوبون مخصص فقط لمنتج (${found.targetProductName || 'آخر'}).`;
        msgEl.classList.add('text-red-400');
        calculateLandingTotal();
        return;
    }

    activeLandingCoupon = found;
    msgEl.innerText = `✅ تم تفعيل خصم (${found.value}${found.type === 'percent' ? '%' : ' دج'}) بنجاح!`;
    msgEl.classList.add('text-emerald-400');
    calculateLandingTotal();
}

function getLandingDiscountAmount(prodSubtotal) {
    if (!activeLandingCoupon) return 0;
    if (activeLandingCoupon.targetProductId !== 'all' && activeLandingCoupon.targetProductId !== currentLandingProduct?.id) return 0;
    
    let discount = activeLandingCoupon.type === 'percent' 
        ? Math.round(prodSubtotal * (activeLandingCoupon.value / 100)) 
        : Number(activeLandingCoupon.value);
    return Math.min(discount, prodSubtotal);
}
// 🌟 دالة زيادة وإنقاص الكمية في صفحة الهبوط
export function changeLandingQty(delta) {
    if (!currentLandingProduct) return;
    currentLandingQty = Math.max(1, currentLandingQty + delta);
    const qtyEl = document.getElementById('landing-qty-val');
    if (qtyEl) qtyEl.innerText = currentLandingQty;
    
    calculateLandingTotal();
    checkSmartOrderButton();
}

export function checkSmartOrderButton() {
    if (!currentLandingProduct) return;
    const wilayaCode = document.getElementById('cust-wilaya')?.value;
    const orderBtn = document.getElementById('main-submit-order-btn');
    
    if (!orderBtn) return;
    
    // 1. التحقق من توفر الكمية أولاً
    if (currentLandingProduct.inStock === false) {
        orderBtn.innerHTML = `<i class="fa-solid fa-ban"></i> نفدت الكمية مؤقتاً`;
        orderBtn.removeAttribute('onclick');
        orderBtn.className = 'w-full py-4 bg-gray-800 text-gray-400 border border-gray-700 font-extrabold text-lg rounded-2xl cursor-not-allowed flex items-center justify-center gap-2';
        return;
    }

    // 2. إذا لم يحدد الولاية بعد، نتركه للوضع الطبيعي
    if (!wilayaCode) {
        orderBtn.innerHTML = `تأكيد الطلب الآن (الدفع عند الاستلام) 🚚`;
        orderBtn.setAttribute('onclick', 'submitLandingOrder()');
        orderBtn.className = 'w-full py-4 gold-gradient text-black font-extrabold text-lg rounded-2xl shadow-xl hover:opacity-90 transition';
        return;
    }

    const localWilaya = state.storeSettings?.localWilaya;
    const minLocal = Number(state.storeSettings?.minOrderLocal) || 0;
    const minNational = Number(state.storeSettings?.minOrderNational) || 0;

    let requiredMin = (wilayaCode === localWilaya) ? minLocal : minNational;
    // 🌟 ضرب سعر المنتج في الكمية المختارة لمعرفة إن كان قد وصل للحد الأدنى!
    let currentSubtotal = (Number(currentLandingProduct.price) || 0) * currentLandingQty;

    if (currentSubtotal < requiredMin) {
        orderBtn.innerHTML = `أضف إلى السلة لتصل للحد الأدنى (${formatPrice(requiredMin)}) 🛒`;
        orderBtn.setAttribute('onclick', 'addToCartFromLanding()');
        orderBtn.className = 'w-full py-4 bg-[#121212] text-[#D4AF37] border border-[#D4AF37]/50 font-extrabold text-lg rounded-2xl transition hover:bg-[#1a1a1a]';
    } else {
        orderBtn.innerHTML = `تأكيد الطلب الآن (الدفع عند الاستلام) 🚚`;
        orderBtn.setAttribute('onclick', 'submitLandingOrder()');
        orderBtn.className = 'w-full py-4 gold-gradient text-black font-extrabold text-lg rounded-2xl shadow-xl hover:opacity-90 transition';
    }
}

export function addToCartFromLanding() {
    if (!currentLandingProduct) return;
    
    // دعم النظام القديم والجديد
    let finalOption = '';
    let finalImage = null;

    if (currentSelectedVariant) {
        finalOption = currentSelectedVariant.name;
        finalImage = currentSelectedVariant.image; // تمرير صورة الذوق المختار!
    } else {
        finalOption = document.querySelector('input[name="selected_product_color"]:checked')?.value || '';
    }

    const selectedNum = document.querySelector('input[name="selected_product_number"]:checked')?.value || '';
    
    if (typeof window.addToCart === 'function') {
        window.addToCart(currentLandingProduct.id, finalOption, selectedNum, currentLandingQty, finalImage);
        showCustomAlert('تمت الإضافة للسلة 🛒', 'تمت إضافة المنتج للسلة. يرجى إضافة المزيد من المنتجات لتتمكن من الوصول للحد الأدنى وإتمام الطلب.', true);
        safeCall('showPage', 'cart');
    }
}

export function calculateLandingTotal() {
    if (!currentLandingProduct) return;
    const wilayaCode = document.getElementById('cust-wilaya')?.value;
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    
    let unitPrice = Number(currentLandingProduct.price) || 0;
    let prodSubtotal = unitPrice * currentLandingQty;
    let discountAmount = getLandingDiscountAmount(prodSubtotal);
    let finalProdPrice = Math.max(0, prodSubtotal - discountAmount);
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    const sumProdEl = document.getElementById('sum-prod-price');
    if (sumProdEl) {
        sumProdEl.innerText = currentLandingQty > 1 
            ? `${formatPrice(prodSubtotal)} (${currentLandingQty} قطع)` 
            : formatPrice(prodSubtotal);
    }

    const discountRow = document.getElementById('landing-discount-row');
    const discountPriceEl = document.getElementById('sum-discount-price');
    if (discountRow && discountPriceEl) {
        if (discountAmount > 0) {
            discountRow.classList.remove('hidden');
            discountPriceEl.innerText = `- ${formatPrice(discountAmount)}`;
        } else {
            discountRow.classList.add('hidden');
        }
    }

    const sumShipEl = document.getElementById('sum-ship-price');
    if (sumShipEl) sumShipEl.innerText = wilayaCode ? formatPrice(shipCost) : 'حدد الولاية';

    const sumTotalEl = document.getElementById('sum-total-price');
    if (sumTotalEl) sumTotalEl.innerText = formatPrice(finalProdPrice + shipCost);
}

export function submitLandingOrder() {
    if (!currentLandingProduct || currentLandingProduct.inStock === false) {
        showCustomAlert('غير متوفر', 'عذراً، هذا المنتج غير متوفر في المخزون حالياً.', false);
        return;
    }

    const lastOrderTime = localStorage.getItem('last_order_timestamp');
    if (lastOrderTime && (Date.now() - parseInt(lastOrderTime)) < 60000) {
        showCustomAlert('تم استلام طلبك مسبقاً ⏳', 'لقد قمت بإرسال طلب منذ لحظات. يرجى الانتظار دقيقة قبل إرسال طلب آخر.', false);
        return;
    }

    const name = document.getElementById('cust-name')?.value.trim();
    const rawPhone = document.getElementById('cust-phone')?.value.trim();
    const wilayaCode = document.getElementById('cust-wilaya')?.value;
    const baladiya = document.getElementById('cust-baladiya')?.value.trim() || '';
    const address = document.getElementById('cust-address')?.value.trim() || '';

    if (!name || !wilayaCode || !baladiya) {
        showCustomAlert('تنبيه هام!', state.storeSettings.msgWarning || 'يرجى ملء المعلومات الأساسية (الاسم، الولاية، والبلدية)!', false);
        return;
    }

    if (!isValidDzPhone(rawPhone)) {
        showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري صحيح مكون من 10 أرقام (يبدأ بـ 05 أو 06 أو 07).', false);
        return;
    }

    const localWilaya = state.storeSettings?.localWilaya;
    const minLocal = Number(state.storeSettings?.minOrderLocal) || 0;
    const minNational = Number(state.storeSettings?.minOrderNational) || 0;
    const requiredMin = (wilayaCode === localWilaya) ? minLocal : minNational;
    const prodSubtotal = (Number(currentLandingProduct.price) || 0) * currentLandingQty;

    if (prodSubtotal < requiredMin) {
        addToCartFromLanding();
        return;
    }

   const wilaya = state.WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="shipping_type"]:checked')?.value || 'home';
    let shipCost = calculateShippingCost(wilayaCode, state.WILAYAS, shipType);

    // 🌟 بناء تفاصيل المنتج للطلبية (بدون تكرار تعريف المتغيرات)
    let productDetails = currentLandingProduct.name;
    if (currentLandingQty > 1) productDetails += ` (x${currentLandingQty})`;
    
    if (currentSelectedVariant) {
        productDetails += ` (الخيار: ${currentSelectedVariant.name})`;
    } else {
        const selectedColor = document.querySelector('input[name="selected_product_color"]:checked')?.value || '';
        if (selectedColor) productDetails += ` (اللون: ${selectedColor})`;
    }

    const selectedNum = document.querySelector('input[name="selected_product_number"]:checked')?.value || '';
    if (selectedNum) productDetails += ` (الدرجة: ${selectedNum})`;

    const shippingTypeText = shipType === 'office' ? 'استلام من المكتب' : 'توصيل للمنزل';
const discountAmount = getLandingDiscountAmount(prodSubtotal);
    const finalProdPrice = Math.max(0, prodSubtotal - discountAmount);
    if (discountAmount > 0 && activeLandingCoupon) {
        productDetails += ` [كوبون: ${activeLandingCoupon.code} (-${discountAmount} دج)]`;
    }
   const newOrder = {
        customer: name,
        phone: rawPhone.replace(/\s+/g, ''),
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: `البلدية: ${baladiya}${address ? ' | العنوان: ' + address : ''} (${shippingTypeText})`,
        product: productDetails,
        total: finalProdPrice + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date(),
        attachedImage1: currentSelectedVariant ? currentSelectedVariant.image : null
    };

    const submitBtn = document.getElementById('main-submit-order-btn');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تسجيل طلبك...';
    }

    const orderedQty = currentLandingQty;

    // إرسال الطلب إلى Vercel API
    fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...newOrder,
            purchasedItems: [{ id: currentLandingProduct.id, qty: orderedQty }] // لتحديث المبيعات
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.error);

        localStorage.setItem('last_order_timestamp', Date.now().toString());

        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
        
        ['cust-name', 'cust-phone', 'cust-wilaya', 'cust-baladiya', 'cust-address'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        showCustomAlert('تم استلام طلبك! 🎉', state.storeSettings.msgSuccess || 'تم تسجيل طلبك بنجاح!', true);
        safeCall('showPage', 'home');
    })
    .catch(err => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
        showCustomAlert('خطأ', 'حدث خطأ: ' + err.message, false);
    });
    }
export function renderLandingDynamicOptions(p) {
    const container = document.getElementById('landing-options-container');
    if (!container || !p) return;
    let html = '';
    
    // 🌟 1. النظام الجديد: المتغيرات الديناميكية (أذواق/ألوان بصور منفصلة)
    const validVariants = Array.isArray(p.variants) 
        ? p.variants.filter(v => v && typeof v === 'object' && v.inStock !== false && String(v.name || '').trim() !== '')
        : [];

    if (validVariants.length > 0) {
        // تحديد الخيار الأول افتراضياً لضمان عدم نسيان الزبون للاختيار
        const firstVar = validVariants[0];
        currentSelectedVariant = { name: String(firstVar.name).trim(), image: firstVar.image || '' };

        html += `<div class="space-y-2 pt-2">
            <label class="block text-xs font-bold text-gray-300">اختر النوع / الذوق المتوفر *</label>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                ${validVariants.map((v, idx) => {
                    const cleanName = String(v.name || '').trim();
                    const cleanImg = String(v.image || '').trim();
                    const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const safeImg = cleanImg.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const isFirst = idx === 0;
                    return `
                    <label class="relative flex flex-col items-center justify-center bg-black/60 border border-gray-800 rounded-xl p-2 cursor-pointer hover:border-[#D4AF37] transition variant-label group">
                        <input type="radio" name="product_dynamic_variant" value="${safeName}" ${isFirst ? 'checked' : ''} class="hidden variant-radio" onchange="selectLandingVariant('${safeName}', '${safeImg}')">
                        ${cleanImg ? `<img src="${cleanImg}" class="w-10 h-10 object-cover rounded-full mb-1 border border-gray-700 group-hover:border-[#D4AF37]">` : ''}
                        <span class="text-[11px] text-white font-bold text-center leading-tight mt-1">${cleanName}</span>
                        <div class="absolute inset-0 border-2 border-[#D4AF37] rounded-xl pointer-events-none variant-outline ${isFirst ? '' : 'hidden'}"></div>
                    </label>
                `}).join('')}
            </div>
        </div>`;
    } 
    // 🌟 2. نظام الألوان القديم (محمي ضد Array و String و Null للمنتجات القديمة)
    else if (p.colors) {
        const colorsArr = Array.isArray(p.colors) 
            ? p.colors.map(c => String(c || '').trim()).filter(Boolean)
            : String(p.colors || '').split(/[,،]/).map(c => c.trim()).filter(Boolean);

        if (colorsArr.length > 0) {
            html += `<div class="space-y-1.5 pt-1"><label class="block text-xs font-bold text-gray-300">اختر اللون المتوفر *</label><div class="flex flex-wrap gap-2">
                ${colorsArr.map((col, idx) => `
                    <label class="border border-gray-800 bg-black/60 px-3 py-1.5 rounded-xl text-xs text-white cursor-pointer hover:border-[#D4AF37] flex items-center gap-2">
                        <input type="radio" name="selected_product_color" value="${col.replace(/"/g, '&quot;')}" ${idx === 0 ? 'checked' : ''} class="accent-[#D4AF37]">
                        <span>${col}</span>
                    </label>
                `).join('')}
            </div></div>`;
        }
    }

    // 🌟 3. نظام الأرقام/الدرجات القديم (إن وجد في بعض منتجات التجميل القديمة)
    if (p.numbers) {
        const numsArr = Array.isArray(p.numbers)
            ? p.numbers.map(n => String(n || '').trim()).filter(Boolean)
            : String(p.numbers || '').split(/[,،]/).map(n => n.trim()).filter(Boolean);

        if (numsArr.length > 0) {
            html += `<div class="space-y-1.5 pt-2"><label class="block text-xs font-bold text-gray-300">اختر الرقم / الدرجة *</label><div class="flex flex-wrap gap-2">
                ${numsArr.map((num, idx) => `
                    <label class="border border-gray-800 bg-black/60 px-3 py-1.5 rounded-xl text-xs text-white cursor-pointer hover:border-[#D4AF37] flex items-center gap-2">
                        <input type="radio" name="selected_product_number" value="${num.replace(/"/g, '&quot;')}" ${idx === 0 ? 'checked' : ''} class="accent-[#D4AF37]">
                        <span>${num}</span>
                    </label>
                `).join('')}
            </div></div>`;
        }
    }

    container.innerHTML = html;
}

// 🌟 دالة تفاعل الزبون: تبرز الاختيار وتغير الصورة الرئيسية فوراً
export function selectLandingVariant(name, imgUrl) {
    currentSelectedVariant = { name, image: imgUrl };
    
    if (imgUrl) {
        swapLandingMainImage(imgUrl);
    }
    
    document.querySelectorAll('.variant-outline').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.variant-radio:checked').forEach(radio => {
        const outline = radio.parentElement.querySelector('.variant-outline');
        if (outline) outline.classList.remove('hidden');
    });
}
window.selectLandingVariant = selectLandingVariant;

export function openLightbox() {
    const mainImg = document.getElementById('landing-main-img')?.src;
    const lightboxModal = document.getElementById('image-lightbox-modal');
    const lightboxTarget = document.getElementById('lightbox-target-img');
    if (lightboxModal && lightboxTarget && mainImg) {
        lightboxTarget.src = mainImg;
        lightboxModal.classList.remove('hidden');
        lightboxModal.classList.add('flex');
    }
}

export function closeLightbox() {
    const lightboxModal = document.getElementById('image-lightbox-modal');
    if (lightboxModal) {
        lightboxModal.classList.add('hidden');
        lightboxModal.classList.remove('flex');
    }
}

// 🌟 1. دالة مشاركة ونسخ الرابط المباشر للمنتج (لإعلانات فيسبوك وواتساب)
export function shareCurrentProduct() {
    if (!currentLandingProduct) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#product=${currentLandingProduct.id}`;
    const shareTitle = `${currentLandingProduct.name} - ${ state.storeSettings.name || 'كوسمتيك عبد الحق' }`;

    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: `اكتشف هذا المنتج الفاخر: ${currentLandingProduct.name} بسعر ${formatPrice(currentLandingProduct.price)}`,
            url: shareUrl
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showCustomAlert('تم نسخ الرابط! 🔗', 'تم نسخ الرابط المباشر للمنتج، يمكنك الآن لصقه في إعلانات فيسبوك أو إرساله لأي زبون!', true);
        }).catch(() => {
            prompt('انسخ رابط المنتج المباشر:', shareUrl);
        });
    }
}

// 🌟 2. دالة عرض "منتجات قد تعجبك أيضاً" من نفس القسم (Cross-Selling)
export function renderRelatedProducts(currentProd) {
    const section = document.getElementById('related-products-section');
    const grid = document.getElementById('related-products-grid');
    if (!section || !grid || !state.products) return;

    const currentCat = (currentProd.category || '').trim();
    let related = state.products.filter(p => 
        p.id !== currentProd.id && 
        p.inStock !== false && 
        (p.category || '').trim() === currentCat
    ).slice(0, 4);

    if (related.length < 4) {
        const extra = state.products.filter(p => 
            p.id !== currentProd.id && 
            p.inStock !== false && 
            !related.some(r => r.id === p.id)
        ).slice(0, 4 - related.length);
        related = [...related, ...extra];
    }

    if (related.length === 0 || typeof window.renderSingleProductCard !== 'function') {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    grid.innerHTML = related.map(window.renderSingleProductCard).join('');
}

// 🌟 3. دالة فحص الرابط عند فتح المتجر لأول مرة (تعمل حتى لو لم يكن المنتج ضمن أول 30 منتجاً!)
export async function checkInitialProductDeepLink() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#product=')) {
        const prodId = decodeURIComponent(hash.replace('#product=', '').trim());
        if (prodId) {
            await openLandingPage(prodId, false);
        }
    }
}

// Window Binding
window.openLandingPage = openLandingPage;
window.swapLandingMainImage = swapLandingMainImage;
window.populateWilayas = populateWilayas;
window.handleWilayaChange = handleWilayaChange;
window.calculateLandingTotal = calculateLandingTotal;
window.submitLandingOrder = submitLandingOrder;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.checkSmartOrderButton = checkSmartOrderButton;
window.addToCartFromLanding = addToCartFromLanding;
window.shareCurrentProduct = shareCurrentProduct;
window.renderRelatedProducts = renderRelatedProducts;
window.checkInitialProductDeepLink = checkInitialProductDeepLink;
window.changeLandingQty = changeLandingQty;
window.applyLandingCoupon = applyLandingCoupon;
