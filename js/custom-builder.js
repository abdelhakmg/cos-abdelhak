// --- ملف js/custom-builder.js ---

import { state, saveCartToLocal } from './store/state.js';
import { showCustomAlert, calculateShippingCost, isValidDzPhone, safeCall } from './utils/helpers.js';

let currentCustomStep = 1;
const TOTAL_CUSTOM_STEPS = 4;

let customOrderData = {
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
    text1: '', 
    text2: '',
    uploadedImage1: '', 
    uploadedImage2: '', 
    uploadedImage3: '', 
    notes: '',
    customerName: '',
    customerPhone: '',
    wilaya: '',
    baladiya: '',
    commune: '',
    shippingType: 'home'
};
window.customOrderData = customOrderData;

export function openCustomBuilder() {
    const config = (state.storeSettings && state.storeSettings.custom_workshop) || {};
    
    if (config.isActive === false) {
        showCustomAlert("الورشة مغلقة مؤقتاً 🛠️", "نحن نقوم بصيانة وتحديث آلاتنا حالياً، يرجى العودة لاحقاً لطلب تصميمك الخاص!", false);
        return;
    }

    // تصفير البيانات عند فتح نافذة جديدة
    currentCustomStep = 1;
    customOrderData = {
        serviceType: '', serviceName: '', selectedProductId: '', selectedProduct: '', productImage: '', 
        color: '', size: '', font: '', position: '', facesCount: '1',
        basePrice: 0, addonsPrice: 0, text1: '', text2: '', 
        uploadedImage1: '', uploadedImage2: '', uploadedImage3: '', notes: '',
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

    let total = (Number(customOrderData.basePrice) || 0) + (Number(customOrderData.addonsPrice) || 0);

    if (currentCustomStep === 3 && customOrderData.wilaya) {
        const shipCost = calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType);
        total += shipCost;
    }

    if (currentCustomStep > 1 && currentCustomStep < 4 && total > 0) {
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
                <div class="space-y-6 animate-fade-in text-center">
                    <h2 class="text-2xl font-black text-white mb-2">ماذا تريد أن نصمم لك اليوم؟ 🎨</h2>
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
                                    <div id="btn-ship-office" onclick="setCustomShipping('office')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${customOrderData.shippingType === 'office' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-store"></i> استلام من المكتب
                                    </div>
                                    <div id="btn-ship-home" onclick="setCustomShipping('home')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${customOrderData.shippingType === 'home' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-house"></i> توصيل للمنزل
                                    </div>
                                </div>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="text-xs text-[#D4AF37] font-bold block mb-1">البلدية *</label>
                                <input type="text" id="c-baladiya" value="${customOrderData.baladiya || ''}" oninput="customOrderData.baladiya=this.value" placeholder="أدخل اسم البلدية" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                            </div>
                            <div class="md:col-span-2">
                                <label class="text-xs text-[#D4AF37] font-bold block mb-1">العنوان التفصيلي / الحي *</label>
                                <input type="text" id="c-commune" value="${customOrderData.commune || ''}" oninput="customOrderData.commune=this.value" placeholder="الحي، الشارع، أو نقطة استدلال..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 4:
            const shipCost = customOrderData.wilaya ? calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType) : 0;
            const designPrice = (Number(customOrderData.basePrice) || 0) + (Number(customOrderData.addonsPrice) || 0);
            const finalTotal = designPrice + shipCost;

            html = `
                <div class="space-y-5 animate-fade-in text-right">
                    <div class="text-center mb-4">
                        <i class="fa-solid fa-file-invoice text-4xl text-[#D4AF37] mb-2"></i>
                        <h4 class="font-black text-lg text-white">مراجعة طلبك المخصص</h4>
                    </div>

                    <div class="bg-black p-5 rounded-2xl border border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] space-y-4">
                        <div class="space-y-2 text-sm text-gray-300 border-b border-gray-800 pb-4">
                            <div class="flex justify-between items-center">
                                <span>نوع الخدمة المخصصة:</span>
                                <span class="font-bold text-white">${customOrderData.serviceName}</span>
                            </div>
                            <div class="flex justify-between items-center text-[#D4AF37]">
                                <span>المنتج:</span>
                                <span class="font-bold text-white">${customOrderData.selectedProduct || 'غير محدد'}</span>
                            </div>
                            ${customOrderData.color ? `<div class="flex justify-between items-center text-xs mt-1"><span>اللون:</span> <span class="font-bold text-white">${customOrderData.color}</span></div>` : ''}
                            ${customOrderData.size ? `<div class="flex justify-between items-center text-xs mt-1"><span>المقاس:</span> <span class="font-bold text-white">${customOrderData.size}</span></div>` : ''}
                            ${customOrderData.font ? `<div class="flex justify-between items-center text-xs mt-1"><span>نوع الخط:</span> <span class="font-bold text-white">${customOrderData.font}</span></div>` : ''}
                            ${customOrderData.position ? `<div class="flex justify-between items-center text-xs mt-1"><span>المكان:</span> <span class="font-bold text-white">${customOrderData.position}</span></div>` : ''}

                            ${customOrderData.text1 ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-2 border border-gray-800"><span class="text-gray-500">النص 1:</span> <span class="text-white">${customOrderData.text1}</span></div>` : ''}
                            ${customOrderData.text2 ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-1 border border-gray-800"><span class="text-gray-500">النص 2:</span> <span class="text-white">${customOrderData.text2}</span></div>` : ''}
                            ${customOrderData.notes ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-1 border border-gray-800"><span class="text-gray-500">ملاحظات:</span> <span class="text-white">${customOrderData.notes}</span></div>` : ''}
                            
                            <div class="flex justify-between items-center mt-3">
                                <span>سعر التصميم والمنتج:</span>
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

// بناء الخيارات الديناميكية في الخطوة 2
function buildDynamicServiceOptions(config) {
    const categoryProducts = (config.products || []).filter(p => p.category === customOrderData.serviceType && p.inStock !== false);
    window.currentCategoryProducts = categoryProducts;

    if (categoryProducts.length === 0) {
        return `<div class="text-center p-10 text-gray-400 font-bold border border-dashed border-gray-700 rounded-2xl bg-gray-900">عذراً، لا توجد منتجات متوفرة في هذا القسم حالياً 😔. يرجى مراجعتنا لاحقاً.</div>`;
    }

    let html = `<div class="space-y-6 animate-fade-in text-right max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">`;
    html += `<h4 class="font-black text-lg text-white text-center mb-4">تفاصيل ${customOrderData.serviceName}</h4>`;

    // حاوية الصورة
    html += `
        <div id="dynamic-image-preview" class="hidden mb-4 flex justify-center">
            <img id="dynamic-img" src="" class="w-32 h-32 object-contain bg-white rounded-xl p-1 border border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
        </div>
    `;

    // اختيار المنتج
    html += `
        <div>
            <label class="block text-xs font-bold text-[#D4AF37] mb-1">اختر المنتج أو الخدمة:</label>
            <select id="dynamic-product" onchange="handleProductSelection(this.value)" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                <option value="">-- اضغط للاختيار --</option>
                ${categoryProducts.map(p => `<option value="${p.id}">${p.name} -${p.basePrice} دج</option>`).join('')}
            </select>
        </div>
    `;

    // الحاوية المخفية لباقي المدخلات
    html += `<div id="dynamic-fields-container" class="hidden space-y-4 mt-4">`;

    // 1. الألوان
    html += `
        <div id="dynamic-color-container" class="hidden">
            <label class="block text-xs font-bold text-gray-400 mb-1">اللون المطلوب:</label>
            <select id="dynamic-color" onchange="customOrderData.color=this.value" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></select>
        </div>
    `;

    // 2. المقاسات
    html += `
        <div id="dynamic-size-container" class="hidden">
            <label class="block text-xs font-bold text-gray-400 mb-1">المقاس:</label>
            <select id="dynamic-size" onchange="customOrderData.size=this.value" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></select>
        </div>
    `;

    // 3. أماكن الطباعة/التصميم
    html += `
        <div id="dynamic-position-container" class="hidden">
            <label class="block text-xs font-bold text-gray-400 mb-1">مكان التصميم:</label>
            <select id="dynamic-position" onchange="customOrderData.position=this.value" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></select>
        </div>
    `;

    // 4. أنواع الخطوط
    html += `
        <div id="dynamic-font-container" class="hidden">
            <label class="block text-xs font-bold text-gray-400 mb-1">نوع الخط:</label>
            <select id="dynamic-font" onchange="customOrderData.font=this.value" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></select>
        </div>
    `;

    // الأوجه / الخيارات الإضافية
    html += `
        <div id="dynamic-faces-container" class="hidden">
            <label class="block text-xs font-bold text-[#D4AF37] mb-1">كم وجه تريد؟</label>
            <select id="dynamic-faces" onchange="handleFacesChange(this.value)" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                <option value="1" ${customOrderData.facesCount === '1' ? 'selected' : ''}>وجه واحد أساسي (السعر المذكور أعلاه)</option>
                <option id="face2-option" value="2" ${customOrderData.facesCount === '2' ? 'selected' : ''}>إضافة وجه ثاني</option>
            </select>
        </div>
    `;

    // 5. رفع صور
    html += `
        <div id="dynamic-images-container" class="hidden space-y-3">
            <label class="block text-xs font-bold text-[#D4AF37] mb-2">أرفق صور للتصميم 📸 <span id="img-req-label"></span>:</label>
            
            <div class="bg-black/30 p-3 rounded-xl border border-gray-800">
                <label class="block text-[10px] text-gray-500 mb-1">الصورة الأولى</label>
                <input type="file" accept="image/*" onchange="handleCustomImageUpload(event, 1)" class="w-full border border-gray-700 p-2 rounded-xl text-sm bg-gray-900 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-black cursor-pointer hover:file:bg-[#D4AF37]/90">
                ${customOrderData.uploadedImage1 ? `
                <div class="flex items-center justify-between bg-green-900/20 border border-green-800 p-2 rounded-xl mt-2 transition animate-fade-in">
                    <p class="text-green-500 text-xs font-bold"><i class="fa-solid fa-check mr-1"></i> تم إرفاق الصورة 1</p>
                    <button type="button" onclick="removeCustomUploadedImage(1)" class="text-red-400 hover:text-red-200 text-xs font-bold bg-red-900/30 px-3 py-1.5 rounded-lg transition border border-red-900/50"><i class="fa-solid fa-trash"></i> حذف</button>
                </div>` : ''}
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-gray-800">
                <label class="block text-[10px] text-gray-500 mb-1">الصورة الثانية (إضافية)</label>
                <input type="file" accept="image/*" onchange="handleCustomImageUpload(event, 2)" class="w-full border border-gray-700 p-2 rounded-xl text-sm bg-gray-900 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-700 file:text-white cursor-pointer hover:file:bg-gray-600">
                ${customOrderData.uploadedImage2 ? `
                <div class="flex items-center justify-between bg-green-900/20 border border-green-800 p-2 rounded-xl mt-2 transition animate-fade-in">
                    <p class="text-green-500 text-xs font-bold"><i class="fa-solid fa-check mr-1"></i> تم إرفاق الصورة 2</p>
                    <button type="button" onclick="removeCustomUploadedImage(2)" class="text-red-400 hover:text-red-200 text-xs font-bold bg-red-900/30 px-3 py-1.5 rounded-lg transition border border-red-900/50"><i class="fa-solid fa-trash"></i> حذف</button>
                </div>` : ''}
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-gray-800">
                <label class="block text-[10px] text-gray-500 mb-1">الصورة الثالثة (إضافية)</label>
                <input type="file" accept="image/*" onchange="handleCustomImageUpload(event, 3)" class="w-full border border-gray-700 p-2 rounded-xl text-sm bg-gray-900 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-700 file:text-white cursor-pointer hover:file:bg-gray-600">
                ${customOrderData.uploadedImage3 ? `
                <div class="flex items-center justify-between bg-green-900/20 border border-green-800 p-2 rounded-xl mt-2 transition animate-fade-in">
                    <p class="text-green-500 text-xs font-bold"><i class="fa-solid fa-check mr-1"></i> تم إرفاق الصورة 3</p>
                    <button type="button" onclick="removeCustomUploadedImage(3)" class="text-red-400 hover:text-red-200 text-xs font-bold bg-red-900/30 px-3 py-1.5 rounded-lg transition border border-red-900/50"><i class="fa-solid fa-trash"></i> حذف</button>
                </div>` : ''}
            </div>
        </div>
    `;

    // الحقول النصية
    html += `
        <div id="dynamic-text-1-container" class="hidden">
            <label id="dynamic-label-1" class="block text-xs font-bold text-gray-400 mb-1">النص المطلوب:</label>
            <textarea oninput="customOrderData.text1=this.value" rows="2" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37] placeholder-gray-600" placeholder="اكتب هنا...">${customOrderData.text1}</textarea>
        </div>
        
        <div id="dynamic-text-2-container" class="hidden">
            <label id="dynamic-label-2" class="block text-xs font-bold text-gray-400 mb-1">النص الإضافي:</label>
            <textarea oninput="customOrderData.text2=this.value" rows="2" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37] placeholder-gray-600" placeholder="اكتب هنا...">${customOrderData.text2}</textarea>
        </div>

        <div>
            <label id="dynamic-label-notes" class="block text-xs font-bold text-gray-400 mb-1">ملاحظات إضافية:</label>
            <input type="text" id="dynamic-notes-input" oninput="customOrderData.notes=this.value" value="${customOrderData.notes}" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]" placeholder="أضف أي ملاحظة...">
        </div>
    `;

    html += `</div></div>`;

    setTimeout(() => {
        if (customOrderData.selectedProductId && document.getElementById('dynamic-product')) {
            document.getElementById('dynamic-product').value = customOrderData.selectedProductId;
            handleProductSelection(customOrderData.selectedProductId, true);
        }
    }, 50);

    return html;
}

// تفاعل الواجهة الديناميكية
export function selectCustomService(type, name) {
    customOrderData.serviceType = type;
    customOrderData.serviceName = name;
    nextCustomStep();
}

export function handleProductSelection(productId, isRestore = false) {
    const container = document.getElementById('dynamic-fields-container');
    if (!container) return;
    
    if (!productId) {
        container.classList.add('hidden');
        customOrderData.selectedProduct = '';
        customOrderData.selectedProductId = '';
        customOrderData.productImage = '';
        customOrderData.basePrice = 0;
        customOrderData.addonsPrice = 0;
        updateLivePriceDisplay();
        return;
    }

    const prod = (window.currentCategoryProducts || []).find(p => p.id === productId);
    if (!prod) return;

    container.classList.remove('hidden');
    customOrderData.selectedProductId = prod.id;
    customOrderData.selectedProduct = prod.name;
    customOrderData.productImage = prod.image || ''; // 🌟 حفظ صورة المنتج لاستخدامها في السلة لاحقاً
    customOrderData.basePrice = Number(prod.basePrice) || 0;
    
    if (!isRestore) {
        customOrderData.addonsPrice = 0;
        customOrderData.facesCount = '1';
        customOrderData.color = '';
        customOrderData.size = '';
        customOrderData.font = '';
        customOrderData.position = '';
        customOrderData.text1 = '';
        customOrderData.text2 = '';
    }

    // عرض الصورة
    const previewDiv = document.getElementById('dynamic-image-preview');
    const imgEl = document.getElementById('dynamic-img');
    if (prod.image && imgEl && previewDiv) {
        imgEl.src = prod.image;
        previewDiv.classList.remove('hidden');
    } else if (previewDiv) {
        previewDiv.classList.add('hidden');
    }

    // دالة مساعدة لملء القوائم المنسدلة (تدعم الفاصلة العربية والإنجليزية)
    function setupDropdown(prodProp, containerId, selectId, defaultText, dataProp) {
        const div = document.getElementById(containerId);
        const select = document.getElementById(selectId);
        if (!div || !select) return;
        if (prod[prodProp] && prod[prodProp].trim() !== '') {
            const arr = prod[prodProp].split(/[,،]/).map(i => i.trim()).filter(Boolean);
            select.innerHTML = `<option value="">-- ${defaultText} --</option>` + arr.map(i => `<option value="${i}" ${customOrderData[dataProp] === i ? 'selected' : ''}>${i}</option>`).join('');
            div.classList.remove('hidden');
        } else {
            div.classList.add('hidden');
        }
    }

    setupDropdown('colors', 'dynamic-color-container', 'dynamic-color', 'اختر اللون', 'color');
    setupDropdown('sizes', 'dynamic-size-container', 'dynamic-size', 'اختر المقاس', 'size');
    setupDropdown('fonts', 'dynamic-font-container', 'dynamic-font', 'اختر الخط', 'font');
    setupDropdown('positions', 'dynamic-position-container', 'dynamic-position', 'اختر المكان', 'position');

    // التحكم في إلزامية الصور
    const imgContainer = document.getElementById('dynamic-images-container');
    const imgLabel = document.getElementById('img-req-label');
    window.currentImgReq = prod.imgReq || 'optional';
    
    if (window.currentImgReq === 'none') {
        if (imgContainer) imgContainer.classList.add('hidden');
    } else if (imgContainer) {
        imgContainer.classList.remove('hidden');
        if (imgLabel) {
            if (window.currentImgReq === 'required') {
                imgLabel.innerText = '(إجبارية - صورة واحدة على الأقل)';
                imgLabel.className = 'text-red-400 font-black text-[10px] ml-1';
            } else {
                imgLabel.innerText = '(اختياري)';
                imgLabel.className = 'text-gray-500 font-bold text-[10px] ml-1';
            }
        }
    }

    // الأوجه الإضافية
    const facesDiv = document.getElementById('dynamic-faces-container');
    const face2Option = document.getElementById('face2-option');
    if (prod.face2Price > 0 && facesDiv && face2Option) {
        face2Option.innerText = `إضافة وجه ثاني (+${prod.face2Price} دج)`;
        facesDiv.classList.remove('hidden');
        window.currentFace2Price = Number(prod.face2Price) || 0;
    } else if (facesDiv) {
        facesDiv.classList.add('hidden');
        window.currentFace2Price = 0;
    }

    // العناوين والحد الأقصى للحروف
    const text1Div = document.getElementById('dynamic-text-1-container');
    const text2Div = document.getElementById('dynamic-text-2-container');
    const txt1 = document.querySelector('#dynamic-text-1-container textarea');
    const txt2 = document.querySelector('#dynamic-text-2-container textarea');
    
    const maxChars = prod.maxChars ? parseInt(prod.maxChars) : null;
    let maxCharText = maxChars ? ` (أقصى حد ${maxChars} حرف)` : '';
    
    const lbl1 = document.getElementById('dynamic-label-1');
    const lbl2 = document.getElementById('dynamic-label-2');
    const lblNotes = document.getElementById('dynamic-label-notes');
    if (lbl1) lbl1.innerText = (prod.label1 || 'النص المطلوب:') + maxCharText;
    if (lbl2) lbl2.innerText = (prod.label2 || 'النص الإضافي:') + maxCharText;
    if (lblNotes) lblNotes.innerText = prod.labelNotes || 'ملاحظات إضافية:';

    if (maxChars && maxChars > 0) {
        if (txt1) txt1.setAttribute('maxlength', maxChars);
        if (txt2) txt2.setAttribute('maxlength', maxChars);
    } else {
        if (txt1) txt1.removeAttribute('maxlength');
        if (txt2) txt2.removeAttribute('maxlength');
    }

    if (text1Div) text1Div.classList.remove('hidden');
    
    const facesSelect = document.getElementById('dynamic-faces');
    if (text2Div) {
        if (facesSelect && facesSelect.value === "2") {
            text2Div.classList.remove('hidden');
            customOrderData.addonsPrice = window.currentFace2Price || 0;
        } else if (customOrderData.serviceType === 'cameo' || customOrderData.serviceType === 'frame') {
            if (prod.label2) text2Div.classList.remove('hidden');
            else text2Div.classList.add('hidden');
        } else {
            text2Div.classList.add('hidden');
        }
    }

    updateLivePriceDisplay();
}

export function handleFacesChange(faces) {
    customOrderData.facesCount = faces;
    const text2Div = document.getElementById('dynamic-text-2-container');
    if (faces === "2") {
        if (text2Div) text2Div.classList.remove('hidden');
        customOrderData.addonsPrice = window.currentFace2Price || 0;
    } else {
        if (text2Div) text2Div.classList.add('hidden');
        customOrderData.addonsPrice = 0;
        customOrderData.text2 = '';
    }
    updateLivePriceDisplay();
}

// ضغط صور الزبون المرفقة
function compressCustomerImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 650; 
            const MAX_HEIGHT = 650; 
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            } else if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
            }

            canvas.width = Math.round(width);
            canvas.height = Math.round(height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            let compressed = canvas.toDataURL('image/webp', 0.65);
            if (!compressed.startsWith('data:image/webp')) {
                compressed = canvas.toDataURL('image/jpeg', 0.65);
            }
            callback(compressed);
        };
    };
}

