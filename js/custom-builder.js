// --- ملف js/custom-builder.js ---

import { state, saveCartToLocal } from './store/state.js';
import { showCustomAlert, calculateShippingCost, isValidDzPhone, safeCall } from './utils/helpers.js';

let currentCustomStep = 1;
const TOTAL_CUSTOM_STEPS = 4;
let customOrderItems = [];

function getEmptyCustomItem() {
    return {
        serviceType: '',
        serviceName: '',
        selectedProductId: '',
        selectedProduct: '',
        productImage: '',
        color: '',
        size: '',
        font: '',
        position: '',
        facesCount: '1',
        basePrice: 0,
        addonsPrice: 0,
        designMode: 'template',
        selectedTemplate: null,
        text1: '',
        text2: '',
        uploadedImage1: '',
        uploadedImage2: '',
        uploadedImage3: '',
        notes: ''
    };
}

let customOrderData = {
    ...getEmptyCustomItem(),
    customerName: '',
    customerPhone: '',
    wilaya: '',
    baladiya: '',
    commune: '',
    shippingType: 'home'
};
window.customOrderData = customOrderData;

function parseSizeOption(raw) {
    const str = String(raw || '').trim();
    const parts = str.split(/[:：]/);
    if (parts.length >= 2) {
        const label = parts[0].trim();
        const num = parseFloat(parts[1].trim());
        if (label && !isNaN(num) && num >= 0) {
            return { label, price: num };
        }
    }
    return { label: str, price: null };
}

function getSelectedWorkshopProduct() {
    const config = (state.storeSettings && state.storeSettings.custom_workshop) || { products: [] };
    return (config.products || []).find(p => p.id === customOrderData.selectedProductId) || null;
}

function extractCurrentItemSnapshot() {
    return {
        serviceType: customOrderData.serviceType,
        serviceName: customOrderData.serviceName,
        selectedProductId: customOrderData.selectedProductId,
        selectedProduct: customOrderData.selectedProduct,
        productImage: customOrderData.productImage,
        color: customOrderData.color,
        size: customOrderData.size,
        font: customOrderData.font,
        position: customOrderData.position,
        facesCount: customOrderData.facesCount,
        basePrice: Number(customOrderData.basePrice) || 0,
        addonsPrice: Number(customOrderData.addonsPrice) || 0,
        designMode: customOrderData.designMode,
        selectedTemplate: customOrderData.selectedTemplate ? { ...customOrderData.selectedTemplate } : null,
        text1: customOrderData.text1,
        text2: customOrderData.text2,
        uploadedImage1: customOrderData.uploadedImage1,
        uploadedImage2: customOrderData.uploadedImage2,
        uploadedImage3: customOrderData.uploadedImage3,
        notes: customOrderData.notes
    };
}

function getAllCustomItemsForCheckout() {
    const items = [...customOrderItems];
    if (customOrderData.selectedProductId) {
        items.push(extractCurrentItemSnapshot());
    }
    return items;
}

function getCustomItemPrice(item) {
    return (Number(item.basePrice) || 0) + (Number(item.addonsPrice) || 0);
}

function buildPreparedItemsBannerHtml() {
    if (customOrderItems.length === 0) return '';
    const savedTotal = customOrderItems.reduce((sum, item) => sum + getCustomItemPrice(item), 0);
    return `
        <div class="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-2xl p-3 mb-4 text-right space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-xs font-black text-[#D4AF37]">
                    <i class="fa-solid fa-basket-shopping ml-1"></i> منتجات مجهزة في طلبك (${customOrderItems.length}) — ${savedTotal.toLocaleString()} دج
                </span>
                <button type="button" onclick="goToCustomShippingStep()" class="bg-[#D4AF37] text-black text-[11px] font-black px-3 py-1.5 rounded-lg hover:opacity-90 transition cursor-pointer">
                    إكمال التوصيل الآن <i class="fa-solid fa-truck-fast mr-1"></i>
                </button>
            </div>
            <div class="flex flex-wrap gap-1.5">
                ${customOrderItems.map((item, idx) => `
                    <span class="inline-flex items-center gap-1.5 bg-black/80 border border-[#D4AF37]/30 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        <span class="max-w-[160px] truncate">${item.selectedProduct}${item.size ? ` (${item.size})` : ''}</span>
                        <span class="text-[#D4AF37]">${getCustomItemPrice(item).toLocaleString()} دج</span>
                        <button type="button" onclick="removeCustomOrderItem(${idx})" class="text-red-400 hover:text-red-300 mr-0.5 cursor-pointer" title="إزالة">
                            <i class="fa-solid fa-xmark text-[10px]"></i>
                        </button>
                    </span>
                `).join('')}
            </div>
        </div>
    `;
}

