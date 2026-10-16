// --- ملف js/gift-builder.js ---

import { state } from './store/state.js';
import { showCustomAlert, calculateShippingCost, safeCall } from './utils/helpers.js';

let currentGiftStep = 1;
const TOTAL_STEPS = 6; // أضفنا خطوة لتفصل بين المعلومات والفاتورة النهائية
let activeProductCategory = 'الكل'; // لحفظ القسم النشط حالياً في نافذة المنتجات

let giftData = {
    recipient: '',
    selectedBox: null,
    selectedProducts: [],
    selectedWrapping: null, // سيحفظ كائن التغليف (صورة + اسم + سعر)
    giftMessage: '',
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    wilaya: '',
    commune: '',
    shippingType: 'desk' // افتراضياً للمكتب
};

export function openGiftBuilder() {
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
    const storeSlogan = state.storeSettings.slogan || "يبدو أن أحدهم سيغدو سعيداً اليوم";

    switch (currentGiftStep) {
        case 1: // شاشة الترحيب والمستلم
            const recipients = ["زوجتي", "زوجي", "الأم", "الأب", "أختي", "أخي", "صديقتي", "صديقي", "شخص عزيز", "نفسي"];
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

        case 2: // اختيار العلبة (صارم جداً: علب فقط)
            // الفلترة الذكية: يجب أن يكون القسم "علب" أو "علبة" فقط لكي لا تظهر الهدايا الجاهزة
            const boxProducts = state.products.filter(p => {
                const cat = (p.category || '').toLowerCase().trim();
                return cat === 'علب' || cat === 'علبة' || cat === 'صناديق';
            });
            html = `
                <div class="space-y-5 animate-fade-in">
                    <div class="text-center space-y-2 mb-4">
                        <h4 class="font-black text-lg text-white">1. اختر صندوق الهدية 📦</h4>
                        <p class="text-xs text-gray-400">الانطباع الأول يبدأ من العلبة!</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        ${boxProducts.length > 0 ? boxProducts.map(b => {
                            const isSelected = giftData.selectedBox && giftData.selectedBox.id === b.id;
                            return `
                                <div onclick="selectGiftBox('${b.id}')" class="bg-gray-900 p-4 rounded-2xl border cursor-pointer transition text-center space-y-3 relative ${isSelected ? 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-gradient-to-b from-gray-900 to-[#D4AF37]/10' : 'border-gray-800 hover:border-gray-600'}">
                                    ${isSelected ? '<div class="absolute top-2 right-2 bg-[#D4AF37] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs"><i class="fa-solid fa-check"></i></div>' : ''}
                                    <img src="${(b.images && b.images[0]) || b.image || ''}" class="w-24 h-24 object-contain mx-auto rounded-xl bg-white p-1">
                                    <div class="space-y-1">
                                        <p class="font-bold text-sm text-white line-clamp-1">${b.name}</p>
                                        <p class="text-[#D4AF37] font-black text-sm">${(b.price || 0).toLocaleString()} دج</p>
                                    </div>
                                </div>
                            `;
                        }).join('') : '<div class="col-span-2 text-center text-gray-500 py-10 bg-black/40 rounded-xl border border-gray-800">لا توجد علب فارغة مسجلة في المتجر حالياً. يرجى إضافة منتجات في قسم "علب".</div>'}
                    </div>
                </div>
            `;
            break;

        case 3: // المنتجات مع التبويبات (Categories Tabs)
            // استخراج الأقسام المتاحة من المنتجات (باستثناء العلب والتغليف)
            let availableProducts = state.products.filter(p => {
                const cat = (p.category || '').toLowerCase().trim();
                return cat !== 'علب' && cat !== 'علبة' && cat !== 'تغليف';
            });
            
            const uniqueCategories = ['الكل', ...new Set(availableProducts.map(p => p.category || 'أخرى'))];
            
            // فلترة المنتجات حسب التبويب النشط
            if (activeProductCategory !== 'الكل') {
                availableProducts = availableProducts.filter(p => (p.category || 'أخرى') === activeProductCategory);
            }

            html = `
                <div class="space-y-4 animate-fade-in flex flex-col h-[65vh]">
                    <div class="text-center mb-2">
                        <h4 class="font-black text-lg text-white">2. املأ العلبة بالمنتجات 🎁</h4>
                    </div>
                    
                    <!-- الإجمالي اللحظي -->
                    <div class="bg-gray-900 p-3 rounded-xl border border-[#D4AF37]/30 flex justify-between items-center shadow-md">
                        <div class="text-right">
                            <p class="font-black text-lg text-[#D4AF37]">${currentTotal.toLocaleString()} دج</p>
                        </div>
                        <span class="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-lg text-xs font-bold border border-[#D4AF37]/50">
                            ${giftData.selectedProducts.reduce((sum, item) => sum + item.qty, 0)} منتجات
                        </span>
                    </div>

                    <!-- 🌟 تبويبات الأقسام (تصميم أفقي قابل للتمرير) -->
                    <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        ${uniqueCategories.map(cat => `
                            <button onclick="setActiveGiftCategory('${cat}')" class="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition border ${activeProductCategory === cat ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-black text-gray-400 border-gray-800 hover:border-gray-600'}">
                                ${cat}
                            </button>
                        `).join('')}
                    </div>

                    <!-- قائمة المنتجات المفلترة -->
                    <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        ${availableProducts.map(p => {
                            const existing = giftData.selectedProducts.find(item => item.id === p.id);
                            const qty = existing ? existing.qty : 0;
                            const isAdded = qty > 0;
                            return `
                                <div class="flex items-center justify-between bg-black/60 p-3 rounded-2xl border transition ${isAdded ? 'border-[#D4AF37]/80 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-gray-800'}">
                                    <div class="flex items-center gap-3 flex-1">
                                        <div class="w-12 h-12 bg-white rounded-xl flex-shrink-0 p-1">
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

        case 4: // التغليف والرسالة (بالصور)
            // سنسحب أشكال التغليف من الإعدادات (أو نضع بيانات تجريبية مؤقتة حتى نبرمج لوحة التحكم)
            const wrappings = (state.storeSettings && state.storeSettings.wrappings) ? state.storeSettings.wrappings : [
                { id: 'w1', name: 'تغليف كلاسيكي أسود', image: 'https://via.placeholder.com/150/000000/FFFFFF?text=Black', price: 0 },
                { id: 'w2', name: 'تغليف ذهبي فاخر', image: 'https://via.placeholder.com/150/D4AF37/000000?text=Gold', price: 200 }
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
                                    <img src="${w.image}" class="w-full h-24 object-cover rounded-xl mb-2">
                                    <p class="font-bold text-xs text-white">${w.name}</p>
                                    <p class="text-[#D4AF37] text-[10px] font-bold">${w.price > 0 ? '+'+w.price+' دج' : 'مجاني'}</p>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="space-y-2 pt-4 border-t border-gray-800">
                        <label class="block text-sm font-bold text-[#D4AF37]">رسالة بطاقة الإهداء (تُطبع داخل الهدية):</label>
                        <textarea oninput="giftData.giftMessage=this.value" rows="3" placeholder="اكتب مشاعرك هنا... (مثال: كل عام وأنت بخير يا أجمل شخص...)" class="w-full bg-black border border-gray-700 p-4 rounded-xl text-sm text-white outline-none focus:border-[#D4AF37] transition"></textarea>
                    </div>
                </div>
            `;
            break;

        case 5: // معلومات التوصيل (قبل الفاتورة)
            html = `
                <div class="space-y-6 animate-fade-in overflow-y-auto max-h-[65vh] pr-2 custom-scrollbar">
                    <div class="text-center mb-4">
                        <h4 class="font-black text-lg text-white">4. أين نرسل الهدية؟ 🚚</h4>
                        <p class="text-xs text-gray-400">سنحسب تكلفة التوصيل بناءً على العنوان</p>
                    </div>

                    <div class="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-4">
                        <!-- المُرسل -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-800">
                            <div><label class="text-[10px] text-gray-500 font-bold block mb-1">اسم المُرسل (أنت)</label><input type="text" id="g-sender-name" value="${giftData.senderName}" oninput="giftData.senderName=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            <div><label class="text-[10px] text-gray-500 font-bold block mb-1">رقمك للتأكيد</label><input type="tel" id="g-sender-phone" value="${giftData.senderPhone}" oninput="giftData.senderPhone=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                        </div>

                        <!-- المُستلم -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">اسم المُستلم للهدية</label><input type="text" id="g-receiver-name" value="${giftData.receiverName}" oninput="giftData.receiverName=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            <div><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">رقم المستلم</label><input type="tel" id="g-receiver-phone" value="${giftData.receiverPhone}" oninput="giftData.receiverPhone=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                            
                            <div class="md:col-span-2"><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">ولاية المستلم *</label>
                                <select id="g-wilaya" onchange="giftData.wilaya=this.value; renderGiftStep()" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]">
                                    <option value="">اختر الولاية لحساب التوصيل...</option>
                                    ${state.WILAYAS.map(w => `<option value="${w.code}" ${giftData.wilaya === w.code ? 'selected' : ''}>${w.code} -${w.name}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="text-[10px] text-[#D4AF37] font-bold block mb-2">طريقة التوصيل للهدية *</label>
                                <div class="flex gap-3">
                                    <label class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${giftData.shippingType === 'desk' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <input type="radio" name="g_ship_type" value="desk" ${giftData.shippingType === 'desk' ? 'checked' : ''} onchange="giftData.shippingType=this.value; renderGiftStep()" class="hidden">
                                        <i class="fa-solid fa-store"></i> استلام من مكتب ياليدين
                                    </label>
                                    <label class="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer text-xs font-bold transition ${giftData.shippingType === 'home' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-700 bg-black text-gray-400'}">
                                        <input type="radio" name="g_ship_type" value="home" ${giftData.shippingType === 'home' ? 'checked' : ''} onchange="giftData.shippingType=this.value; renderGiftStep()" class="hidden">
                                        <i class="fa-solid fa-house"></i> توصيل لباب المنزل
                                    </label>
                                </div>
                            </div>
                            
                            <div class="md:col-span-2"><label class="text-[10px] text-[#D4AF37] font-bold block mb-1">البلدية أو العنوان الدقيق</label><input type="text" id="g-commune" value="${giftData.commune}" oninput="giftData.commune=this.value" class="w-full bg-black border border-gray-700 p-3 rounded-xl text-white text-sm outline-none focus:border-[#D4AF37]"></div>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 6: // الفاتورة النهائية (بعد حساب كل شيء)
            const shipCost = giftData.wilaya ? calculateShippingCost(giftData.wilaya, state.WILAYAS, giftData.shippingType) : 0;
            const grandTotal = currentTotal + shipCost;

            html = `
                <div class="space-y-5 animate-fade-in pb-2">
                    <div class="text-center mb-4">
                        <i class="fa-solid fa-receipt text-4xl text-[#D4AF37] mb-2"></i>
                        <h4 class="font-black text-lg text-white">5. المراجعة النهائية والتأكيد</h4>
                    </div>

                    <div class="bg-black p-5 rounded-2xl border border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] space-y-4">
                        
                        <div class="space-y-2 text-sm text-gray-300 border-b border-gray-800 pb-4">
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
                            <div class="flex justify-between items-center text-[#D4AF37]">
                                <span>تكلفة التوصيل (${giftData.shippingType === 'home' ? 'للمنزل' : 'للمكتب'}):</span>
                                <span class="font-bold">${shipCost.toLocaleString()} دج</span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center pt-2">
                            <span class="text-lg font-black text-white">المبلغ النهائي للطلبية:</span>
                            <span class="text-2xl font-black text-[#D4AF37]">${grandTotal.toLocaleString()} دج</span>
                        </div>
                    </div>
                </div>
            `;
            break;
    }

    container.innerHTML = html;
}

// ======================= دوال التفاعل =======================
export function setActiveGiftCategory(cat) { activeProductCategory = cat; renderGiftStep(); }
export function setGiftRecipient(r) { giftData.recipient = r; nextGiftStep(); }
export function selectGiftBox(boxId) { giftData.selectedBox = state.products.find(p => p.id === boxId); nextGiftStep(); }
export function selectWrapping(id, name, price, image) { giftData.selectedWrapping = { id, name, price, image }; renderGiftStep(); }

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
    if (currentGiftStep === 1 && !giftData.recipient) { showCustomAlert('تنبيه', 'يرجى تحديد لمن هذه الهدية.', false); return; }
    if (currentGiftStep === 2 && !giftData.selectedBox) { showCustomAlert('تنبيه', 'يرجى اختيار صندوق الهدية.', false); return; }
    if (currentGiftStep === 3 && giftData.selectedProducts.length === 0) { showCustomAlert('تنبيه', 'العلبة فارغة! يرجى إضافة منتج واحد على الأقل.', false); return; }
    if (currentGiftStep === 4 && !giftData.selectedWrapping) { showCustomAlert('تنبيه', 'يرجى اختيار شكل التغليف الخارجي للهدية.', false); return; }
    if (currentGiftStep === 5) {
        if (!giftData.senderName || !giftData.senderPhone || !giftData.receiverName || !giftData.wilaya || !giftData.commune) {
            showCustomAlert('تنبيه', 'يرجى إكمال جميع معلومات الإرسال والولاية لحساب الشحن!', false); return;
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
window.nextGiftStep = nextGiftStep;
window.prevGiftStep = prevGiftStep;
