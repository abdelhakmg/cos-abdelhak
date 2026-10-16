// --- ملف js/gift-builder.js ---

import { state } from './store/state.js';
import { showCustomAlert, calculateShippingCost, safeCall } from './utils/helpers.js';

let currentGiftStep = 1;
const TOTAL_STEPS = 6;
let activeProductCategory = 'الكل';

let giftData = {
    recipient: '',
    selectedBox: null,
    selectedProducts: [],
    selectedWrapping: null,
    giftMessage: '',
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    wilaya: '',
    commune: '',
    shippingType: 'desk'
};

export function openGiftBuilder() {
    // 🔴 1. التحقق من حالة زر الطوارئ (Master Switch) من الإعدادات
    const storeSettings = state.storeSettings || {};
    const giftConfig = storeSettings.gift || {};
    
    // إذا كان المدير قد أوقف صانع الهدايا، نمنع الدخول ونظهر رسالة أنيقة
    // إظهار نافذة "قريباً" كتشويق للزبائن عندما يكون النظام متوقفاً
    if (giftConfig.isActive === false) {
        showCustomAlert("قريباً جداً... 🚀", "ميزة 'صانع الهدايا الفاخرة' قيد التجهيز حالياً. استعدوا لتجربة إهداء سحرية لا تُنسى قريباً في متجرنا!", true);
        return; // توقيف الدالة يمنع فتح النافذة
    }

    currentGiftStep = 1;
    activeProductCategory = 'الكل';
    giftData = { 
        recipient: '', selectedBox: null, selectedProducts: [], 
        selectedWrapping: null, giftMessage: '', senderName: '', senderPhone: '', 
        receiverName: '', receiverPhone: '', wilaya: '', commune: '', shippingType: 'desk' 
    };
    renderGiftStep();
    const modal = document.getElementById('gift-builder-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

export function closeGiftBuilder() {
    const modal = document.getElementById('gift-builder-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

export function renderGiftStep() {
    const container = document.getElementById('gift-wizard-content');
    const indicator = document.getElementById('gift-step-indicator');
    const prevBtn = document.getElementById('gift-prev-btn');
    const nextBtn = document.getElementById('gift-next-btn');
    if (!container) return;

    // جلب إعدادات الهدايا من قاعدة البيانات 
    const giftConfig = (state.storeSettings && state.storeSettings.gift) ? state.storeSettings.gift : {};

    indicator.innerText = `الخطوة ${currentGiftStep} من ${TOTAL_STEPS}`;
    prevBtn.classList.toggle('hidden', currentGiftStep === 1);

    if (currentGiftStep === TOTAL_STEPS) {
        nextBtn.innerHTML = '<i class="fa-solid fa-check-double mr-2"></i> تأكيد الطلب النهائي';
        nextBtn.className = 'bg-green-600 hover:bg-green-700 text-white text-sm font-black px-8 py-3 rounded-xl transition shadow-lg w-full md:w-auto';
    } else {
        nextBtn.innerHTML = 'التالي <i class="fa-solid fa-arrow-left mr-1"></i>';
        nextBtn.className = 'gold-gradient text-black text-sm font-black px-8 py-3 rounded-xl hover:opacity-90 transition shadow-lg w-full md:w-auto';
    }

    let html = '';
    const currentTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0) + (giftData.selectedBox ? giftData.selectedBox.price || 0 : 0) + (giftData.selectedWrapping ? giftData.selectedWrapping.price || 0 : 0);
    
    // 🔴 2. جلب المقولة الترحيبية الديناميكية
    const storeSlogan = giftConfig.slogan || state.storeSettings.slogan || "يبدو أن أحدهم سيغدو سعيداً اليوم";

    switch (currentGiftStep) {
        case 1:
            // 🔴 3. جلب قائمة المستلمين الديناميكية
            let recipients = giftConfig.recipients && giftConfig.recipients.length > 0 
                ? giftConfig.recipients 
                : ["زوجتي", "زوجي", "الأم", "الأب", "أختي", "أخي", "صديقتي", "صديقي", "شخص عزيز", "نفسي"];
            
            html = `
                <div class="space-y-6 animate-fade-in flex flex-col items-center justify-center text-center py-4">
                    <div class="w-24 h-24 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30 mb-2 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                        <i class="fa-solid fa-gift text-5xl text-[#D4AF37]"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-black text-white mb-2">صانع الهدايا السحري</h2>
                        <p class="text-[#D4AF37] font-bold text-sm">✨ "${storeSlogan}" ✨</p>
                    </div>
                    <div class="w-full mt-6 text-right">
                        <h4 class="font-bold text-sm text-gray-300 mb-4 border-b border-gray-800 pb-2">لمن تجهز هذه الهدية الفاخرة؟</h4>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            ${recipients.map(r => `
                                <button type="button" onclick="setGiftRecipient('${r}')" class="py-3 px-2 rounded-xl border text-sm font-bold transition transform hover:scale-105 ${giftData.recipient === r ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]' : 'border-gray-700 bg-gray-900/50 text-gray-300 hover:border-gray-500'}">
                                    ${r}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            break;

        case 2:
            const boxProducts = state.products.filter(p => {
                const cat = (p.category || '').toLowerCase().trim();
                return cat === 'علب' || cat === 'علبة' || cat === 'صناديق';
            });
            html = `
                <div class="space-y-5 animate-fade-in relative">
                    <div class="text-center space-y-2 mb-4">
                        <h4 class="font-black text-lg text-white">1. اختر صندوق الهدية 📦</h4>
                        <p class="text-xs text-gray-400">اضغط على <i class="fa-solid fa-eye text-[#D4AF37]"></i> لرؤية الأبعاد والتفاصيل</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        ${boxProducts.length > 0 ? boxProducts.map(b => {
                            const isSelected = giftData.selectedBox && giftData.selectedBox.id === b.id;
                            return `
                                <div class="bg-gray-900 p-4 rounded-2xl border transition text-center space-y-3 relative ${isSelected ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-gradient-to-b from-gray-900 to-[#D4AF37]/10' : 'border-gray-800 hover:border-gray-600'}">
                                    
                                    <!-- أزرار الاختيار والمعاينة -->
                                    <button onclick="previewGiftProduct('${b.id}')" class="absolute top-2 left-2 w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-gray-300 hover:text-[#D4AF37] z-10"><i class="fa-solid fa-eye"></i></button>
                                    ${isSelected ? '<div class="absolute top-2 right-2 bg-[#D4AF37] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs"><i class="fa-solid fa-check"></i></div>' : ''}
                                    
                                    <div onclick="selectGiftBox('${b.id}')" class="cursor-pointer pt-2">
                                        <img src="${(b.images && b.images[0]) || b.image || ''}" class="w-24 h-24 object-contain mx-auto rounded-xl bg-white p-1">
                                        <div class="space-y-1 mt-3">
                                            <p class="font-bold text-sm text-white line-clamp-1">${b.name}</p>
                                            <p class="text-[#D4AF37] font-black text-sm">${(b.price || 0).toLocaleString()} دج</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<div class="col-span-2 text-center text-gray-500 py-10 bg-black/40 rounded-xl border border-gray-800">لا توجد علب مسجلة حالياً.</div>'}
                    </div>
                </div>
            `;
            break;

        case 3:
            let availableProducts = state.products.filter(p => {
                const cat = (p.category || '').toLowerCase().trim();
                return cat !== 'علب' && cat !== 'علبة' && cat !== 'تغليف' && cat !== 'هدايا' && !cat.includes('هدية');
            });
            
            const uniqueCategories = ['الكل', ...new Set(availableProducts.map(p => p.category || 'أخرى'))];
            if (activeProductCategory !== 'الكل') {
                availableProducts = availableProducts.filter(p => (p.category || 'أخرى') === activeProductCategory);
            }

            html = `
                <div class="space-y-4 animate-fade-in flex flex-col h-[65vh]">
                    <div class="text-center mb-2">
                        <h4 class="font-black text-lg text-white">2. املأ العلبة بالمنتجات 🎁</h4>
                    </div>
                    
                    <div class="bg-gray-900 p-3 rounded-xl border border-[#D4AF37]/30 flex justify-between items-center shadow-md">
                        <div class="text-right">
                            <p class="font-black text-lg text-[#D4AF37]">${currentTotal.toLocaleString()} دج</p>
                        </div>
                        <span class="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-lg text-xs font-bold border border-[#D4AF37]/50">
                            ${giftData.selectedProducts.reduce((sum, item) => sum + item.qty, 0)} منتجات
                        </span>
                    </div>

                    <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        ${uniqueCategories.map(cat => `
                            <button onclick="setActiveGiftCategory('${cat}')" class="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition border ${activeProductCategory === cat ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-gray-400 border-gray-800 hover:border-gray-600'}">
                                ${cat}
                            </button>
                        `).join('')}
                    </div>

                    <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        ${availableProducts.map(p => {
                            const existing = giftData.selectedProducts.find(item => item.id === p.id);
                            const qty = existing ? existing.qty : 0;
                            const isAdded = qty > 0;
                            return `
                                <div class="flex items-center justify-between bg-black/60 p-3 rounded-2xl border transition ${isAdded ? 'border-[#D4AF37]/80 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-gray-800'}">
                                    <div class="flex items-center gap-3 flex-1 relative">
                                        <button onclick="previewGiftProduct('${p.id}')" class="absolute -top-2 -right-1 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center text-gray-300 hover:text-[#D4AF37] z-10 shadow-sm"><i class="fa-solid fa-eye text-[10px]"></i></button>
                                        <div class="w-12 h-12 bg-white rounded-xl flex-shrink-0 p-1 cursor-pointer" onclick="previewGiftProduct('${p.id}')">
                                            <img src="${(p.images && p.images[0]) || p.image || ''}" class="w-full h-full object-contain rounded-lg">
                                        </div>
                                        <div>
                                            <p class="font-bold text-xs text-white line-clamp-1">${p.name}</p>
                                            <p class="text-[#D4AF37] font-black text-xs mt-1">${(p.price || 0).toLocaleString()} دج</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
                                        <button onclick="updateGiftProductQty('${p.id}', -1)" class="w-7 h-7 bg-gray-800 text-white rounded-md flex items-center justify-center font-bold">-</button>
                                        <span class="w-5 text-center font-bold text-xs text-white">${qty}</span>
                                        <button onclick="updateGiftProductQty('${p.id}', 1)" class="w-7 h-7 bg-[#D4AF37] text-black rounded-md flex items-center justify-center font-bold">+</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            break;

        case 4:
            // 🔴 4. جلب أشكال التغليف الديناميكية
            const wrappings = (giftConfig.wrappings && giftConfig.wrappings.length > 0) 
                ? giftConfig.wrappings 
                : [
                    { id: 'w1', name: 'تغليف أسود ملكي', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=200&auto=format&fit=crop', price: 200 },
                    { id: 'w2', name: 'تغليف أحمر فاخر', image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=200&auto=format&fit=crop', price: 300 }
                ];

            html = `
                <div class="space-y-6 animate-fade-in max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div class="text-center mb-4">
                        <h4 class="font-black text-lg text-white">3. اللمسات الأخيرة 🎀</h4>
                    </div>

                    <div class="space-y-3">
                        <label class="block text-sm font-bold text-[#D4AF37]">اختر شكل التغليف الخارجي:</label>
                        <div class="grid grid-cols-2 gap-3">
                            ${wrappings.map(w => {
                                const isSelected = giftData.selectedWrapping && giftData.selectedWrapping.id === w.id;
                                return `
                                <div onclick="selectWrapping('${w.id}', '${w.name}', ${w.price}, '${w.image}')" class="bg-black/50 p-2 rounded-2xl border cursor-pointer transition text-center relative ${isSelected ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)] bg-[#D4AF37]/10' : 'border-gray-800 hover:border-gray-600'}">
                                    <img src="${w.image}" class="w-full h-24 object-cover rounded-xl mb-2 border border-gray-800">
                                    <p class="font-bold text-xs text-white">${w.name}</p>
                                    <p class="text-[#D4AF37] text-[10px] font-bold">${w.price > 0 ? '+'+w.price+' دج' : 'مجاني'}</p>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="space-y-2 pt-4 border-t border-gray-800">
                        <label class="block text-sm font-bold text-[#D4AF37]">رسالة بطاقة الإهداء (تُطبع داخل الهدية):</label>
                        <textarea oninput="giftData.giftMessage=this.value" rows="3" placeholder="اكتب مشاعرك هنا... (مثال: كل عام وأنت بخير يا أجمل شخص...)" class="w-full bg-black border border-gray-700 p-4 rounded-xl text-sm text-white outline-none focus:border-[#D4AF37] transition">${giftData.giftMessage}</textarea>
                    </div>
                </div>
            `;
            break;

        case 5:
            html = `
                <div class="space-y-6 animate-fade-in overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
                    <div class="text-center mb-4">
                        <h4 class="font-black text-lg text-white">4. أين نرسل الهدية؟ 🚚</h4>
                        <p class="text-xs text-gray-400">سنحسب تكلفة التوصيل في الخطوة القادمة</p>
                    </div>

                    <div class="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-800">
                            <div><label class="text-[10px] text-gray-500 font-bold block mb-1">اسم المُرسل (أنت)</label><input type="text" id="g-sender-name" value="${giftData.senderName}" oninput="giftData.senderName=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            <div><label class="text-[10px] text-gray-500 font-bold block mb-1">رقمك للتأكيد</label><input type="tel" id="g-sender-phone" value="${giftData.senderPhone}" oninput="giftData.senderPhone=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">اسم المُستلم للهدية</label><input type="text" id="g-receiver-name" value="${giftData.receiverName}" oninput="giftData.receiverName=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            <div><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">رقم المستلم</label><input type="tel" id="g-receiver-phone" value="${giftData.receiverPhone}" oninput="giftData.receiverPhone=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            
                            <div class="md:col-span-2"><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">ولاية المستلم *</label>
                                <select id="g-wilaya" onchange="giftData.wilaya=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37] cursor-pointer">
                                    <option value="">اختر الولاية لحساب التوصيل...</option>
                                    ${state.WILAYAS.map(w => `<option value="${w.code}" ${giftData.wilaya === w.code ? 'selected' : ''}>${w.code} -${w.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="text-[10px] text-[#D4AF37] font-bold block mb-2">طريقة التوصيل للهدية *</label>
                                <div class="flex gap-3">
                                    <div id="btn-ship-desk" onclick="setGiftShippingType('desk')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${giftData.shippingType === 'desk' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-store"></i> للمكتب
                                    </div>
                                    <div id="btn-ship-home" onclick="setGiftShippingType('home')" class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${giftData.shippingType === 'home' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <i class="fa-solid fa-house"></i> لباب المنزل
                                    </div>
                                </div>
                            </div>
                            
                            <div class="md:col-span-2"><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">البلدية أو العنوان الدقيق</label><input type="text" id="g-commune" value="${giftData.commune}" oninput="giftData.commune=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 6:
            const shipCost = giftData.wilaya ? calculateShippingCost(giftData.wilaya, state.WILAYAS, giftData.shippingType) : 0;
            const grandTotal = currentTotal + shipCost;

            // 🔴 5. التحقق من الحد الأدنى للطلب المسموح به
            const minOrderAmount = giftConfig.minOrder || 0;
            let reviewHtml = `
                <div class="space-y-5 animate-fade-in pb-2">
                    <div class="text-center mb-4">
                        <i class="fa-solid fa-receipt text-4xl text-[#D4AF37] mb-2"></i>
                        <h4 class="font-black text-lg text-white">5. المراجعة النهائية</h4>
                    </div>

                    <div class="bg-black p-5 rounded-2xl border border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] space-y-4 relative overflow-hidden">
                        
                        <div class="space-y-2 text-sm text-gray-300 border-b border-gray-800 pb-4 relative z-10">
                            <div class="flex justify-between items-center">
                                <span>العلبة (${giftData.selectedBox ? giftData.selectedBox.name : 'بدون'}):</span>
                                <span class="font-bold text-white">${giftData.selectedBox ? (giftData.selectedBox.price || 0).toLocaleString() : 0} دج</span>
                            </div>
                            <div class="flex justify-between items-start">
                                <span>المنتجات (${giftData.selectedProducts.length}):</span>
                                <div class="text-left font-bold text-white text-[11px] text-gray-400">
                                    ${giftData.selectedProducts.map(i => `<div>${i.name} (x${i.qty})</div>`).join('') || 'لا يوجد'}
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span>التغليف (${giftData.selectedWrapping ? giftData.selectedWrapping.name : 'بدون'}):</span>
                                <span class="font-bold text-white">${giftData.selectedWrapping ? giftData.selectedWrapping.price : 0} دج</span>
                            </div>
                            <div class="flex justify-between items-center text-[#D4AF37] bg-[#D4AF37]/10 p-2 rounded-lg mt-2">
                                <span>التوصيل (${giftData.shippingType === 'home' ? 'للمنزل' : 'للمكتب'} إلى ${giftData.wilaya}):</span>
                                <span class="font-bold">${shipCost.toLocaleString()} دج</span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center pt-2 relative z-10">
                            <span class="text-lg font-black text-white">المبلغ النهائي للطلبية:</span>
                            <span class="text-2xl font-black text-[#D4AF37]">${grandTotal.toLocaleString()} دج</span>
                        </div>
            `;
            
            // تحذير الحد الأدنى
            if (minOrderAmount > 0 && grandTotal < minOrderAmount) {
                reviewHtml += `
                    <div class="mt-4 p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-center">
                        <p class="text-red-400 text-xs font-bold mb-1"><i class="fa-solid fa-triangle-exclamation"></i> عذراً، لم تصل للحد الأدنى المسموح به!</p>
                        <p class="text-gray-300 text-[10px]">الحد الأدنى لطلبات الهدايا هو ${minOrderAmount.toLocaleString()} دج. أضف منتجات أخرى للاستمرار.</p>
                    </div>
                `;
                // إخفاء زر التأكيد مؤقتاً
                nextBtn.classList.add('hidden');
            } else {
                nextBtn.classList.remove('hidden');
            }

            reviewHtml += `</div></div>`;
            html = reviewHtml;
            break;
    }

    container.innerHTML = html;
}

// ======================= نافذة معاينة المنتج =======================
export function previewGiftProduct(productId) {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    const images = (prod.images && prod.images.length > 0) ? prod.images : (prod.image ? [prod.image] : []);
    const imagesHtml = images.map(img => `<img src="${img}" class="min-w-full h-48 object-contain bg-white rounded-xl snap-center p-1">`).join('');
    
    const isBox = (prod.category || '').toLowerCase().trim() === 'علب' || (prod.category || '').toLowerCase().trim() === 'علبة';
    
    const modalHtml = `
        <div id="gift-preview-modal" class="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col p-5 animate-fade-in rounded-3xl">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-[#D4AF37] font-black text-lg line-clamp-1">${prod.name}</h3>
                <button onclick="document.getElementById('gift-preview-modal').remove()" class="w-8 h-8 bg-gray-800 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-4 pb-4">
                <div class="flex gap-2 overflow-x-auto snap-x custom-scrollbar pb-2">
                    ${imagesHtml}
                </div>
                
                <div class="flex justify-between items-center border-b border-gray-800 pb-3">
                    <p class="text-[#D4AF37] font-black text-2xl">${(prod.price || 0).toLocaleString()} دج</p>
                    <span class="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full font-bold">${prod.category || 'عام'}</span>
                </div>
                
                <div class="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    ${prod.desc || 'لا توجد تفاصيل إضافية لهذا المنتج.'}
                </div>
            </div>
            
            <div class="pt-3 border-t border-gray-800">
                ${isBox ? 
                    `<button onclick="selectGiftBox('${prod.id}'); document.getElementById('gift-preview-modal').remove()" class="w-full gold-gradient text-black font-black py-3.5 rounded-xl text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)]">اختيار هذه العلبة <i class="fa-solid fa-box-open ml-1"></i></button>` 
                    : 
                    `<button onclick="updateGiftProductQty('${prod.id}', 1); document.getElementById('gift-preview-modal').remove()" class="w-full gold-gradient text-black font-black py-3.5 rounded-xl text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)]">إضافة للهدية <i class="fa-solid fa-cart-plus ml-1"></i></button>`
                }
            </div>
        </div>
    `;
    document.getElementById('gift-wizard-content').insertAdjacentHTML('beforeend', modalHtml);
}

// ======================= دوال التفاعل =======================
export function setActiveGiftCategory(cat) { activeProductCategory = cat; renderGiftStep(); }
export function setGiftRecipient(r) { giftData.recipient = r; nextGiftStep(); }
export function selectGiftBox(boxId) { giftData.selectedBox = state.products.find(p => p.id === boxId); nextGiftStep(); }
export function selectWrapping(id, name, price, image) { giftData.selectedWrapping = { id, name, price, image }; renderGiftStep(); }

export function setGiftShippingType(type) {
    giftData.shippingType = type;
    const activeClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]";
    const inactiveClass = "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition border-gray-700 bg-black text-gray-400";
    document.getElementById('btn-ship-desk').className = type === 'desk' ? activeClass : inactiveClass;
    document.getElementById('btn-ship-home').className = type === 'home' ? activeClass : inactiveClass;
}

export function updateGiftProductQty(prodId, delta) {
    const prod = state.products.find(p => p.id === prodId);
    if (!prod) return;
    const existing = giftData.selectedProducts.find(item => item.id === prodId);
    if (delta > 0) {
        if (existing) existing.qty += 1;
        else giftData.selectedProducts.push({ id: prod.id, name: prod.name, price: prod.price, qty: 1 });
    } else if (delta < 0 && existing) {
        existing.qty -= 1;
        if (existing.qty <= 0) giftData.selectedProducts = giftData.selectedProducts.filter(item => item.id !== prodId);
    }
    renderGiftStep();
}

export function nextGiftStep() {
    if (currentGiftStep === 1 && !giftData.recipient) { alert('يرجى تحديد لمن هذه الهدية.'); return; }
    if (currentGiftStep === 2 && !giftData.selectedBox) { alert('يرجى اختيار صندوق الهدية.'); return; }
    if (currentGiftStep === 3 && giftData.selectedProducts.length === 0) { alert('العلبة فارغة! يرجى إضافة منتج واحد على الأقل.'); return; }
    if (currentGiftStep === 4 && !giftData.selectedWrapping) { alert('يرجى اختيار شكل التغليف الخارجي للهدية.'); return; }
    
    if (currentGiftStep === 5) {
        giftData.senderName = document.getElementById('g-sender-name')?.value.trim() || giftData.senderName;
        giftData.senderPhone = document.getElementById('g-sender-phone')?.value.trim() || giftData.senderPhone;
        giftData.receiverName = document.getElementById('g-receiver-name')?.value.trim() || giftData.receiverName;
        giftData.receiverPhone = document.getElementById('g-receiver-phone')?.value.trim() || giftData.receiverPhone;
        giftData.wilaya = document.getElementById('g-wilaya')?.value || giftData.wilaya;
        giftData.commune = document.getElementById('g-commune')?.value.trim() || giftData.commune;

        if (!giftData.senderName || !giftData.senderPhone || !giftData.receiverName || !giftData.receiverPhone || !giftData.wilaya || !giftData.commune) {
            alert('تنبيه ⚠️\nيرجى إكمال جميع معلومات الإرسال والولاية لحساب الشحن بنجاح!'); 
            return;
        }
    }
    
    if (currentGiftStep === TOTAL_STEPS) { submitGiftOrder(); return; }
    currentGiftStep++;
    renderGiftStep();
}

export function prevGiftStep() {
    if (currentGiftStep > 1) { currentGiftStep--; renderGiftStep(); }
}

export function submitGiftOrder() {
    const wilayaObj = state.WILAYAS.find(w => w.code === giftData.wilaya);
    const shipCost = calculateShippingCost(giftData.wilaya, state.WILAYAS, giftData.shippingType);
    const prodTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const boxPrice = giftData.selectedBox ? (giftData.selectedBox.price || 0) : 0;
    const wrapPrice = giftData.selectedWrapping ? (giftData.selectedWrapping.price || 0) : 0;
    const grandTotal = prodTotal + boxPrice + wrapPrice + shipCost;
    
    const itemsSummary = giftData.selectedProducts.map(i => `${i.name} (x${i.qty})`).join(' + ');
    const fullProductDescription = `🎁 طلب هدية VIP:
- المستلم: ${giftData.recipient}
- العلبة: ${giftData.selectedBox ? giftData.selectedBox.name : 'بدون'}
- المنتجات: ${itemsSummary}
- التغليف: ${giftData.selectedWrapping ? giftData.selectedWrapping.name : 'بدون'}
- الرسالة: "${giftData.giftMessage || 'بدون رسالة'}"
- المُرسل: ${giftData.senderName} (${giftData.senderPhone})
- نوع التوصيل: ${giftData.shippingType === 'home' ? 'للمنزل' : 'للمكتب'}`;

    const newOrder = {
        customer: giftData.receiverName,
        phone: giftData.receiverPhone || giftData.senderPhone,
        wilaya: wilayaObj ? wilayaObj.name : giftData.wilaya,
        commune: giftData.commune,
        product: fullProductDescription,
        total: grandTotal,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    if (typeof window.db !== 'undefined') {
        window.db.collection("orders").add(newOrder).then(() => {
            closeGiftBuilder();
            showCustomAlert('تم استلام طلب الهدية بنجاح! 🎉', 'سنتصل بك (بالمُرسل) قريباً لتأكيد الطلب.', true);
        }).catch(err => showCustomAlert('خطأ', 'تعذر إرسال الطلب: ' + err.message, false));
    }
}

// Window Bindings للعمل مع HTML
window.openGiftBuilder = openGiftBuilder;
window.closeGiftBuilder = closeGiftBuilder;
window.setGiftRecipient = setGiftRecipient;
window.selectGiftBox = selectGiftBox;
window.updateGiftProductQty = updateGiftProductQty;
window.setActiveGiftCategory = setActiveGiftCategory;
window.selectWrapping = selectWrapping;
window.setGiftShippingType = setGiftShippingType;
window.previewGiftProduct = previewGiftProduct;
window.nextGiftStep = nextGiftStep;
window.prevGiftStep = prevGiftStep;