export function previewCustomImage(imgUrl, title = '') {
    document.getElementById('custom-img-preview-modal')?.remove();
    if (!imgUrl) return;
    const safeTitle = String(title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const modalHtml = `
        <div id="custom-img-preview-modal" class="fixed inset-0 z-[150] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onclick="this.remove()">
            <div class="relative w-full max-w-sm bg-gray-900 border border-[#D4AF37]/40 rounded-3xl p-4 text-center shadow-2xl" onclick="event.stopPropagation()">
                <button type="button" onclick="document.getElementById('custom-img-preview-modal')?.remove()" class="absolute -top-3 -right-3 w-8 h-8 bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center justify-center shadow-lg border-2 border-gray-900 cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
                <img src="${imgUrl}" class="w-full max-h-[65vh] object-contain bg-black/60 rounded-xl mb-3 border border-gray-800" loading="lazy">
                ${safeTitle ? `<p class="text-[#D4AF37] font-black text-sm">${safeTitle}</p>` : ''}
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export function openCustomBuilder() {
    const config = (state.storeSettings && state.storeSettings.custom_workshop) || {};
    
    if (config.isActive === false) {
        showCustomAlert("الورشة مغلقة مؤقتاً 🛠️", "نحن نقوم بصيانة وتحديث آلاتنا حالياً، يرجى العودة لاحقاً لطلب تصميمك الخاص!", false);
        return;
    }

    // تصفير البيانات عند فتح نافذة جديدة
    currentCustomStep = 1;
    customOrderItems = [];
    customOrderData = {
        ...getEmptyCustomItem(),
        customerName: '', customerPhone: '', wilaya: '', baladiya: '', commune: '', shippingType: 'home'
    };
    window.customOrderData = customOrderData;

    renderCustomStep();
    const modal = document.getElementById('custom-builder-modal');
    if (modal) { 
        modal.classList.remove('hidden'); 
        modal.classList.add('flex'); 
    }
}

export function closeCustomBuilder() {
    document.getElementById('custom-img-preview-modal')?.remove();
    const modal = document.getElementById('custom-builder-modal');
    if (modal) { 
        modal.classList.add('hidden'); 
        modal.classList.remove('flex'); 
    }
}

// تحديث السعر الحي في الشريط السفلي للنافذة
export function updateLivePriceDisplay() {
    const priceBadge = document.getElementById('custom-live-price');
    if (!priceBadge) return;

    const allItems = getAllCustomItemsForCheckout();
    let total = allItems.reduce((sum, item) => sum + getCustomItemPrice(item), 0);

    if (currentCustomStep === 3 && customOrderData.wilaya) {
        const shipCost = calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType);
        total += shipCost;
    }

    if (currentCustomStep < 4 && total > 0) {
        priceBadge.innerText = total.toLocaleString() + ' دج';
        priceBadge.classList.remove('hidden');
    } else {
        priceBadge.classList.add('hidden');
    }
}

export function renderCustomStep() {
    const container = document.getElementById('custom-wizard-content');
    const indicator = document.getElementById('custom-step-indicator');
    const prevBtn = document.getElementById('custom-prev-btn');
    const nextBtn = document.getElementById('custom-next-btn');
    
    if (!container) return;

    if (indicator) indicator.innerText = `الخطوة ${currentCustomStep} من ${TOTAL_CUSTOM_STEPS}`;
    
    if (prevBtn) {
        prevBtn.className = 'bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5';
        prevBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> <span>رجوع</span>';
        prevBtn.classList.toggle('hidden', currentCustomStep === 1);
    }

    if (nextBtn) {
        nextBtn.className = 'gold-gradient text-black text-xs font-black px-4 py-2.5 rounded-xl hover:opacity-90 transition shadow-lg flex items-center justify-center gap-1.5';
        nextBtn.innerHTML = '<span>التالي</span> <i class="fa-solid fa-arrow-left"></i>';

        if (currentCustomStep === 1 || currentCustomStep === TOTAL_CUSTOM_STEPS) {
            nextBtn.classList.add('hidden');
        } else {
            nextBtn.classList.remove('hidden');
        }
    }

    const config = (state.storeSettings && state.storeSettings.custom_workshop) || { products: [] };
    let html = '';

    switch (currentCustomStep) {
        case 1:
            html = `
                <div class="space-y-5 animate-fade-in text-center">
                    ${buildPreparedItemsBannerHtml()}
                    <h2 class="text-2xl font-black text-white mb-2">${customOrderItems.length > 0 ? 'اختر قسم المنتج الإضافي 🎨' : 'ماذا تريد أن نصمم لك اليوم؟ 🎨'}</h2>
                    <p class="text-gray-400 text-sm mb-6">اختر نوع الخدمة التي تريدها</p>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" onclick="selectCustomService('laser', 'حفر بالليزر 🪵')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3 cursor-pointer">
                            <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-fire"></i></div>
                            <h3 class="text-white font-bold text-lg">حفر بالليزر</h3>
                            <p class="text-xs text-gray-500">بورت موني، مشطة، سلاك، فرشاة، والمزيد...</p>
                        </button>
                        
                        <button type="button" onclick="selectCustomService('print', 'طباعة حرارية 👕☕🎨')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3 cursor-pointer">
                            <div class="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-mug-hot"></i></div>
                            <h3 class="text-white font-bold text-lg">طباعة حرارية</h3>
                            <p class="text-xs text-gray-500">شوب سحري وعادي، تيشرت، بورتكلي، والمزيد...</p>
                        </button>
                        
                        <button type="button" onclick="selectCustomService('frame', 'كادرات وصور 📸🔲')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3 cursor-pointer">
                            <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-id-badge"></i></div>
                            <h3 class="text-white font-bold text-lg">تصميم كادرات</h3>
                            <p class="text-xs text-gray-500">صور ذكريات، كادر ذهبي فاخر، كادر جميع المناسبات...</p>
                        </button>
                        
                        <button type="button" onclick="selectCustomService('cameo', 'قص كاميو 5 ✒️✂️')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3 cursor-pointer">
                            <div class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-scissors"></i></div>
                            <h3 class="text-white font-bold text-lg">قص وتفريغ (كاميو)</h3>
                            <p class="text-xs text-gray-500">كلمات وأسماء ذهبية بارزة لمناسباتكم</p>
                        </button>
                    </div>
                </div>
            `;
            break;

        case 2:
            html = buildDynamicServiceOptions(config);
            break;

        case 3:
            html = `
                <div class="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-right">
                    <h4 class="font-black text-lg text-white text-center mb-4">أين نرسل لك هذا الإبداع؟ 🚚</h4>
                    <div class="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs text-gray-400 font-bold block mb-1">الاسم واللقب *</label>
                                <input type="text" id="c-name" value="${customOrderData.customerName}" oninput="customOrderData.customerName=this.value" placeholder="أدخل اسمك الكامل" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                            </div>
                            <div>
                                <label class="text-xs text-gray-400 font-bold block mb-1">رقم الهاتف (10 أرقام) *</label>
                                <input type="tel" id="c-phone" maxlength="10" value="${customOrderData.customerPhone}" oninput="this.value=this.value.replace(/[^0-9]/g,''); customOrderData.customerPhone=this.value" placeholder="05 / 06 / 07..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="text-xs text-[#D4AF37] font-bold block mb-1">الولاية *</label>
                                <select id="c-wilaya" onchange="customOrderData.wilaya=this.value; updateLivePriceDisplay();" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37] cursor-pointer">
                                    <option value="">اختر ولايتك لحساب التوصيل...</option>
                                    ${state.WILAYAS.map(w => `<option value="${w.code}" ${customOrderData.wilaya === w.code ? 'selected' : ''}>${w.code} -${w.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="text-xs text-[#D4AF37] font-bold block mb-2">طريقة التوصيل *</label>
                                <div class="flex gap-3">
                                    <div id="btn-custom-ship-office" onclick="setCustomShipping('office')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${customOrderData.shippingType === 'office' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-store"></i> استلام من المكتب
                                    </div>
                                    <div id="btn-custom-ship-home" onclick="setCustomShipping('home')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${customOrderData.shippingType === 'home' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-house"></i> توصيل للمنزل
                                    </div>
                                </div>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="text-xs text-[#D4AF37] font-bold block mb-1">البلدية *</label>
                                <input type="text" id="c-baladiya" value="${customOrderData.baladiya || ''}" oninput="customOrderData.baladiya=this.value" placeholder="أدخل اسم البلدية" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                            </div>
                            <div class="md:col-span-2">
                                <label class="text-xs text-[#D4AF37] font-bold block mb-1">العنوان التفصيلي / الحي (اختياري) *</label>
                                <input type="text" id="c-commune" value="${customOrderData.commune || ''}" oninput="customOrderData.commune=this.value" placeholder="الحي، الشارع، أو نقطة استدلال..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 4:
            const checkoutItems = getAllCustomItemsForCheckout();
            const shipCost = customOrderData.wilaya ? calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType) : 0;
            const designPrice = checkoutItems.reduce((sum, item) => sum + getCustomItemPrice(item), 0);
            const finalTotal = designPrice + shipCost;

            html = `
                <div class="space-y-5 animate-fade-in text-right">
                    <div class="text-center mb-4">
                        <i class="fa-solid fa-file-invoice text-4xl text-[#D4AF37] mb-2"></i>
                        <h4 class="font-black text-lg text-white">مراجعة طلبك المخصص (${checkoutItems.length} ${checkoutItems.length > 1 ? 'منتجات' : 'منتج'})</h4>
                    </div>

                    <div class="bg-black p-5 rounded-2xl border border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] space-y-4">
                        <div class="space-y-3 text-sm text-gray-300 border-b border-gray-800 pb-4">
                            ${checkoutItems.map((item, idx) => `
                                <div class="bg-gray-900/70 border border-gray-800 rounded-xl p-3 space-y-1.5 relative">
                                    ${checkoutItems.length > 1 ? `<button type="button" onclick="removeCustomOrderItem(${idx})" class="absolute top-2.5 left-2.5 text-red-400 hover:text-red-300 text-xs bg-red-950/50 px-2 py-1 rounded-lg cursor-pointer" title="حذف هذا المنتج"><i class="fa-solid fa-trash"></i></button>` : ''}
                                    <div class="flex items-center gap-2.5">
                                        <img src="${item.productImage || 'https://via.placeholder.com/60'}" class="w-11 h-11 object-contain bg-white rounded-lg p-0.5 shrink-0">
                                        <div>
                                            <p class="font-black text-white text-xs">${checkoutItems.length > 1 ? `${idx + 1}. ` : ''}${item.selectedProduct}</p>
                                            <p class="text-[11px] text-gray-400">${item.serviceName} — <span class="text-[#D4AF37] font-black">${getCustomItemPrice(item).toLocaleString()} دج</span></p>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                                        ${item.size ? `<span class="bg-black px-2 py-0.5 rounded border border-gray-800">المقاس: <b class="text-white">${item.size}</b></span>` : ''}
                                        ${item.color ? `<span class="bg-black px-2 py-0.5 rounded border border-gray-800">اللون: <b class="text-white">${item.color}</b></span>` : ''}
                                        ${item.font ? `<span class="bg-black px-2 py-0.5 rounded border border-gray-800">الخط: <b class="text-white">${item.font}</b></span>` : ''}
                                        ${item.position ? `<span class="bg-black px-2 py-0.5 rounded border border-gray-800">المكان: <b class="text-white">${item.position}</b></span>` : ''}
                                        ${item.facesCount === '2' ? `<span class="bg-black px-2 py-0.5 rounded border border-[#D4AF37]/40 text-[#D4AF37]">وجهان</span>` : ''}
                                        ${item.selectedTemplate ? `<span class="bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/40">التصميم: <b>${item.selectedTemplate.name}</b></span>` : ''}
                                    </div>
                                    ${item.text1 ? `<div class="bg-black/70 p-2 rounded-lg text-[11px] border border-gray-800"><span class="text-gray-500">النص 1:</span> <span class="text-white">${item.text1}</span></div>` : ''}
                                    ${item.text2 ? `<div class="bg-black/70 p-2 rounded-lg text-[11px] border border-gray-800"><span class="text-gray-500">النص 2:</span> <span class="text-white">${item.text2}</span></div>` : ''}
                                    ${item.notes ? `<div class="bg-black/70 p-2 rounded-lg text-[11px] border border-gray-800"><span class="text-gray-500">ملاحظات:</span> <span class="text-white">${item.notes}</span></div>` : ''}
                                </div>
                            `).join('')}

                            <div class="flex justify-between items-center pt-2">
                                <span>إجمالي التصاميم والمنتجات:</span>
                                <span class="font-bold text-white">${designPrice.toLocaleString()} دج</span>
                            </div>
                            <div class="flex justify-between items-center text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded-lg mt-2">
                                <span>التوصيل (${customOrderData.shippingType === 'home' ? 'للمنزل' : 'للمكتب'}):</span>
                                <span class="font-bold">${shipCost.toLocaleString()} دج</span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center pt-2">
                            <span class="text-lg font-black text-white">الإجمالي النهائي:</span>
                            <span class="text-2xl font-black text-[#D4AF37]">${finalTotal.toLocaleString()} دج</span>
                        </div>
                    </div>

                    <!-- 🌟 خيارات الدفع المباشر للورشة 🌟 -->
                    <!-- 🌟 خيارات الدفع المباشر للورشة مع التوضيحات 🌟 -->
                    <div class="mt-4 p-4 bg-black rounded-2xl border border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.1)] text-right">
                        <label class="block text-xs font-bold text-[#D4AF37] mb-3">اختر طريقة الدفع (لتأكيد الطلب المخصص):</label>
                        
                        <div class="flex flex-col gap-3">
                            <!-- خيار المحل -->
                            <div>
                                <label class="flex items-center gap-3 cursor-pointer bg-gray-900 p-3 rounded-lg border border-gray-800 hover:border-[#D4AF37] transition">
                                    <input type="radio" name="custom_payment_method" value="in_store" class="accent-[#D4AF37] w-4 h-4" checked onchange="document.getElementById('custom-baridi-upload').classList.add('hidden'); document.getElementById('custom-instore-info').classList.remove('hidden');">
                                    <span class="text-sm text-white font-bold"><i class="fa-solid fa-shop text-[#D4AF37] ml-1"></i> الدفع داخل المحل</span>
                                </label>
                                <div id="custom-instore-info" class="mt-2 p-3 bg-orange-900/20 border border-orange-500/30 rounded-xl text-[11px] text-orange-200 font-bold leading-relaxed">
                                    ⚠️ <b>توضيح هام:</b> نظراً لأن هذا المنتج سيُصمم <u>خصيصاً لك</u>، نرجو منك التفضل بزيارة محلنا لدفع المبلغ. (لن يتم البدء في تصميم طلبك إلا بعد تأكيد الدفع في المحل).
                                </div>
                            </div>

                            <!-- خيار بريدي موب -->
                            <div>
                                <label class="flex items-center gap-3 cursor-pointer bg-gray-900 p-3 rounded-lg border border-gray-800 hover:border-[#D4AF37] transition">
                                    <input type="radio" name="custom_payment_method" value="baridimob" class="accent-[#D4AF37] w-4 h-4" onchange="document.getElementById('custom-baridi-upload').classList.remove('hidden'); document.getElementById('custom-instore-info').classList.add('hidden');">
                                    <span class="text-sm text-white font-bold"><i class="fa-solid fa-credit-card text-blue-500 ml-1"></i> الدفع عبر بريدي موب</span>
                                </label>
                                
                                <div id="custom-baridi-upload" class="hidden mt-2 p-4 bg-blue-900/10 border border-blue-500/30 rounded-xl">
                                    <div class="text-[11px] text-blue-200 font-bold leading-relaxed mb-3">
                                        💳 <b>الدفع المسبق مطلوب:</b> لأن هذا الطلب مخصص لك وحدك، يرجى تحويل المبلغ الإجمالي للحساب أدناه، وإرفاق الوصل لنبدأ بتجهيزه فوراً دون عناء تنقلك للمحل.
                                    </div>
                                    <!-- ⚠️ ضع رابط صورة الـ RIP والـ CCP الخاصة بك هنا 👇 -->
                                    <img src="https://firebasestorage.googleapis.com/v0/b/cos-abdelhak.firebasestorage.app/o/%D8%AA%D9%86%D8%B2%D9%8A%D9%84.png?alt=media&token=32badda4-d399-4254-b2a1-da8ebb15ed16" class="w-full h-auto object-contain rounded-lg border border-gray-700 mb-3" alt="معلومات الحساب">
                                    
                                    <label class="block text-[10px] font-bold text-gray-400 mb-1">أرفق صورة وصل الدفع هنا:</label>
                                    <input type="file" accept="image/*" id="custom-receipt-file" class="w-full text-xs text-gray-400 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#D4AF37] file:font-bold file:text-black cursor-pointer hover:file:bg-yellow-500">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 pt-4 mt-2 border-t border-gray-800 relative z-10">
                        <button type="button" onclick="submitCustomOrder()" class="flex-1 py-3.5 gold-gradient text-black font-black rounded-xl shadow-lg hover:scale-105 transition flex items-center justify-center gap-2 cursor-pointer">
                            <i class="fa-solid fa-bolt"></i> اطلب الآن (مباشرة)
                        </button>
                        <button type="button" onclick="addCustomToCart()" class="flex-1 py-3.5 bg-black text-[#D4AF37] border border-[#D4AF37]/50 font-black rounded-xl shadow-lg hover:bg-gray-900 transition flex items-center justify-center gap-2 cursor-pointer">
                            <i class="fa-solid fa-cart-plus"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            `;
            break;
    }

    container.innerHTML = html;
    updateLivePriceDisplay();
}

// بناء الخيارات الديناميكية في الخطوة 2 (بطاقات مصوّرة + تسعير مقاسات + معرض تصاميم + أزرار لمس)
function buildDynamicServiceOptions(config) {
    const categoryProducts = (config.products || []).filter(p => p.category === customOrderData.serviceType && p.inStock !== false);
    window.currentCategoryProducts = categoryProducts;

    if (categoryProducts.length === 0) {
        return `
            <div class="space-y-4">
                ${buildPreparedItemsBannerHtml()}
                <div class="text-center p-10 text-gray-400 font-bold border border-dashed border-gray-700 rounded-2xl bg-gray-900">عذراً، لا توجد منتجات متوفرة في هذا القسم حالياً 😔. يرجى مراجعتنا لاحقاً.</div>
            </div>`;
    }

    const selectedProd = categoryProducts.find(p => p.id === customOrderData.selectedProductId) || null;

    let html = `<div class="space-y-5 animate-fade-in text-right max-h-[62vh] overflow-y-auto pr-2 custom-scrollbar">`;
    html += buildPreparedItemsBannerHtml();
    html += `<h4 class="font-black text-lg text-white text-center">تفاصيل ${customOrderData.serviceName}</h4>`;

    // 1. شبكة بطاقات المنتجات المصوّرة
    html += `
        <div class="space-y-2">
            <label class="block text-xs font-bold text-[#D4AF37]">1. اختر المنتج أو النوع:</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                ${categoryProducts.map(p => {
                    const isSelected = customOrderData.selectedProductId === p.id;
                    const safeId = String(p.id || '').replace(/'/g, "\\'");
                    const safeName = String(p.name || '').replace(/'/g, "\\'");
                    const safeImg = String(p.image || '').replace(/'/g, "\\'");
                    return `
                        <div class="relative bg-black/60 rounded-2xl border p-2.5 text-center transition ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.25)]' : 'border-gray-800 hover:border-gray-600'}">
                            ${p.image ? `<button type="button" onclick="event.stopPropagation(); previewCustomImage('${safeImg}', '${safeName}')" class="absolute top-2 left-2 w-7 h-7 bg-black/80 text-gray-300 hover:text-[#D4AF37] rounded-full flex items-center justify-center text-[10px] z-10 cursor-pointer border border-gray-700" title="تكبير الصورة"><i class="fa-solid fa-expand"></i></button>` : ''}
                            ${isSelected ? `<div class="absolute top-2 right-2 w-6 h-6 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-[11px] z-10"><i class="fa-solid fa-check"></i></div>` : ''}
                            <div onclick="handleProductSelection('${safeId}')" class="cursor-pointer">
                                <img src="${p.image || 'https://via.placeholder.com/120'}" class="w-full h-24 object-contain bg-white rounded-xl p-1 mb-2" loading="lazy">
                                <p class="font-bold text-xs text-white line-clamp-1">${p.name}</p>
                                <p class="text-[#D4AF37] font-black text-xs mt-1">${(Number(p.basePrice) || 0).toLocaleString()} دج</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // 2. تفاصيل تخصيص المنتج المختار
    if (selectedProd) {
        const colorsArr = (selectedProd.colors || '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
        const sizesArr = (selectedProd.sizes || '').split(/[,،]/).map(parseSizeOption).filter(o => o.label);
        const fontsArr = (selectedProd.fonts || '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
        const positionsArr = (selectedProd.positions || '').split(/[,،]/).map(s => s.trim()).filter(Boolean);
        const templatesArr = Array.isArray(selectedProd.templates) ? selectedProd.templates : [];
        const face2Price = Number(selectedProd.face2Price) || 0;
        const imgReq = selectedProd.imgReq || 'optional';
        const maxChars = selectedProd.maxChars ? parseInt(selectedProd.maxChars) : null;
        const maxCharText = maxChars ? ` (أقصى حد ${maxChars} حرف)` : '';
        const showText2 = customOrderData.facesCount === '2' || ((customOrderData.serviceType === 'cameo' || customOrderData.serviceType === 'frame') && !!selectedProd.label2);

        html += `<div id="dynamic-fields-container" class="space-y-4 pt-4 border-t border-gray-800 animate-fade-in">`;

        // المقاسات بأزرار لمس مع تسعير ذكي اختياري
        if (sizesArr.length > 0) {
            html += `
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-[#D4AF37]">اختر المقاس / الحجم:</label>
                    <div class="flex flex-wrap gap-2">
                        ${sizesArr.map(opt => {
                            const isActive = customOrderData.size === opt.label;
                            const safeLabel = opt.label.replace(/'/g, "\\'");
                            const priceArg = opt.price !== null ? opt.price : 'null';
                            return `
                                <button type="button" onclick="selectCustomSize('${safeLabel}', ${priceArg})" class="px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md' : 'bg-black text-gray-300 border-gray-700 hover:border-[#D4AF37]/60'}">
                                    ${opt.label}${opt.price !== null ? ` <span class="opacity-85">(${opt.price.toLocaleString()} دج)</span>` : ''}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // الألوان بأزرار لمس
        if (colorsArr.length > 0) {
            html += `
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-gray-300">اللون المطلوب:</label>
                    <div class="flex flex-wrap gap-2">
                        ${colorsArr.map(c => {
                            const isActive = customOrderData.color === c;
                            const safeC = c.replace(/'/g, "\\'");
                            return `
                                <button type="button" onclick="selectCustomChip('color', '${safeC}')" class="px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-gray-300 border-gray-700 hover:border-gray-500'}">
                                    ${c}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // مكان التصميم بأزرار لمس
        if (positionsArr.length > 0) {
            html += `
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-gray-300">مكان التصميم:</label>
                    <div class="flex flex-wrap gap-2">
                        ${positionsArr.map(pos => {
                            const isActive = customOrderData.position === pos;
                            const safePos = pos.replace(/'/g, "\\'");
                            return `
                                <button type="button" onclick="selectCustomChip('position', '${safePos}')" class="px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-gray-300 border-gray-700 hover:border-gray-500'}">
                                    ${pos}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // نوع الخط بأزرار لمس
        if (fontsArr.length > 0) {
            html += `
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-gray-300">نوع الخط:</label>
                    <div class="flex flex-wrap gap-2">
                        ${fontsArr.map(f => {
                            const isActive = customOrderData.font === f;
                            const safeF = f.replace(/'/g, "\\'");
                            return `
                                <button type="button" onclick="selectCustomChip('font', '${safeF}')" class="px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${isActive ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-gray-300 border-gray-700 hover:border-gray-500'}">
                                    ${f}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // خيار الوجه الثاني
        if (face2Price > 0) {
            html += `
                <div class="space-y-2">
                    <label class="block text-xs font-bold text-[#D4AF37]">كم وجه تريد؟</label>
                    <div class="grid grid-cols-2 gap-2.5">
                        <button type="button" onclick="handleFacesChange('1')" class="p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${customOrderData.facesCount !== '2' ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                            وجه واحد أساسي
                        </button>
                        <button type="button" onclick="handleFacesChange('2')" class="p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${customOrderData.facesCount === '2' ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                            وجهان (+${face2Price.toLocaleString()} دج)
                        </button>
                    </div>
                </div>
            `;
        }

        // معرض التصاميم الجاهزة مقابل تصميم خاص (يظهر فقط إذا أضاف المدير نماذج للمنتج)
        if (templatesArr.length > 0) {
            const isTemplateMode = customOrderData.designMode !== 'custom';
            html += `
                <div class="space-y-3 pt-2 border-t border-gray-800/80">
                    <label class="block text-xs font-bold text-[#D4AF37]">طريقة التصميم 🎨:</label>
                    <div class="grid grid-cols-2 gap-2.5">
                        <button type="button" onclick="setCustomDesignMode('template')" class="p-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${isTemplateMode ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                            <i class="fa-solid fa-images"></i> من تصاميمنا الجاهزة
                        </button>
                        <button type="button" onclick="setCustomDesignMode('custom')" class="p-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${!isTemplateMode ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> تصميم خاص بفكرتي
                        </button>
                    </div>
                    ${isTemplateMode ? `
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                            ${templatesArr.map(t => {
                                const isChosen = customOrderData.selectedTemplate && customOrderData.selectedTemplate.id === t.id;
                                const safeTid = String(t.id || '').replace(/'/g, "\\'");
                                const safeTname = String(t.name || '').replace(/'/g, "\\'");
                                const safeTimg = String(t.image || '').replace(/'/g, "\\'");
                                return `
                                    <div class="relative bg-black/60 p-1.5 rounded-xl border text-center transition ${isChosen ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_12px_rgba(212,175,55,0.25)]' : 'border-gray-800 hover:border-gray-600'}">
                                        <button type="button" onclick="event.stopPropagation(); previewCustomImage('${safeTimg}', '${safeTname}')" class="absolute top-2 left-2 w-6 h-6 bg-black/80 text-gray-200 hover:text-[#D4AF37] rounded-full flex items-center justify-center text-[10px] z-10 cursor-pointer"><i class="fa-solid fa-expand"></i></button>
                                        ${isChosen ? `<div class="absolute top-2 right-2 w-5 h-5 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-[10px] z-10"><i class="fa-solid fa-check"></i></div>` : ''}
                                        <div onclick="selectCustomTemplate('${safeTid}', '${safeTname}', '${safeTimg}')" class="cursor-pointer">
                                            <img src="${t.image}" class="w-full h-24 object-cover rounded-lg mb-1.5 bg-gray-900" loading="lazy">
                                            <p class="text-[11px] font-bold text-white line-clamp-1">${t.name}</p>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <p class="text-[11px] text-gray-400 bg-black/50 p-2.5 rounded-xl border border-gray-800">أرفق صورك أو اكتب فكرة التصميم المطلوب بالأسفل وسنصممه لك خصيصاً ✨</p>
                    `}
                </div>
            `;
        }

        // رفع صور الزبون مع معاينة مصغّرة فورية
        if (imgReq !== 'none') {
            const reqBadge = imgReq === 'required'
                ? '<span class="text-red-400 font-black text-[10px] mr-1">(إجبارية - صورة واحدة على الأقل)</span>'
                : '<span class="text-gray-500 font-bold text-[10px] mr-1">(اختياري)</span>';
            const imgSlots = [
                { idx: 1, label: 'الصورة الأولى', val: customOrderData.uploadedImage1, btnClass: 'file:bg-[#D4AF37] file:text-black' },
                { idx: 2, label: 'الصورة الثانية (إضافية)', val: customOrderData.uploadedImage2, btnClass: 'file:bg-gray-700 file:text-white' },
                { idx: 3, label: 'الصورة الثالثة (إضافية)', val: customOrderData.uploadedImage3, btnClass: 'file:bg-gray-700 file:text-white' }
            ];
            html += `
                <div class="space-y-2.5">
                    <label class="block text-xs font-bold text-[#D4AF37]">أرفق صور للتصميم 📸 ${reqBadge}:</label>
                    ${imgSlots.map(slot => `
                        <div class="bg-black/40 p-3 rounded-xl border border-gray-800">
                            <label class="block text-[10px] text-gray-400 mb-1">${slot.label}</label>
                            <input type="file" accept="image/*" onchange="handleCustomImageUpload(event, ${slot.idx})" class="w-full border border-gray-700 p-2 rounded-xl text-xs bg-gray-900 text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold ${slot.btnClass} cursor-pointer">
                            ${slot.val ? `
                                <div class="flex items-center justify-between gap-2 bg-green-900/20 border border-green-800 p-2 rounded-xl mt-2">
                                    <div class="flex items-center gap-2.5">
                                        <img src="${slot.val}" onclick="previewCustomImage('${slot.val}', '${slot.label}')" class="w-12 h-12 object-cover rounded-lg border border-[#D4AF37]/40 cursor-zoom-in">
                                        <p class="text-green-400 text-xs font-bold"><i class="fa-solid fa-check ml-1"></i> تم الإرفاق</p>
                                    </div>
                                    <button type="button" onclick="removeCustomUploadedImage(${slot.idx})" class="text-red-400 hover:text-red-200 text-xs font-bold bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-900/50 cursor-pointer"><i class="fa-solid fa-trash"></i> حذف</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // الحقول النصية
        html += `
            <div>
                <label class="block text-xs font-bold text-gray-300 mb-1">${(selectedProd.label1 || 'النص المطلوب:') + maxCharText}</label>
                <textarea id="dynamic-text-1" ${maxChars ? `maxlength="${maxChars}"` : ''} oninput="customOrderData.text1=this.value" rows="2" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37] placeholder-gray-600" placeholder="اكتب هنا...">${customOrderData.text1 || ''}</textarea>
            </div>
        `;

        if (showText2) {
            html += `
                <div>
                    <label class="block text-xs font-bold text-gray-300 mb-1">${(selectedProd.label2 || 'النص الإضافي (الوجه الثاني):') + maxCharText}</label>
                    <textarea id="dynamic-text-2" ${maxChars ? `maxlength="${maxChars}"` : ''} oninput="customOrderData.text2=this.value" rows="2" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37] placeholder-gray-600" placeholder="اكتب هنا...">${customOrderData.text2 || ''}</textarea>
                </div>
            `;
        }

        html += `
            <div>
                <label class="block text-xs font-bold text-gray-300 mb-1">${selectedProd.labelNotes || 'ملاحظات إضافية:'}</label>
                <input type="text" id="dynamic-notes-input" oninput="customOrderData.notes=this.value" value="${(customOrderData.notes || '').replace(/"/g, '&quot;')}" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]" placeholder="أضف أي ملاحظة...">
            </div>

            <!-- زر اختياري لإضافة منتج مخصص آخر في نفس الطلب -->
            <div class="pt-3 border-t border-gray-800">
                <button type="button" onclick="addAnotherCustomProduct()" class="w-full py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-dashed border-[#D4AF37]/60 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer">
                    <i class="fa-solid fa-plus-circle text-sm"></i> إضافة منتج مخصص آخر لنفس الطلب (بتوصيل واحد)
                </button>
            </div>
        `;

        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

// تفاعل الواجهة الديناميكية
export function selectCustomService(type, name) {
    customOrderData.serviceType = type;
    customOrderData.serviceName = name;
    customOrderData.selectedProductId = '';
    customOrderData.selectedProduct = '';
    customOrderData.basePrice = 0;
    customOrderData.addonsPrice = 0;
    currentCustomStep = 2;
    renderCustomStep();
}

export function handleProductSelection(productId) {
    const prod = (window.currentCategoryProducts || []).find(p => p.id === productId);
    if (!prod) return;

    const isDifferent = customOrderData.selectedProductId !== prod.id;
    customOrderData.selectedProductId = prod.id;
    customOrderData.selectedProduct = prod.name;
    customOrderData.productImage = prod.image || '';
    customOrderData.basePrice = Number(prod.basePrice) || 0;

    if (isDifferent) {
        customOrderData.addonsPrice = 0;
        customOrderData.facesCount = '1';
        customOrderData.color = '';
        customOrderData.size = '';
        customOrderData.font = '';
        customOrderData.position = '';
        customOrderData.designMode = (Array.isArray(prod.templates) && prod.templates.length > 0) ? 'template' : 'custom';
        customOrderData.selectedTemplate = null;
        customOrderData.text1 = '';
        customOrderData.text2 = '';
        customOrderData.notes = '';
    }

    renderCustomStep();
}

export function selectCustomSize(label, overridePrice) {
    const prod = getSelectedWorkshopProduct();
    customOrderData.size = label;
    if (overridePrice !== null && !isNaN(Number(overridePrice))) {
        customOrderData.basePrice = Number(overridePrice);
    } else if (prod) {
        customOrderData.basePrice = Number(prod.basePrice) || 0;
    }
    renderCustomStep();
}

export function selectCustomChip(field, value) {
    customOrderData[field] = value;
    renderCustomStep();
}

export function setCustomDesignMode(mode) {
    customOrderData.designMode = mode;
    if (mode === 'custom') customOrderData.selectedTemplate = null;
    renderCustomStep();
}

export function selectCustomTemplate(id, name, image) {
    customOrderData.designMode = 'template';
    customOrderData.selectedTemplate = { id, name, image };
    renderCustomStep();
}

export function handleFacesChange(faces) {
    const prod = getSelectedWorkshopProduct();
    const face2Price = prod ? (Number(prod.face2Price) || 0) : 0;
    customOrderData.facesCount = faces;
    if (faces === '2') {
        customOrderData.addonsPrice = face2Price;
    } else {
        customOrderData.addonsPrice = 0;
        customOrderData.text2 = '';
    }
    renderCustomStep();
}

export async function handleCustomImageUpload(event, imageIndex = 1) {
    const file = event.target.files[0];
    if (!file) return;
    
    const btnLabel = event.target.previousElementSibling;
    const originalText = btnLabel ? btnLabel.innerText : '';
    if (btnLabel) btnLabel.innerText = "جاري الرفع للورشة... ⏳";
    
    try {
        const downloadURL = await window.compressAndUploadImage(file, 'customer_uploads', 700);
        if (imageIndex === 1) customOrderData.uploadedImage1 = downloadURL;
        else if (imageIndex === 2) customOrderData.uploadedImage2 = downloadURL;
        else if (imageIndex === 3) customOrderData.uploadedImage3 = downloadURL;
        
        renderCustomStep();
    } catch(error) {
        if (btnLabel) btnLabel.innerText = originalText;
        showCustomAlert("خطأ", "تعذر رفع الصورة، تأكد من اتصالك بالإنترنت.", false);
    }
}

export function removeCustomUploadedImage(imageIndex) {
    if (imageIndex === 1) customOrderData.uploadedImage1 = '';
    else if (imageIndex === 2) customOrderData.uploadedImage2 = '';
    else if (imageIndex === 3) customOrderData.uploadedImage3 = '';
    
    renderCustomStep(); 
}

export function setCustomShipping(type) {
    customOrderData.shippingType = type;
    const btnOffice = document.getElementById('btn-custom-ship-office');
    const btnHome = document.getElementById('btn-custom-ship-home');
    const activeClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]";
    const inactiveClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-gray-700 bg-black text-gray-400";
    if (btnOffice) btnOffice.className = type === 'office' ? activeClass : inactiveClass;
    if (btnHome) btnHome.className = type === 'home' ? activeClass : inactiveClass;
    updateLivePriceDisplay(); 
}

function validateCurrentCustomItem() {
    const prod = getSelectedWorkshopProduct();
    if (!prod || !customOrderData.selectedProductId) {
        showCustomAlert('تنبيه ⚠️', 'يرجى اختيار المنتج المطلوب أولاً.', false);
        return false;
    }

    const sizesArr = (prod.sizes || '').split(/[,،]/).map(parseSizeOption).filter(o => o.label);
    if (sizesArr.length > 0 && !customOrderData.size) {
        showCustomAlert('تنبيه ⚠️', 'يرجى اختيار المقاس / الحجم المطلوب.', false);
        return false;
    }

    if ((prod.imgReq || 'optional') === 'required' && !customOrderData.uploadedImage1 && !customOrderData.uploadedImage2 && !customOrderData.uploadedImage3) {
        showCustomAlert('صورة مطلوبة 📸', 'عذراً، هذا المنتج يتطلب إرفاق صورة واحدة على الأقل للتصميم!', false);
        return false;
    }

    const text1El = document.getElementById('dynamic-text-1');
    if (text1El) customOrderData.text1 = text1El.value.trim();

    const text2El = document.getElementById('dynamic-text-2');
    if (text2El) customOrderData.text2 = text2El.value.trim();

    const notesEl = document.getElementById('dynamic-notes-input');
    if (notesEl) customOrderData.notes = notesEl.value.trim();

    return true;
}

export function addAnotherCustomProduct() {
    if (!validateCurrentCustomItem()) return;
    customOrderItems.push(extractCurrentItemSnapshot());
    Object.assign(customOrderData, getEmptyCustomItem());
    currentCustomStep = 1;
    renderCustomStep();
    document.getElementById('custom-wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
}

export function removeCustomOrderItem(index) {
    if (index < customOrderItems.length) {
        customOrderItems.splice(index, 1);
    } else if (customOrderData.selectedProductId) {
        Object.assign(customOrderData, getEmptyCustomItem());
    }
    if (getAllCustomItemsForCheckout().length === 0 && currentCustomStep >= 3) {
        currentCustomStep = 1;
    }
    renderCustomStep();
}

export function goToCustomShippingStep() {
    if (getAllCustomItemsForCheckout().length === 0) {
        showCustomAlert('تنبيه ⚠️', 'يرجى تجهيز منتج واحد على الأقل أولاً.', false);
        return;
    }
    currentCustomStep = 3;
    renderCustomStep();
}

// التنقل بين الخطوات والتحقق من المدخلات
export function nextCustomStep() {
    if (currentCustomStep === 2) {
        if (!customOrderData.selectedProductId && customOrderItems.length > 0) {
            currentCustomStep = 3;
            renderCustomStep();
            return;
        }
        if (!validateCurrentCustomItem()) return;
    }
    
    if (currentCustomStep === 3) {
        customOrderData.customerName = document.getElementById('c-name')?.value.trim() || customOrderData.customerName;
        customOrderData.customerPhone = document.getElementById('c-phone')?.value.trim() || customOrderData.customerPhone;
        customOrderData.wilaya = document.getElementById('c-wilaya')?.value || customOrderData.wilaya;
        customOrderData.baladiya = document.getElementById('c-baladiya')?.value.trim() || customOrderData.baladiya;
        customOrderData.commune = document.getElementById('c-commune')?.value.trim() || '';

        if (!customOrderData.customerName || !customOrderData.customerPhone || !customOrderData.wilaya || !customOrderData.baladiya) {
            showCustomAlert('معلومات ناقصة ⚠️', 'يرجى إكمال المعلومات الأساسية (الاسم، الهاتف، الولاية، والبلدية)!', false); 
            return;
        }

        if (!isValidDzPhone(customOrderData.customerPhone)) {
            showCustomAlert('رقم الهاتف غير صحيح 📞', 'يرجى إدخال رقم هاتف جزائري صحيح مكون من 10 أرقام (يبدأ بـ 05 أو 06 أو 07).', false);
            return;
        }
    }
    
    if (currentCustomStep === TOTAL_CUSTOM_STEPS) { 
        submitCustomOrder(); 
        return; 
    }
    currentCustomStep++;
    renderCustomStep();
}

export function prevCustomStep() {
    if (currentCustomStep === 3 && !customOrderData.selectedProductId) {
        currentCustomStep = 1;
        renderCustomStep();
        return;
    }
    if (currentCustomStep > 1) { 
        currentCustomStep--; 
        renderCustomStep(); 
    }
}

function formatSingleCustomItemDesc(item, indexLabel = '') {
    let uploadedCount = 0;
    if (item.uploadedImage1) uploadedCount++;
    if (item.uploadedImage2) uploadedCount++;
    if (item.uploadedImage3) uploadedCount++;

    return `[طلب مخصص ${indexLabel}🎨]
- القسم: ${item.serviceName}
- المنتج: ${item.selectedProduct} (${getCustomItemPrice(item).toLocaleString()} دج)
${item.size ? '- المقاس: ' + item.size + '\n' : ''}${item.color ? '- اللون: ' + item.color + '\n' : ''}${item.font ? '- الخط: ' + item.font + '\n' : ''}${item.position ? '- المكان: ' + item.position + '\n' : ''}${item.facesCount === '2' ? '- الأوجه: وجهان\n' : ''}${item.selectedTemplate ? '- التصميم الجاهز المختار: ' + item.selectedTemplate.name + '\n' : ''}- النص الأول: ${item.text1 || 'لا يوجد'}
${item.text2 ? '- النص الثاني: ' + item.text2 + '\n' : ''}- ملاحظات: ${item.notes || 'لا توجد'}${uploadedCount > 0 ? `\n- 📸 مرفق ${uploadedCount} صور(ة) للتصميم.` : ''}`;
}

export function getCustomOrderFullDesc() {
    const items = getAllCustomItemsForCheckout();
    if (items.length <= 1) {
        return formatSingleCustomItemDesc(items[0] || customOrderData);
    }
    return items.map((item, idx) => formatSingleCustomItemDesc(item, `#${idx + 1} `)).join('\n\n---\n\n');
}

export async function submitCustomOrder() {
    const items = getAllCustomItemsForCheckout();
    if (items.length === 0) return showCustomAlert('تنبيه', 'لا توجد منتجات في الطلب!', false);

    const paymentMethod = document.querySelector('input[name="custom_payment_method"]:checked')?.value || 'in_store';
    let receiptUrl = null;
    const btn = document.querySelector('button[onclick="submitCustomOrder()"]');
    const originalBtnHtml = btn ? btn.innerHTML : 'اطلب الآن (مباشرة)';

    if (paymentMethod === 'baridimob') {
        const fileInput = document.getElementById('custom-receipt-file');
        if (!fileInput || !fileInput.files[0]) {
            return showCustomAlert('تنبيه', 'يرجى إرفاق صورة وصل بريدي موب لتأكيد الطلب المباشر!', false);
        }
        if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع الوصل...'; btn.disabled = true; }
        try {
            receiptUrl = await window.compressAndUploadImage(fileInput.files[0], 'customer_uploads', 800);
        } catch (e) {
            if (btn) { btn.innerHTML = originalBtnHtml; btn.disabled = false; }
            return showCustomAlert('خطأ', 'تعذر رفع صورة الوصل، أعد المحاولة.', false);
        }
    }

    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...'; btn.disabled = true; }

    const shipCost = calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType);
    const itemsTotal = items.reduce((sum, item) => sum + getCustomItemPrice(item), 0);
    const grandTotal = itemsTotal + shipCost;

    const allUploadedImages = [];
    items.forEach(item => {
        if (item.uploadedImage1) allUploadedImages.push(item.uploadedImage1);
        if (item.uploadedImage2) allUploadedImages.push(item.uploadedImage2);
        if (item.uploadedImage3) allUploadedImages.push(item.uploadedImage3);
    });
    
    const newOrder = {
        customer: customOrderData.customerName,
        phone: customOrderData.customerPhone.replace(/\s+/g, ''),
        wilaya: state.WILAYAS.find(w => w.code === customOrderData.wilaya)?.name || customOrderData.wilaya,
        commune: `البلدية: ${customOrderData.baladiya}${customOrderData.commune ? ' | العنوان: ' + customOrderData.commune : ''} (${customOrderData.shippingType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'})`,
        product: getCustomOrderFullDesc(),
        total: grandTotal,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date(),
        attachedImage1: allUploadedImages[0] || null,
        attachedImage2: allUploadedImages[1] || null,
        attachedImage3: allUploadedImages[2] || null,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'in_store' ? 'pending' : 'paid_pending_check',
        baridimobReceipt: receiptUrl
    };
    
    fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...newOrder,
            purchasedItems: items.map((item, idx) => ({
                id: item.selectedProductId || `custom_direct_${idx}`,
                name: `[مخصص] ${item.selectedProduct}`,
                price: getCustomItemPrice(item),
                qty: 1
            }))
        })
    })
    .then(response => response.json())
    .then(data => {
        if (btn) { btn.innerHTML = originalBtnHtml; btn.disabled = false; }
        if (data.error) throw new Error(data.error);
        closeCustomBuilder();
        showCustomAlert('تم استلام طلبك المخصص! 🎉', 'سنقوم بمراجعة التفاصيل ونتصل بك قريباً لتأكيده.', true);
    })
    .catch(err => {
        if (btn) { btn.innerHTML = originalBtnHtml; btn.disabled = false; }
        showCustomAlert('خطأ', 'تعذر إرسال الطلب: ' + err.message, false);
    });
}

// 🌟 حفظ كافة المنتجات المخصصة مع مرفقاتها في السلة وتعبئة بيانات الزبون تلقائياً
export function addCustomToCart() {
    const items = getAllCustomItemsForCheckout();
    if (items.length === 0) return showCustomAlert('تنبيه', 'لا توجد منتجات لإضافتها للسلة!', false);

    items.forEach((item, idx) => {
        state.cart.push({
            id: 'custom_' + Date.now() + '_' + idx,
            name: `[مخصص] ${item.selectedProduct}${item.size ? ' - ' + item.size : ''}`,
            price: getCustomItemPrice(item),
            qty: 1,
            image: item.selectedTemplate?.image || item.productImage || 'https://via.placeholder.com/100',
            customDetails: formatSingleCustomItemDesc(item),
            attachedImage1: item.uploadedImage1 || null,
            attachedImage2: item.uploadedImage2 || null,
            attachedImage3: item.uploadedImage3 || null
        });
    });
    
    saveCartToLocal();
    safeCall('updateBadges');
    
    closeCustomBuilder();
    safeCall('showPage', 'cart');

    setTimeout(() => {
        if (customOrderData.customerName && document.getElementById('cart-cust-name')) {
            document.getElementById('cart-cust-name').value = customOrderData.customerName;
        }
        if (customOrderData.customerPhone && document.getElementById('cart-cust-phone')) {
            document.getElementById('cart-cust-phone').value = customOrderData.customerPhone;
        }
        if (customOrderData.wilaya && document.getElementById('cart-cust-wilaya')) {
            document.getElementById('cart-cust-wilaya').value = customOrderData.wilaya;
        }
        if (customOrderData.baladiya && document.getElementById('cart-cust-baladiya')) {
            document.getElementById('cart-cust-baladiya').value = customOrderData.baladiya;
        }
        if (customOrderData.commune && document.getElementById('cart-cust-address')) {
            document.getElementById('cart-cust-address').value = customOrderData.commune;
        }
        const shipRadio = document.querySelector(`input[name="cart_shipping_type"][value="${customOrderData.shippingType}"]`);
        if (shipRadio) shipRadio.checked = true;
        safeCall('updateCartCalculations');
    }, 100);

    showCustomAlert('تمت الإضافة للسلة 🛒', `تمت إضافة ${items.length > 1 ? items.length + ' منتجات مخصصة' : 'تصميمك المخصص'} مع المرفقات للسلة بنجاح!`, true);
}

// ==========================================
// Window Bindings (ربط شامل مع الواجهة)
// ==========================================
window.openCustomBuilder = openCustomBuilder;
window.closeCustomBuilder = closeCustomBuilder;
window.updateLivePriceDisplay = updateLivePriceDisplay;
window.renderCustomStep = renderCustomStep;
window.selectCustomService = selectCustomService;
window.handleProductSelection = handleProductSelection;
window.selectCustomSize = selectCustomSize;
window.selectCustomChip = selectCustomChip;
window.setCustomDesignMode = setCustomDesignMode;
window.selectCustomTemplate = selectCustomTemplate;
window.handleFacesChange = handleFacesChange;
window.handleCustomImageUpload = handleCustomImageUpload;
window.removeCustomUploadedImage = removeCustomUploadedImage;
window.setCustomShipping = setCustomShipping;
window.addAnotherCustomProduct = addAnotherCustomProduct;
window.removeCustomOrderItem = removeCustomOrderItem;
window.goToCustomShippingStep = goToCustomShippingStep;
window.previewCustomImage = previewCustomImage;
window.nextCustomStep = nextCustomStep;
window.prevCustomStep = prevCustomStep;
window.submitCustomOrder = submitCustomOrder;
window.addCustomToCart = addCustomToCart;
