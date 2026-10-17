// --- ملف js/custom-builder.js ---

import { state } from './store/state.js';
import { showCustomAlert, calculateShippingCost } from './utils/helpers.js';

let currentCustomStep = 1;
const TOTAL_CUSTOM_STEPS = 4;

let customOrderData = {
    serviceType: '', 
    serviceName: '',
    selectedProductId: '', // تم إضافة الـ ID للربط الذكي
    selectedProduct: '', 
    productImage: '', 
    color: '',        
    basePrice: 0,
    addonsPrice: 0,
    text1: '', 
    text2: '',
    uploadedImageBase64: '',
    notes: '',
    customerName: '',
    customerPhone: '',
    wilaya: '',
    commune: '',
    shippingType: 'home'
};

export function openCustomBuilder() {
    const config = (state.storeSettings && state.storeSettings.custom_workshop) || {};
    
    if (config.isActive === false) {
        showCustomAlert("الورشة مغلقة مؤقتاً 🛠️", "نحن نقوم بصيانة وتحديث آلاتنا حالياً، يرجى العودة لاحقاً لطلب تصميمك الخاص!", false);
        return;
    }

    // تصفير البيانات عند فتح نافذة جديدة
    currentCustomStep = 1;
    customOrderData = {
        serviceType: '', serviceName: '', selectedProductId: '', selectedProduct: '', productImage: '', color: '',
        basePrice: 0, addonsPrice: 0, text1: '', text2: '', uploadedImageBase64: '', notes: '',
        customerName: '', customerPhone: '', wilaya: '', commune: '', shippingType: 'home'
    };

    renderCustomStep();
    const modal = document.getElementById('custom-builder-modal');
    if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

export function closeCustomBuilder() {
    const modal = document.getElementById('custom-builder-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

// 2. تحديث السعر الحي
window.updateLivePriceDisplay = function() {
    const priceBadge = document.getElementById('custom-live-price');
    if (!priceBadge) return;

    let total = customOrderData.basePrice + customOrderData.addonsPrice;

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

    indicator.innerText = `الخطوة ${currentCustomStep} من ${TOTAL_CUSTOM_STEPS}`;
    prevBtn.classList.toggle('hidden', currentCustomStep === 1);
    
    if (currentCustomStep === 1) {
        nextBtn.classList.add('hidden');
    } else {
        nextBtn.classList.remove('hidden');
    }

    if (currentCustomStep === TOTAL_CUSTOM_STEPS) {
        nextBtn.innerHTML = '<i class="fa-solid fa-check-double mr-2"></i> تأكيد الطلب المخصص';
        nextBtn.className = 'bg-green-600 hover:bg-green-700 text-white text-sm font-black px-8 py-3 rounded-xl transition shadow-lg w-full md:w-auto';
    } else if (currentCustomStep > 1) {
        nextBtn.innerHTML = 'التالي <i class="fa-solid fa-arrow-left mr-1"></i>';
        nextBtn.className = 'gold-gradient text-black text-sm font-black px-8 py-3 rounded-xl hover:opacity-90 transition shadow-lg w-full md:w-auto';
    }

    const config = (state.storeSettings && state.storeSettings.custom_workshop) || { products: [] };
    let html = '';

    switch (currentCustomStep) {
        case 1:
            html = `
                <div class="space-y-6 animate-fade-in text-center">
                    <h2 class="text-2xl font-black text-white mb-2">ماذا تريد أن نصمم لك اليوم؟ 🎨</h2>
                    <p class="text-gray-400 text-sm mb-6">اختر نوع الخدمة أو الآلة التي تريد استخدامها</p>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onclick="selectCustomService('laser', 'حفر بالليزر 🪵')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3">
                            <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-fire"></i></div>
                            <h3 class="text-white font-bold text-lg">حفر بالليزر</h3>
                            <p class="text-xs text-gray-500">محافظ، أمشاط، ميداليات خشبية وجلدية</p>
                        </button>
                        
                        <button onclick="selectCustomService('print', 'طباعة حرارية 👕')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3">
                            <div class="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-shirt"></i></div>
                            <h3 class="text-white font-bold text-lg">طباعة حرارية</h3>
                            <p class="text-xs text-gray-500">أكواب سحرية، تيشيرتات، هدايا مطبوعة</p>
                        </button>
                        
                        <button onclick="selectCustomService('frame', 'كادرات وصور 🖼️')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3">
                            <div class="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-image"></i></div>
                            <h3 class="text-white font-bold text-lg">تصميم كادرات</h3>
                            <p class="text-xs text-gray-500">صور ذكريات، كتابة بالفويل الذهبي الفاخر</p>
                        </button>
                        
                        <button onclick="selectCustomService('cameo', 'قص كاميو 5 ✂️')" class="group bg-gray-900 border border-gray-700 hover:border-[#D4AF37] p-5 rounded-2xl transition flex flex-col items-center gap-3">
                            <div class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-3xl group-hover:scale-110 transition"><i class="fa-solid fa-scissors"></i></div>
                            <h3 class="text-white font-bold text-lg">قص وتفريغ (كاميو)</h3>
                            <p class="text-xs text-gray-500">كلمات وأسماء بارزة للمناسبات والخطوبة</p>
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
                            <div><label class="text-xs text-gray-400 font-bold block mb-1">الاسم واللقب *</label><input type="text" id="c-name" value="${customOrderData.customerName}" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            <div><label class="text-xs text-gray-400 font-bold block mb-1">رقم الهاتف *</label><input type="tel" id="c-phone" value="${customOrderData.customerPhone}" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            
                            <div class="md:col-span-2"><label class="text-xs text-[#D4AF37] font-bold block mb-1">الولاية *</label>
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
                            
                            <div class="md:col-span-2"><label class="text-xs text-[#D4AF37] font-bold block mb-1">البلدية والعنوان التفصيلي *</label><input type="text" id="c-commune" value="${customOrderData.commune}" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 4:
            const shipCost = customOrderData.wilaya ? calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType) : 0;
            const finalTotal = customOrderData.basePrice + customOrderData.addonsPrice + shipCost;

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
                                <span class="font-bold text-white">${customOrderData.selectedProduct || 'غير محدد'} ${customOrderData.color ? `(اللون: ${customOrderData.color})` : ''}</span>
                            </div>
                            ${customOrderData.text1 ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-2 border border-gray-800"><span class="text-gray-500">النص 1:</span> <span class="text-white">${customOrderData.text1}</span></div>` : ''}
                            ${customOrderData.text2 ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-1 border border-gray-800"><span class="text-gray-500">النص 2:</span> <span class="text-white">${customOrderData.text2}</span></div>` : ''}
                            ${customOrderData.notes ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-1 border border-gray-800"><span class="text-gray-500">ملاحظات:</span> <span class="text-white">${customOrderData.notes}</span></div>` : ''}
                            
                            <div class="flex justify-between items-center mt-3">
                                <span>سعر التصميم والمنتج:</span>
                                <span class="font-bold text-white">${(customOrderData.basePrice + customOrderData.addonsPrice).toLocaleString()} دج</span>
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
                </div>
            `;
            break;
    }

    container.innerHTML = html;
    updateLivePriceDisplay();
}

// 4. بناء الخيارات الديناميكية (الذكاء الاصطناعي الخاص بالورشة)
function buildDynamicServiceOptions(config) {
    // تصفية المنتجات حسب القسم وحسب التوفر (inStock = true)
    const categoryProducts = (config.products || []).filter(p => p.category === customOrderData.serviceType && p.inStock);
    
    // حفظ المنتجات في متغير عام ليسهل الوصول إليها
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

    // اختيار المنتج من المنتجات المُنشأة في الإدارة
    html += `
        <div>
            <label class="block text-xs font-bold text-[#D4AF37] mb-1">اختر المنتج أو الخدمة:</label>
            <select id="dynamic-product" onchange="handleProductSelection(this.value)" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                <option value="">-- اضغط للاختيار --</option>
                ${categoryProducts.map(p => `<option value="${p.id}">${p.name} -${p.basePrice} دج</option>`).join('')}
            </select>
        </div>
    `;

    // الحاوية المخفية لباقي المدخلات (تظهر عند اختيار المنتج)
    html += `<div id="dynamic-fields-container" class="hidden space-y-4 mt-4">`;

    // الألوان
    html += `
        <div id="dynamic-color-container" class="hidden">
            <label class="block text-xs font-bold text-gray-400 mb-1">اللون المطلوب:</label>
            <select id="dynamic-color" onchange="customOrderData.color=this.value" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></select>
        </div>
    `;

    // الأوجه / الخيارات الإضافية
    html += `
        <div id="dynamic-faces-container" class="hidden">
            <label class="block text-xs font-bold text-[#D4AF37] mb-1">كم وجه تريد؟</label>
            <select id="dynamic-faces" onchange="handleFacesChange(this.value)" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                <option value="1">وجه واحد أساسي (السعر المذكور أعلاه)</option>
                <option id="face2-option" value="2">إضافة وجه ثاني</option>
            </select>
        </div>
    `;

    // رفع صورة (للطباعة والكادرات)
    if (customOrderData.serviceType === 'print' || customOrderData.serviceType === 'frame') {
        html += `
            <div>
                <label class="block text-xs font-bold text-[#D4AF37] mb-2">أرفق الصورة للتصميم 📸:</label>
                <input type="file" accept="image/*" onchange="handleCustomImageUpload(event)" class="w-full border border-gray-700 p-2 rounded-xl text-sm bg-gray-900 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-black cursor-pointer hover:file:bg-[#D4AF37]/90">
                ${customOrderData.uploadedImageBase64 ? `<p class="text-green-500 text-xs mt-2 font-bold"><i class="fa-solid fa-check"></i> تم إرفاق الصورة بنجاح</p>` : ''}
            </div>
        `;
    }

    // الحقول النصية (العناوين تأتي من الإدارة)
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
            <input type="text" oninput="customOrderData.notes=this.value" value="${customOrderData.notes}" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]" placeholder="مثال: الخط عربي ديواني...">
        </div>
    `;

    html += `</div></div>`;

    // الاحتفاظ بالاختيار إذا كان الزبون يتنقل بين الخطوات
    setTimeout(() => {
        if(customOrderData.selectedProductId && document.getElementById('dynamic-product')) {
            document.getElementById('dynamic-product').value = customOrderData.selectedProductId;
            handleProductSelection(customOrderData.selectedProductId, true);
        }
    }, 50);

    return html;
}

// 5. هندسة تفاعل الواجهة الديناميكية
window.selectCustomService = function(type, name) {
    customOrderData.serviceType = type;
    customOrderData.serviceName = name;
    nextCustomStep();
}

window.handleProductSelection = function(productId, isRestore = false) {
    const container = document.getElementById('dynamic-fields-container');
    
    if (!productId) {
        container.classList.add('hidden');
        customOrderData.selectedProduct = '';
        customOrderData.selectedProductId = '';
        customOrderData.basePrice = 0;
        customOrderData.addonsPrice = 0;
        updateLivePriceDisplay();
        return;
    }

    const prod = window.currentCategoryProducts.find(p => p.id === productId);
    if (!prod) return;

    container.classList.remove('hidden');
    customOrderData.selectedProductId = prod.id;
    customOrderData.selectedProduct = prod.name;
    customOrderData.basePrice = prod.basePrice || 0;
    
    if(!isRestore) {
        customOrderData.addonsPrice = 0;
        customOrderData.color = '';
        customOrderData.text1 = '';
        customOrderData.text2 = '';
    }

    // الصورة
    const previewDiv = document.getElementById('dynamic-image-preview');
    const imgEl = document.getElementById('dynamic-img');
    if (prod.image) {
        imgEl.src = prod.image;
        previewDiv.classList.remove('hidden');
    } else {
        previewDiv.classList.add('hidden');
    }

    // الألوان
    const colorDiv = document.getElementById('dynamic-color-container');
    const colorSelect = document.getElementById('dynamic-color');
    if (prod.colors && prod.colors.trim() !== '') {
        const colorsArray = prod.colors.split(',').map(c => c.trim()).filter(c => c);
        colorSelect.innerHTML = `<option value="">-- اختر اللون --</option>` + colorsArray.map(c => `<option value="${c}" ${customOrderData.color === c ? 'selected' : ''}>${c}</option>`).join('');
        colorDiv.classList.remove('hidden');
    } else {
        colorDiv.classList.add('hidden');
    }

    // الأوجه الإضافية (السعر)
    const facesDiv = document.getElementById('dynamic-faces-container');
    const face2Option = document.getElementById('face2-option');
    if (prod.face2Price > 0) {
        face2Option.innerText = `إضافة وجه ثاني (+${prod.face2Price} دج)`;
        facesDiv.classList.remove('hidden');
        window.currentFace2Price = prod.face2Price;
    } else {
        facesDiv.classList.add('hidden');
        window.currentFace2Price = 0;
    }

    // العناوين (Labels) المُخصصة
    const text1Div = document.getElementById('dynamic-text-1-container');
    const text2Div = document.getElementById('dynamic-text-2-container');
    
    document.getElementById('dynamic-label-1').innerText = prod.label1 || 'النص المطلوب:';
    document.getElementById('dynamic-label-2').innerText = prod.label2 || 'النص الإضافي:';
    document.getElementById('dynamic-label-notes').innerText = prod.labelNotes || 'ملاحظات إضافية:';

    text1Div.classList.remove('hidden');
    
    const facesSelect = document.getElementById('dynamic-faces');
    if (facesSelect && facesSelect.value === "2") {
        text2Div.classList.remove('hidden');
    } else if (customOrderData.serviceType === 'cameo' || customOrderData.serviceType === 'frame') {
         if (prod.label2) text2Div.classList.remove('hidden');
         else text2Div.classList.add('hidden');
    } else {
        text2Div.classList.add('hidden');
    }

    updateLivePriceDisplay();
}

window.handleFacesChange = function(faces) {
    const text2Div = document.getElementById('dynamic-text-2-container');
    if (faces === "2") {
        text2Div.classList.remove('hidden');
        customOrderData.addonsPrice = window.currentFace2Price || 0;
    } else {
        text2Div.classList.add('hidden');
        customOrderData.addonsPrice = 0;
        customOrderData.text2 = '';
    }
    updateLivePriceDisplay();
}

window.handleCustomImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        customOrderData.uploadedImageBase64 = e.target.result;
        renderCustomStep(); 
    };
    reader.readAsDataURL(file);
}

window.setCustomShipping = function(type) {
    customOrderData.shippingType = type;
    const btnOffice = document.getElementById('btn-ship-office');
    const btnHome = document.getElementById('btn-ship-home');
    const activeClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]";
    const inactiveClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-gray-700 bg-black text-gray-400";
    if (btnOffice) btnOffice.className = type === 'office' ? activeClass : inactiveClass;
    if (btnHome) btnHome.className = type === 'home' ? activeClass : inactiveClass;
    updateLivePriceDisplay(); 
}

// 6. التنقل وإرسال الطلب (مع سحب البيانات بالقوة)
export function nextCustomStep() {
    if (currentCustomStep === 2 && !customOrderData.selectedProductId) {
        alert('يرجى تحديد المنتج أو الخدمة المطلوبة أولاً للتقدم ⚠️'); return;
    }
    
    if (currentCustomStep === 3) {
        customOrderData.customerName = document.getElementById('c-name')?.value.trim() || customOrderData.customerName;
        customOrderData.customerPhone = document.getElementById('c-phone')?.value.trim() || customOrderData.customerPhone;
        customOrderData.wilaya = document.getElementById('c-wilaya')?.value || customOrderData.wilaya;
        customOrderData.commune = document.getElementById('c-commune')?.value.trim() || customOrderData.commune;

        if (!customOrderData.customerName || !customOrderData.customerPhone || !customOrderData.wilaya || !customOrderData.commune) {
            alert('تنبيه ⚠️\nيرجى إكمال جميع معلومات الإرسال والولاية لحساب التوصيل بنجاح!'); return;
        }
    }
    
    if (currentCustomStep === TOTAL_CUSTOM_STEPS) { submitCustomOrder(); return; }
    currentCustomStep++;
    renderCustomStep();
}

export function prevCustomStep() {
    if (currentCustomStep > 1) { currentCustomStep--; renderCustomStep(); }
}

export function submitCustomOrder() {
    const shipCost = calculateShippingCost(customOrderData.wilaya, state.WILAYAS, customOrderData.shippingType);
    const grandTotal = customOrderData.basePrice + customOrderData.addonsPrice + shipCost;

    const fullDescription = `[طلب مخصص 🎨]
- القسم: ${customOrderData.serviceName}
- المنتج: ${customOrderData.selectedProduct} ${customOrderData.color ? '(اللون: '+customOrderData.color+')' : ''}
- النص الأول: ${customOrderData.text1 || 'لا يوجد'}
- النص الثاني: ${customOrderData.text2 || 'لا يوجد'}
- ملاحظات: ${customOrderData.notes || 'لا توجد'}
${customOrderData.uploadedImageBase64 ? '- 📸 الزبون أرفق صورة شخصية للتصميم.' : ''}`;

    const newOrder = {
        customer: customOrderData.customerName,
        phone: customOrderData.customerPhone,
        wilaya: state.WILAYAS.find(w => w.code === customOrderData.wilaya)?.name || customOrderData.wilaya,
        commune: `${customOrderData.commune} (${customOrderData.shippingType === 'home' ? 'توصيل للمنزل' : 'استلام من المكتب'})`,
        product: fullDescription,
        total: grandTotal,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date(),
        attachedImage: customOrderData.uploadedImageBase64 || null 
    };

    if (typeof window.db !== 'undefined') {
        window.db.collection("orders").add(newOrder).then(() => {
            closeCustomBuilder();
            showCustomAlert('تم استلام طلبك المخصص! 🎉', 'سنقوم بمراجعة التفاصيل والصور ونتصل بك قريباً.', true);
        }).catch(err => showCustomAlert('خطأ', 'تعذر إرسال الطلب: ' + err.message, false));
    }
}

// Window Bindings
window.openCustomBuilder = openCustomBuilder;
window.closeCustomBuilder = closeCustomBuilder;
window.nextCustomStep = nextCustomStep;
window.prevCustomStep = prevCustomStep;