export function handleCustomImageUpload(event, imageIndex = 1) {
    const file = event.target.files[0];
    if (!file) return;
    
    compressCustomerImage(file, function(compressedBase64) {
        if (imageIndex === 1) customOrderData.uploadedImage1 = compressedBase64;
        else if (imageIndex === 2) customOrderData.uploadedImage2 = compressedBase64;
        else if (imageIndex === 3) customOrderData.uploadedImage3 = compressedBase64;
        
        renderCustomStep(); 
    });
}

export function removeCustomUploadedImage(imageIndex) {
    if (imageIndex === 1) customOrderData.uploadedImage1 = '';
    else if (imageIndex === 2) customOrderData.uploadedImage2 = '';
    else if (imageIndex === 3) customOrderData.uploadedImage3 = '';
    
    renderCustomStep(); 
}

export function setCustomShipping(type) {
    customOrderData.shippingType = type;
    const btnOffice = document.getElementById('btn-ship-office');
    const btnHome = document.getElementById('btn-ship-home');
    const activeClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]";
    const inactiveClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-gray-700 bg-black text-gray-400";
    if (btnOffice) btnOffice.className = type === 'office' ? activeClass : inactiveClass;
    if (btnHome) btnHome.className = type === 'home' ? activeClass : inactiveClass;
    updateLivePriceDisplay(); 
}

