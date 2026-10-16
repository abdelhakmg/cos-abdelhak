// --- ملف js/custom-builder.js ---

import { state } from './store/state.js';
import { showCustomAlert, calculateShippingCost, formatPrice } from './utils/helpers.js';

let currentCustomStep = 1;
const TOTAL_CUSTOM_STEPS = 4;

let customOrderData = {
    serviceType: '', // laser, print, frame, cameo
    serviceName: '',
    selectedProduct: '', 
    basePrice: 0,
    addonsPrice: 0,
    // مدخلات الزبون
    text1: '', 
    text2: '',
    uploadedImageBase64: '',
    notes: '',
    // معلومات التوصيل
    customerName: '',
    customerPhone: '',
    wilaya: '',
    commune: '',
    shippingType: 'home'
};

// 1. فتح الورشة
export function openCustomBuilder() {
    const config = (state.storeSettings && state.storeSettings.custom_workshop) || {};
    
    if (config.isActive === false) {
        showCustomAlert("الورشة مغلقة مؤقتاً 🛠️", "نحن نقوم بصيانة وتحديث آلاتنا حالياً، يرجى العودة لاحقاً لطلب تصميمك الخاص!", false);
        return;
    }

    // إعادة ضبط البيانات عند كل فتح جديد
    currentCustomStep = 1;
    customOrderData = {
        serviceType: '', serviceName: '', selectedProduct: '', basePrice: 0, addonsPrice: 0,
        text1: '', text2: '', uploadedImageBase64: '', notes: '',
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

// 2. تحديث السعر الحي في الشريط السفلي
function updateLivePriceDisplay() {
    const priceBadge = document.getElementById('custom-live-price');
    if (!priceBadge) return;

    const total = customOrderData.basePrice + customOrderData.addonsPrice;
    if (total > 0 && currentCustomStep < 4) {
        priceBadge.innerText = total.toLocaleString() + ' دج';
        priceBadge.classList.remove('hidden');
    } else {
        priceBadge.classList.add('hidden');
    }
}

// 3. رسم الخطوات
export function renderCustomStep() {
    const container = document.getElementById('custom-wizard-content');
    const indicator = document.getElementById('custom-step-indicator');
    const prevBtn = document.getElementById('custom-prev-btn');
    const nextBtn = document.getElementById('custom-next-btn');
    
    if (!container) return;

    indicator.innerText = `الخطوة ${currentCustomStep} من ${TOTAL_CUSTOM_STEPS}`;
    prevBtn.classList.toggle('hidden', currentCustomStep === 1);
    
    // إخفاء زر التالي في الخطوة الأولى حتى يختار خدمة
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

    let html = '';
    const config = (state.storeSettings && state.storeSettings.custom_workshop) || { laser:{}, print:{}, frames:{}, cameo:{} };

    switch (currentCustomStep) {
        case 1:
            // اختيار الخدمة الرئيسية
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
            // بناء الواجهة حسب نوع الخدمة المختارة في الخطوة 1
            html = buildServiceOptionsHtml(config);
            break;

        case 3:
            // معلومات الزبون والتوصيل
            html = `
                <div class="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-right">
                    <h4 class="font-black text-lg text-white text-center mb-4">أين نرسل لك هذا الإبداع؟ 🚚</h4>
                    <div class="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label class="text-xs text-gray-400 font-bold block mb-1">الاسم واللقب *</label><input type="text" id="c-name" value="${customOrderData.customerName}" oninput="customOrderData.customerName=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            <div><label class="text-xs text-gray-400 font-bold block mb-1">رقم الهاتف *</label><input type="tel" id="c-phone" value="${customOrderData.customerPhone}" oninput="customOrderData.customerPhone=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            
                            <div class="md:col-span-2"><label class="text-xs text-[#D4AF37] font-bold block mb-1">الولاية *</label>
                                <select id="c-wilaya" onchange="customOrderData.wilaya=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37] cursor-pointer">
                                    <option value="">اختر ولايتك لحساب التوصيل...</option>
                                    ${state.WILAYAS.map(w => `<option value="${w.code}" ${customOrderData.wilaya === w.code ? 'selected' : ''}>${w.code} -${w.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="text-xs text-[#D4AF37] font-bold block mb-2">طريقة التوصيل *</label>
                                <div class="flex gap-3">
                                    <div onclick="setCustomShipping('office')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${customOrderData.shippingType === 'office' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-store"></i> استلام من المكتب
                                    </div>
                                    <div onclick="setCustomShipping('home')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${customOrderData.shippingType === 'home' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-house"></i> توصيل للمنزل
                                    </div>
                                </div>
                            </div>
                            
                            <div class="md:col-span-2"><label class="text-xs text-[#D4AF37] font-bold block mb-1">البلدية والعنوان التفصيلي *</label><input type="text" id="c-commune" value="${customOrderData.commune}" oninput="customOrderData.commune=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 4:
            // المراجعة والتأكيد
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
                            <div class="flex justify-between items-center">
                                <span>المنتج / الخيار:</span>
                                <span class="font-bold text-white">${customOrderData.selectedProduct || 'غير محدد'}</span>
                            </div>
                            ${customOrderData.text1 ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-2 border border-gray-800"><span class="text-gray-500">النص 1:</span> <span class="text-white">${customOrderData.text1}</span></div>` : ''}
                            ${customOrderData.text2 ? `<div class="bg-gray-900 p-2 rounded-lg text-xs mt-1 border border-gray-800"><span class="text-gray-500">النص 2:</span> <span class="text-white">${customOrderData.text2}</span></div>` : ''}
                            
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

// 4. بناء خيارات كل خدمة برمجياً
function buildServiceOptionsHtml(config) {
    let html = '<div class="space-y-6 animate-fade-in text-right max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">';
    
    if (customOrderData.serviceType === 'laser') {
        html += `
            <h4 class="font-black text-lg text-white text-center mb-4">تفاصيل الحفر بالليزر 🪵</h4>
            <div class="space-y-4">
                <label class="block text-xs font-bold text-[#D4AF37]">اختر المنتج المراد الحفر عليه:</label>
                <select id="laser-product" onchange="updateLaserPricing(this.value, ${config.laser?.face1Price||1000})" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                    <option value="">-- اختر المنتج --</option>
                    <option value="محفظة نقود (جلد)" ${customOrderData.selectedProduct.includes('محفظة') ? 'selected':''}>محفظة نقود جلدية</option>
                    <option value="مشطة خشبية" ${customOrderData.selectedProduct.includes('مشطة') ? 'selected':''}>مشطة خشبية بالمقبض</option>
                    <option value="سلاك لحية" ${customOrderData.selectedProduct.includes('سلاك') ? 'selected':''}>سلاك لحية صغير</option>
                    <option value="حامل مفاتيح" ${customOrderData.selectedProduct.includes('مفاتيح') ? 'selected':''}>حامل مفاتيح (Porte Clé)</option>
                </select>

                <label class="block text-xs font-bold text-[#D4AF37] mt-4">كم وجه تريد الحفر عليه؟</label>
                <select id="laser-faces" onchange="handleLaserFacesChange(this.value, ${config.laser?.face2Price||500})" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                    <option value="1">وجه واحد أساسي (خارجي)</option>
                    <option value="2">وجهين (خارجي + داخلي/خلفي) (+${config.laser?.face2Price||500} دج)</option>
                </select>

                <div id="laser-text-1" class="mt-4">
                    <label class="block text-xs font-bold text-gray-400 mb-1">النص للوجه الأول (الخارجي):</label>
                    <textarea oninput="customOrderData.text1=this.value" rows="2" placeholder="مثال: عبد الحق..." class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">${customOrderData.text1}</textarea>
                </div>
                
                <div id="laser-text-2" class="mt-4 hidden">
                    <label class="block text-xs font-bold text-gray-400 mb-1">النص للوجه الثاني (الداخلي/الخلفي):</label>
                    <textarea oninput="customOrderData.text2=this.value" rows="2" placeholder="مثال: أحبك يا سندي..." class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">${customOrderData.text2}</textarea>
                </div>
                
                <div class="mt-4">
                    <label class="block text-xs font-bold text-gray-400 mb-1">ملاحظات إضافية (اختياري):</label>
                    <input type="text" oninput="customOrderData.notes=this.value" value="${customOrderData.notes}" placeholder="مثال: الخط عربي ديواني" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                </div>
            </div>
        `;
        // تهيئة العرض إذا كان قد اختار وجهين مسبقاً
        setTimeout(() => { if(document.getElementById('laser-faces')) handleLaserFacesChange(document.getElementById('laser-faces').value, config.laser?.face2Price||500); }, 50);

    } 
    else if (customOrderData.serviceType === 'print') {
        html += `
            <h4 class="font-black text-lg text-white text-center mb-4">الطباعة الحرارية 👕☕</h4>
            <div class="space-y-4">
                <label class="block text-xs font-bold text-[#D4AF37]">اختر المنتج المراد الطباعة عليه:</label>
                <select id="print-product" onchange="updatePrintPricing(this, ${JSON.stringify(config.print)})" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                    <option value="" data-price="0">-- اختر المنتج --</option>
                    <option value="كأس سحري" data-price="${config.print?.magicMug||1500}">كأس سحري (يتغير بالحرارة) - ${config.print?.magicMug||1500} دج</option>
                    <option value="كأس أبيض" data-price="${config.print?.whiteMug||1000}">كأس أبيض عادي - ${config.print?.whiteMug||1000} دج</option>
                    <option value="تيشيرت وجه واحد" data-price="${config.print?.tshirtOneSide||1800}">تيشيرت (طباعة وجه واحد) - ${config.print?.tshirtOneSide||1800} دج</option>
                    <option value="تيشيرت وجهين" data-price="${config.print?.tshirtTwoSides||2200}">تيشيرت (طباعة وجهين) - ${config.print?.tshirtTwoSides||2200} دج</option>
                </select>

                <div class="mt-4">
                    <label class="block text-xs font-bold text-[#D4AF37] mb-2">الصورة المراد طباعتها 📸:</label>
                    <input type="file" accept="image/*" onchange="handleCustomImageUpload(event)" class="w-full border border-gray-700 p-2 rounded-xl text-sm bg-gray-900 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-black hover:file:bg-[#D4AF37]/90 cursor-pointer">
                    ${customOrderData.uploadedImageBase64 ? `<p class="text-green-500 text-xs mt-2 font-bold"><i class="fa-solid fa-check"></i> تم إرفاق الصورة بنجاح</p>` : ''}
                </div>
                
                <div class="mt-4">
                    <label class="block text-xs font-bold text-gray-400 mb-1">نص إضافي على التصميم (اختياري):</label>
                    <input type="text" oninput="customOrderData.text1=this.value" value="${customOrderData.text1}" placeholder="مثال: سنة حلوة يا جميل" class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                </div>
            </div>
        `;
    }
    else if (customOrderData.serviceType === 'frame') {
        html += `
            <h4 class="font-black text-lg text-white text-center mb-4">تصميم الكادرات والفؤيل 🖼️</h4>
            <div class="space-y-4">
                <label class="block text-xs font-bold text-[#D4AF37]">اختر حجم الكادر:</label>
                <select id="frame-size" onchange="updateFramePricing(this.value, ${JSON.stringify(config.frames)})" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                    <option value="">-- اختر الحجم --</option>
                    <option value="A5">حجم صغير A5 - ${config.frames?.sizeA5||800} دج</option>
                    <option value="A4">حجم متوسط A4 - ${config.frames?.sizeA4||1200} دج</option>
                    <option value="A3">حجم كبير A3 - ${config.frames?.sizeA3||2000} دج</option>
                </select>

                <label class="flex items-center gap-2 mt-4 cursor-pointer bg-gray-900 p-3 rounded-xl border border-gray-700 hover:border-[#D4AF37]">
                    <input type="checkbox" id="frame-foil-cb" onchange="toggleFoilPrice(this.checked, ${config.frames?.foilAddon||500})" class="w-4 h-4 accent-[#D4AF37]">
                    <span class="text-sm font-bold text-white">إضافة كتابة بالفويل الذهبي الحراري ✨ (+${config.frames?.foilAddon||500} دج)</span>
                </label>

                <div class="mt-4">
                    <label class="block text-xs font-bold text-[#D4AF37] mb-2">رفع صورة (للتصميم):</label>
                    <input type="file" accept="image/*" onchange="handleCustomImageUpload(event)" class="w-full border border-gray-700 p-2 rounded-xl text-sm bg-gray-900 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-black cursor-pointer">
                    ${customOrderData.uploadedImageBase64 ? `<p class="text-green-500 text-xs mt-2 font-bold"><i class="fa-solid fa-check"></i> تم إرفاق الصورة</p>` : ''}
                </div>
                
                <div class="mt-4">
                    <label class="block text-xs font-bold text-gray-400 mb-1">العبارة أو الأسماء (للكتابة):</label>
                    <textarea oninput="customOrderData.text1=this.value" rows="2" placeholder="مثال: عبد الحق & فاطمة - 2026..." class="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">${customOrderData.text1}</textarea>
                </div>
            </div>
        `;
    }
    else if (customOrderData.serviceType === 'cameo') {
        html += `
            <h4 class="font-black text-lg text-white text-center mb-4">قص الكاميو 5 (كلمات بارزة) ✂️</h4>
            <div class="bg-gray-900 p-4 rounded-xl border border-gray-700 mb-4 text-xs text-gray-300">
                السعر الأساسي يبدأ من <strong class="text-[#D4AF37]">${config.cameo?.basePrice||500} دج</strong>.
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-[#D4AF37] mb-1">الكلمات المطلوب قصها:</label>
                    <textarea oninput="customOrderData.text1=this.value" rows="2" placeholder="مثال: Happy Birthday / ألف مبروك الخطوبة..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">${customOrderData.text1}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-400 mb-1">لون الفينيل / الورق:</label>
                    <select onchange="customOrderData.text2=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                        <option value="ذهبي">ذهبي لامع ✨</option>
                        <option value="فضي">فضي</option>
                        <option value="أسود">أسود فاحم</option>
                        <option value="أبيض">أبيض</option>
                        <option value="أخرى">لون آخر (اذكره في الملاحظات)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-400 mb-1">ملاحظات عن الحجم (تقريباً):</label>
                    <input type="text" oninput="customOrderData.notes=this.value" value="${customOrderData.notes}" placeholder="مثال: العرض 15 سم" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                </div>
            </div>
        `;
        // تعيين السعر الأساسي للكاميو فوراً
        customOrderData.basePrice = config.cameo?.basePrice || 500;
        customOrderData.selectedProduct = 'خدمة قص كاميو 5';
    }

    html += '</div>';
    return html;
}

// 5. دوال مساعدة لحساب وتحديث الأسعار الديناميكية في الخطوة 2
window.selectCustomService = function(type, name) {
    customOrderData.serviceType = type;
    customOrderData.serviceName = name;
    nextCustomStep();
}

window.updateLaserPricing = function(product, baseP) {
    customOrderData.selectedProduct = product;
    customOrderData.basePrice = product ? baseP : 0;
    updateLivePriceDisplay();
}

window.handleLaserFacesChange = function(faces, extraPrice) {
    const text2Div = document.getElementById('laser-text-2');
    if (faces === "2") {
        if(text2Div) text2Div.classList.remove('hidden');
        customOrderData.addonsPrice = extraPrice;
    } else {
        if(text2Div) text2Div.classList.add('hidden');
        customOrderData.addonsPrice = 0;
        customOrderData.text2 = ''; // تصفير النص الثاني
    }
    updateLivePriceDisplay();
}

window.updatePrintPricing = function(selectEl, printConfig) {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    customOrderData.selectedProduct = selectedOption.value;
    customOrderData.basePrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
    updateLivePriceDisplay();
}

window.updateFramePricing = function(size, frameConfig) {
    customOrderData.selectedProduct = `كادر حجم ${size}`;
    if(size === 'A5') customOrderData.basePrice = frameConfig.sizeA5 || 800;
    else if(size === 'A4') customOrderData.basePrice = frameConfig.sizeA4 || 1200;
    else if(size === 'A3') customOrderData.basePrice = frameConfig.sizeA3 || 2000;
    else customOrderData.basePrice = 0;
    updateLivePriceDisplay();
}

window.toggleFoilPrice = function(isChecked, foilPrice) {
    customOrderData.addonsPrice = isChecked ? foilPrice : 0;
    updateLivePriceDisplay();
}

// قراءة الصورة وتحويلها إلى Base64 ليتم حفظها مع الطلب
window.handleCustomImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        customOrderData.uploadedImageBase64 = e.target.result;
        renderCustomStep(); // لإظهار علامة "الصح" الخضراء
    };
    reader.readAsDataURL(file);
}

window.setCustomShipping = function(type) {
    customOrderData.shippingType = type;
    renderCustomStep(); // لتحديث شكل الأزرار المحددة
}

// 6. التنقل وإرسال الطلب
export function nextCustomStep() {
    if (currentCustomStep === 2) {
        if (!customOrderData.selectedProduct && customOrderData.serviceType !== 'cameo') {
            alert('يرجى تحديد المنتج أولاً.'); return;
        }
    }
    if (currentCustomStep === 3) {
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
- الخدمة: ${customOrderData.serviceName}
- المنتج: ${customOrderData.selectedProduct}
- النص 1: ${customOrderData.text1 || 'لا يوجد'}
- النص 2/اللون: ${customOrderData.text2 || 'لا يوجد'}
- الملاحظات: ${customOrderData.notes || 'لا توجد'}
${customOrderData.uploadedImageBase64 ? '- 📸 الزبون أرفق صورة للتصميم.' : ''}`;

    const newOrder = {
        customer: customOrderData.customerName,
        phone: customOrderData.customerPhone,
        wilaya: state.WILAYAS.find(w => w.code === customOrderData.wilaya)?.name || customOrderData.wilaya,
        commune: `${customOrderData.commune} (${customOrderData.shippingType === 'home' ? 'للمنزل' : 'للمكتب'})`,
        product: fullDescription,
        total: grandTotal,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date(),
        // حفظ الصورة المخفية ليراها المدير لاحقاً إذا احتاجها
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
