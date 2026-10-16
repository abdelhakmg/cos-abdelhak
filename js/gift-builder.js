// --- ملف js/gift-builder.js ---

import { state } from './store/state.js';
import { showCustomAlert, calculateShippingCost, safeCall } from './utils/helpers.js';

let currentGiftStep = 1;
const TOTAL_STEPS = 5; // قلصنا الخطوات لـ 5 لتكون أسرع وأكثر متعة

let giftData = {
    recipient: 'شخص عزيز',
    selectedBox: null,
    selectedProducts: [],
    wrappingColor: 'ذهبي ملكي',
    giftMessage: '',
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    wilaya: '',
    commune: ''
};

export function openGiftBuilder() {
    currentGiftStep = 1;
    giftData = { 
        recipient: 'شخص عزيز', selectedBox: null, selectedProducts: [], 
        wrappingColor: 'ذهبي ملكي', giftMessage: '', senderName: '', senderPhone: '', 
        receiverName: '', receiverPhone: '', wilaya: '', commune: '' 
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

    indicator.innerText = `الخطوة ${currentGiftStep} من ${TOTAL_STEPS}`;
    prevBtn.classList.toggle('hidden', currentGiftStep === 1);

    if (currentGiftStep === TOTAL_STEPS) {
        nextBtn.innerHTML = '<i class="fa-solid fa-paper-plane mr-2"></i> تأكيد وإرسال الهدية';
        nextBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'text-white');
        nextBtn.classList.remove('gold-gradient', 'text-black');
    } else {
        nextBtn.innerHTML = 'التالي <i class="fa-solid fa-arrow-left mr-1"></i>';
        nextBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'text-white');
        nextBtn.classList.add('gold-gradient', 'text-black');
    }

    let html = '';
    const currentTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0) + (giftData.selectedBox ? giftData.selectedBox.price || 0 : 0);

    switch (currentGiftStep) {
        case 1: // الخطوة 1: المناسبة
            const recipients = ["زوجتي", "زوجي", "الأم", "الأب", "أختي", "أخي", "صديقتي", "صديقي", "شخص عزيز", "نفسي (أستحقها!)"];
            html = `
                <div class="space-y-5 animate-fade-in">
                    <div class="text-center space-y-2 mb-6">
                        <i class="fa-solid fa-champagne-glasses text-4xl text-[#D4AF37]"></i>
                        <h4 class="font-black text-xl text-white">لمن هذه الهدية الفاخرة؟</h4>
                        <p class="text-xs text-gray-400">اختر المستلم لنقوم بتخصيص التجربة من أجله</p>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                        ${recipients.map(r => `
                            <button type="button" onclick="setGiftRecipient('${r}')" class="py-3 px-2 rounded-xl border text-sm font-bold transition transform hover:scale-105 ${giftData.recipient === r ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] bg-[#D4AF37]/20 text-[#D4AF37]' : 'border-gray-700 bg-gray-900/50 text-gray-300 hover:border-gray-500'}">
                                ${r}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            break;

        case 2: // الخطوة 2: اختيار العلبة
            const boxProducts = state.products.filter(p => (p.category || '').toLowerCase().includes('علب') || (p.category || '').toLowerCase().includes('هدايا'));
            html = `
                <div class="space-y-5 animate-fade-in">
                    <div class="text-center space-y-2 mb-4">
                        <i class="fa-solid fa-box-open text-3xl text-[#D4AF37]"></i>
                        <h4 class="font-black text-lg text-white">اختر صندوق الهدية</h4>
                        <p class="text-xs text-gray-400">الانطباع الأول يبدأ من العلبة!</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        ${boxProducts.length > 0 ? boxProducts.map(b => {
                            const isSelected = giftData.selectedBox && giftData.selectedBox.id === b.id;
                            return `
                                <div onclick="selectGiftBox('${b.id}')" class="bg-gray-900 p-4 rounded-2xl border cursor-pointer transition text-center space-y-3 relative ${isSelected ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-gradient-to-b from-gray-900 to-[#D4AF37]/10' : 'border-gray-800 hover:border-gray-600'}">
                                    ${isSelected ? '<div class="absolute top-2 right-2 bg-[#D4AF37] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs"><i class="fa-solid fa-check"></i></div>' : ''}
                                    <img src="${(b.images && b.images[0]) || b.image || ''}" class="w-24 h-24 object-contain mx-auto rounded-xl drop-shadow-xl">
                                    <div class="space-y-1">
                                        <p class="font-bold text-sm text-white line-clamp-1">${b.name}</p>
                                        <p class="text-[#D4AF37] font-black text-sm">${(b.price || 0).toLocaleString()} دج</p>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<p class="col-span-2 text-center text-gray-500 py-10">لا توجد علب متوفرة حالياً.</p>'}
                    </div>
                </div>
            `;
            break;

        case 3: // الخطوة 3: تعبئة العلبة (المنتجات)
            const allowedProducts = state.products.filter(p => !((p.category || '').toLowerCase().includes('علب')));
            html = `
                <div class="space-y-4 animate-fade-in flex flex-col h-[60vh]">
                    <div class="text-center space-y-2 mb-2">
                        <i class="fa-solid fa-gifts text-3xl text-[#D4AF37]"></i>
                        <h4 class="font-black text-lg text-white">املأ العلبة بالمنتجات</h4>
                    </div>
                    
                    <!-- شريط الإجمالي اللحظي -->
                    <div class="bg-gradient-to-l from-gray-900 to-black p-4 rounded-xl border border-[#D4AF37]/30 flex justify-between items-center shadow-lg">
                        <div class="text-right">
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">إجمالي الهدية الحالي</p>
                            <p class="font-black text-xl text-[#D4AF37]">${currentTotal.toLocaleString()} <span class="text-sm">دج</span></p>
                        </div>
                        <div class="text-left">
                            <span class="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1.5 rounded-lg text-xs font-bold border border-[#D4AF37]/50">
                                <i class="fa-solid fa-cart-shopping"></i> ${giftData.selectedProducts.reduce((sum, item) => sum + item.qty, 0)} منتجات
                            </span>
                        </div>
                    </div>

                    <!-- قائمة المنتجات -->
                    <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mt-4">
                        ${allowedProducts.map(p => {
                            const existing = giftData.selectedProducts.find(item => item.id === p.id);
                            const qty = existing ? existing.qty : 0;
                            const isAdded = qty > 0;
                            return `
                                <div class="flex items-center justify-between bg-gray-900/80 p-3 rounded-2xl border transition ${isAdded ? 'border-[#D4AF37]/50 shadow-sm' : 'border-gray-800 hover:border-gray-700'}">
                                    <div class="flex items-center gap-4 flex-1">
                                        <div class="relative w-14 h-14 bg-white rounded-xl flex-shrink-0 p-1">
                                            <img src="${(p.images && p.images[0]) || p.image || ''}" class="w-full h-full object-contain rounded-lg">
                                        </div>
                                        <div>
                                            <p class="font-bold text-sm text-white line-clamp-1">${p.name}</p>
                                            <p class="text-[#D4AF37] font-black text-sm mt-0.5">${(p.price || 0).toLocaleString()} دج</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-gray-800">
                                        <button type="button" onclick="updateGiftProductQty('${p.id}', -1)" class="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center font-bold transition">-</button>
                                        <span class="w-6 text-center font-bold text-sm text-white">${qty}</span>
                                        <button type="button" onclick="updateGiftProductQty('${p.id}', 1)" class="w-8 h-8 gold-gradient text-black rounded-lg flex items-center justify-center font-bold shadow-md transition hover:opacity-90">+</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            break;

        case 4: // الخطوة 4: التغليف والرسالة
            html = `
                <div class="space-y-6 animate-fade-in">
                    <div class="text-center space-y-2 mb-4">
                        <i class="fa-solid fa-ribbon text-3xl text-[#D4AF37]"></i>
                        <h4 class="font-black text-lg text-white">اللمسات الأخيرة الفاخرة</h4>
                    </div>

                    <div class="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-4">
                        <label class="block text-sm font-bold text-gray-300"><i class="fa-solid fa-palette mr-2 text-[#D4AF37]"></i> لون شريط التغليف (Ribbon):</label>
                        <div class="grid grid-cols-2 gap-3">
                            ${["ذهبي ملكي", "أحمر قاني", "أسود أنيق", "فضي لامع"].map(c => `
                                <label class="border p-3 rounded-xl text-xs font-bold flex items-center gap-3 cursor-pointer transition ${giftData.wrappingColor === c ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black/50 text-gray-400 hover:border-gray-500'}">
                                    <input type="radio" name="wrap_color" value="${c}" ${giftData.wrappingColor === c ? 'checked' : ''} onchange="giftData.wrappingColor='${c}'; renderGiftStep()" class="hidden">
                                    <div class="w-4 h-4 rounded-full border-2 ${giftData.wrappingColor === c ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-gray-600'}"></div>
                                    <span>${c}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-3">
                        <label class="block text-sm font-bold text-gray-300"><i class="fa-solid fa-envelope-open-text mr-2 text-[#D4AF37]"></i> رسالة بطاقة الإهداء (تُطبع بعناية):</label>
                        <textarea oninput="giftData.giftMessage=this.value" rows="4" placeholder="اكتب مشاعرك هنا... (مثال: كل عام وأنتِ بخير يا أجمل شخص في حياتي ❤️)" class="w-full bg-black border border-gray-700 p-4 rounded-xl text-sm text-white outline-none focus:border-[#D4AF37] transition custom-scrollbar">${giftData.giftMessage}</textarea>
                    </div>
                </div>
            `;
            break;

        case 5: // الخطوة 5: الفاتورة وتفاصيل المستلم
            html = `
                <div class="space-y-6 animate-fade-in pb-4">
                    <!-- الفاتورة الأنيقة -->
                    <div class="bg-gradient-to-b from-[#D4AF37]/20 to-black p-5 rounded-3xl border border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)] relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 text-6xl text-[#D4AF37] opacity-10"><i class="fa-solid fa-receipt"></i></div>
                        <h4 class="font-black text-[#D4AF37] text-lg mb-4 text-center">🧾 ملخص الهدية الفاخرة</h4>
                        
                        <div class="space-y-3 text-sm text-gray-300 relative z-10">
                            <div class="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span><i class="fa-solid fa-box text-[#D4AF37] mr-1"></i> العلبة (${giftData.selectedBox ? giftData.selectedBox.name : 'بدون'}):</span>
                                <span class="font-bold text-white">${giftData.selectedBox ? (giftData.selectedBox.price || 0).toLocaleString() : 0} دج</span>
                            </div>
                            <div class="flex justify-between items-start border-b border-gray-800 pb-2">
                                <span><i class="fa-solid fa-gifts text-[#D4AF37] mr-1"></i> المنتجات (${giftData.selectedProducts.length}):</span>
                                <div class="text-left font-bold text-white">
                                    ${giftData.selectedProducts.map(i => `<div class="text-[11px] text-gray-400">${i.name} (x${i.qty})</div>`).join('') || 'لا يوجد'}
                                </div>
                            </div>
                            <div class="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span><i class="fa-solid fa-ribbon text-[#D4AF37] mr-1"></i> التغليف:</span>
                                <span class="font-bold text-white">${giftData.wrappingColor}</span>
                            </div>
                            <div class="flex justify-between items-center pt-2">
                                <span class="text-base font-black text-white">المبلغ الإجمالي للمنتجات:</span>
                                <span class="text-xl font-black text-[#D4AF37]">${currentTotal.toLocaleString()} دج</span>
                            </div>
                        </div>
                    </div>

                    <!-- فورم معلومات الإرسال -->
                    <div class="bg-gray-900 p-5 rounded-3xl border border-gray-800 space-y-5">
                        <h4 class="font-bold text-white border-b border-gray-800 pb-2"><i class="fa-solid fa-truck-fast text-[#D4AF37] mr-2"></i> معلومات الشحن والتوصيل</h4>
                        
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-xs text-gray-400 font-bold">اسم المُرسل (أنت)</label>
                                    <input type="text" id="g-sender-name" value="${giftData.senderName}" oninput="giftData.senderName=this.value" placeholder="اسمك..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-[#D4AF37] text-sm">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-xs text-gray-400 font-bold">هاتف المُرسل</label>
                                    <input type="tel" id="g-sender-phone" maxlength="10" value="${giftData.senderPhone}" oninput="giftData.senderPhone=this.value" placeholder="رقم هاتفك للتأكيد..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-[#D4AF37] text-sm">
                                </div>
                            </div>

                            <div class="bg-black/50 p-4 rounded-xl border border-gray-800 space-y-4">
                                <p class="text-xs font-bold text-[#D4AF37]"><i class="fa-solid fa-location-dot"></i> أين نرسل الهدية؟ (للمُستلم)</p>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" id="g-receiver-name" value="${giftData.receiverName}" oninput="giftData.receiverName=this.value" placeholder="اسم المستلم..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-[#D4AF37] text-sm">
                                    <input type="tel" id="g-receiver-phone" maxlength="10" value="${giftData.receiverPhone}" oninput="giftData.receiverPhone=this.value" placeholder="رقم هاتف المستلم..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-[#D4AF37] text-sm">
                                    <select id="g-wilaya" onchange="giftData.wilaya=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-[#D4AF37] text-sm">
                                        <option value="">اختر ولاية المستلم...</option>
                                        ${state.WILAYAS.map(w => `<option value="${w.code}" ${giftData.wilaya === w.code ? 'selected' : ''}>${w.code} -${w.name}</option>`).join('')}
                                    </select>
                                    <input type="text" id="g-commune" value="${giftData.commune}" oninput="giftData.commune=this.value" placeholder="البلدية أو العنوان التفصيلي..." class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white outline-none focus:border-[#D4AF37] text-sm">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
    }

    container.innerHTML = html;
}

export function setGiftRecipient(r) { giftData.recipient = r; renderGiftStep(); }
export function selectGiftBox(boxId) { 
    giftData.selectedBox = state.products.find(p => p.id === boxId); 
    nextGiftStep(); // الانتقال التلقائي للخطوة التالية لتسريع العملية
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
    if (currentGiftStep === 2 && !giftData.selectedBox) {
        showCustomAlert('تنبيه', 'يرجى اختيار صندوق الهدية أولاً ليليق بهديتك الفاخرة!', false);
        return;
    }
    if (currentGiftStep === 3 && giftData.selectedProducts.length === 0) {
        showCustomAlert('تنبيه', 'العلبة فارغة! يرجى إضافة منتج واحد على الأقل.', false);
        return;
    }
    
    if (currentGiftStep === TOTAL_STEPS) { submitGiftOrder(); return; }
    currentGiftStep++;
    renderGiftStep();
}

export function prevGiftStep() {
    if (currentGiftStep > 1) { currentGiftStep--; renderGiftStep(); }
}

export function submitGiftOrder() {
    if (!giftData.senderName || !giftData.senderPhone || !giftData.receiverName || !giftData.receiverPhone || !giftData.wilaya || !giftData.commune) {
        showCustomAlert('تنبيه ⚠️', 'يرجى إكمال جميع تفاصيل الإرسال والشحن!', false);
        return;
    }

    if (typeof window.isValidDzPhone === 'function' && (!window.isValidDzPhone(giftData.senderPhone) || !window.isValidDzPhone(giftData.receiverPhone))) {
        showCustomAlert('رقم الهاتف غير صحيح', 'يرجى التأكد من أن أرقام الهواتف جزائرية وتتكون من 10 أرقام.', false);
        return;
    }

    const wilayaObj = state.WILAYAS.find(w => w.code === giftData.wilaya);
    const shipCost = calculateShippingCost(giftData.wilaya, state.WILAYAS, 'home');
    const prodTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const boxPrice = giftData.selectedBox ? (giftData.selectedBox.price || 0) : 0;
    
    const itemsSummary = giftData.selectedProducts.map(i => `${i.name} (x${i.qty})`).join(' + ');
    const fullProductDescription = `🎁 طلب هدية VIP:
- المستلم: ${giftData.recipient}
- العلبة: ${giftData.selectedBox ? giftData.selectedBox.name : 'بدون'}
- المنتجات: ${itemsSummary}
- التغليف: ${giftData.wrappingColor}
- الرسالة: "${giftData.giftMessage || 'بدون رسالة'}"
- المُرسل: ${giftData.senderName} (${giftData.senderPhone})`;

    const newOrder = {
        customer: giftData.receiverName,
        phone: giftData.receiverPhone, // هاتف المستلم لشركة التوصيل
        wilaya: wilayaObj ? wilayaObj.name : giftData.wilaya,
        commune: giftData.commune,
        product: fullProductDescription,
        total: prodTotal + boxPrice + shipCost,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    if (typeof window.db !== 'undefined') {
        window.db.collection("orders").add(newOrder).then(() => {
            closeGiftBuilder();
            showCustomAlert('تم إرسال هديتك بنجاح! 🎉', 'سنتصل بك (بالمُرسل) قريباً لتأكيد الطلب وتجهيز الهدية بأبهى حلة.', true);
        }).catch(err => showCustomAlert('خطأ', 'تعذر إرسال الطلب: ' + err.message, false));
    }
}

// Window Bindings للعمل مع HTML
window.openGiftBuilder = openGiftBuilder;
window.closeGiftBuilder = closeGiftBuilder;
window.setGiftRecipient = setGiftRecipient;
window.selectGiftBox = selectGiftBox;
window.updateGiftProductQty = updateGiftProductQty;
window.nextGiftStep = nextGiftStep;
window.prevGiftStep = prevGiftStep;