// التنقل بين الخطوات والتحقق من المدخلات
export function nextCustomStep() {
    if (currentCustomStep === 2) {
        if (!customOrderData.selectedProductId) {
            showCustomAlert('تنبيه ⚠️', 'يرجى تحديد المنتج أو الخدمة المطلوبة أولاً للتقدم.', false); 
            return;
        }
        if (window.currentImgReq === 'required' && !customOrderData.uploadedImage1 && !customOrderData.uploadedImage2 && !customOrderData.uploadedImage3) {
            showCustomAlert('صورة مطلوبة 📸', 'عذراً، هذا المنتج يتطلب إرفاق صورة واحدة على الأقل للتصميم!', false); 
            return;
        }

        const colorEl = document.getElementById('dynamic-color');
        if (colorEl && !document.getElementById('dynamic-color-container')?.classList.contains('hidden')) customOrderData.color = colorEl.value;

        const sizeEl = document.getElementById('dynamic-size');
        if (sizeEl && !document.getElementById('dynamic-size-container')?.classList.contains('hidden')) customOrderData.size = sizeEl.value;

        const positionEl = document.getElementById('dynamic-position');
        if (positionEl && !document.getElementById('dynamic-position-container')?.classList.contains('hidden')) customOrderData.position = positionEl.value;

        const fontEl = document.getElementById('dynamic-font');
        if (fontEl && !document.getElementById('dynamic-font-container')?.classList.contains('hidden')) customOrderData.font = fontEl.value;

        const text1El = document.querySelector('#dynamic-text-1-container textarea');
        if (text1El && !document.getElementById('dynamic-text-1-container')?.classList.contains('hidden')) customOrderData.text1 = text1El.value.trim();

        const text2El = document.querySelector('#dynamic-text-2-container textarea');
        if (text2El && !document.getElementById('dynamic-text-2-container')?.classList.contains('hidden')) customOrderData.text2 = text2El.value.trim();

        const notesEl = document.getElementById('dynamic-notes-input');
        if (notesEl) customOrderData.notes = notesEl.value.trim();
    }
    
    if (currentCustomStep === 3) {
        customOrderData.customerName = document.getElementById('c-name')?.value.trim() || customOrderData.customerName;
        customOrderData.customerPhone = document.getElementById('c-phone')?.value.trim() || customOrderData.customerPhone;
        customOrderData.wilaya = document.getElementById('c-wilaya')?.value || customOrderData.wilaya;
        customOrderData.baladiya = document.getElementById('c-baladiya')?.value.trim() || customOrderData.baladiya;
        customOrderData.commune = document.getElementById('c-commune')?.value.trim() || customOrderData.commune;

        if (!customOrderData.customerName || !customOrderData.customerPhone || !customOrderData.wilaya || !customOrderData.baladiya || !customOrderData.commune) {
            showCustomAlert('معلومات ناقصة ⚠️', 'يرجى إكمال جميع معلومات الإرسال والبلدية والعنوان لحساب التوصيل بنجاح!', false); 
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
    if (currentCustomStep > 1) { 
        currentCustomStep--; 
        renderCustomStep(); 
    }
}

export function getCustomOrderFullDesc() {
    let uploadedCount = 0;
    if (customOrderData.uploadedImage1) uploadedCount++;
    if (customOrderData.uploadedImage2) uploadedCount++;
    if (customOrderData.uploadedImage3) uploadedCount++;

    return `[طلب مخصص 🎨]
- القسم: ${customOrderData.serviceName}
- المنتج: ${customOrderData.selectedProduct}
${customOrderData.color ? '- اللون: ' + customOrderData.color + '\n' : ''}${customOrderData.size ? '- المقاس: ' + customOrderData.size + '\n' : ''}${customOrderData.font ? '- الخط: ' + customOrderData.font + '\n' : ''}${customOrderData.position ? '- المكان: ' + customOrderData.position + '\n' : ''}- النص الأول: ${customOrderData.text1 || 'لا يوجد'}
- النص الثاني: ${customOrderData.text2 || 'لا يوجد'}
- ملاحظات: ${customOrderData.notes || 'لا توجد'}
${uploadedCount > 0 ? `- 📸 الزبون أرفق ${uploadedCount} صور(ة) للتصميم.` : ''}`;
}

export function submitCustomOrder() {
    const shipCost = calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType);
    const grandTotal = (Number(customOrderData.basePrice) || 0) + (Number(customOrderData.addonsPrice) || 0) + shipCost;
    
    const newOrder = {
        customer: customOrderData.customerName,
        phone: customOrderData.customerPhone.replace(/\s+/g, ''),
        wilaya: state.WILAYAS.find(w => w.code === customOrderData.wilaya)?.name || customOrderData.wilaya,
        commune: `البلدية: ${customOrderData.baladiya} | العنوان: ${customOrderData.commune} (${customOrderData.shippingType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'})`,
        product: getCustomOrderFullDesc(),
        total: grandTotal,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date(),
        attachedImage1: customOrderData.uploadedImage1 || null,
        attachedImage2: customOrderData.uploadedImage2 || null,
        attachedImage3: customOrderData.uploadedImage3 || null
    };
    
    if (typeof window.db !== 'undefined') {
        window.db.collection("orders").add(newOrder).then(() => {
            closeCustomBuilder();
            showCustomAlert('تم استلام طلبك المخصص! 🎉', 'سنقوم بمراجعة التفاصيل والصور ونتصل بك قريباً.', true);
        }).catch(err => showCustomAlert('خطأ', 'تعذر إرسال الطلب: ' + err.message, false));
    }
}

// 🌟 تصحيح حرج: حفظ الصور المرفقة وصورة المنتج وتعبئة بيانات السلة تلقائياً
export function addCustomToCart() {
    const cartItem = {
        id: 'custom_' + Date.now(),
        name: `[مخصص] ${customOrderData.selectedProduct}`,
        price: (Number(customOrderData.basePrice) || 0) + (Number(customOrderData.addonsPrice) || 0),
        image: customOrderData.productImage || 'https://via.placeholder.com/100',
        customDetails: getCustomOrderFullDesc(),
        attachedImage1: customOrderData.uploadedImage1 || null,
        attachedImage2: customOrderData.uploadedImage2 || null,
        attachedImage3: customOrderData.uploadedImage3 || null
    };
    
    state.cart.push(cartItem);
    saveCartToLocal();
    safeCall('updateBadges');
    
    closeCustomBuilder();
    safeCall('showPage', 'cart');

    // تعبئة بيانات الزبون التي أدخلها في الخطوة 3 داخل حقول السلة حتى لا يعيد كتابتها
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

    showCustomAlert('تمت الإضافة للسلة 🛒', 'تمت إضافة تصميمك المخصص مع مرفقاته للسلة بنجاح!', true);
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
window.handleFacesChange = handleFacesChange;
window.handleCustomImageUpload = handleCustomImageUpload;
window.removeCustomUploadedImage = removeCustomUploadedImage;
window.setCustomShipping = setCustomShipping;
window.nextCustomStep = nextCustomStep;
window.prevCustomStep = prevCustomStep;
window.submitCustomOrder = submitCustomOrder; // 🌟 كانت منسية وتمت إضافتها
window.addCustomToCart = addCustomToCart;
