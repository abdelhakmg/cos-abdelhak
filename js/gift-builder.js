// 🎁 Gift Builder Wizard Modal Logic (Vanilla JS)

let currentGiftStep = 1;
let giftData = {
    recipient: 'نفسي',
    budget: 5000,
    selectedProducts: [],
    selectedBox: null,
    wrappingColor: 'ذهبي',
    giftMessage: '',
    customerName: '',
    customerPhone: '',
    customerWilaya: '',
    customerCommune: '',
    shippingType: 'home'
};

function openGiftBuilder() {
    currentGiftStep = 1;
    giftData = { 
        recipient: 'نفسي', 
        budget: 5000, 
        selectedProducts: [], 
        selectedBox: null, 
        wrappingColor: 'ذهبي', 
        giftMessage: '', 
        customerName: '', 
        customerPhone: '', 
        customerWilaya: '', 
        customerCommune: '', 
        shippingType: 'home' 
    };
    renderGiftStep();
    const modal = document.getElementById('gift-builder-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeGiftBuilder() {
    const modal = document.getElementById('gift-builder-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function renderGiftStep() {
    const container = document.getElementById('gift-wizard-content');
    const indicator = document.getElementById('gift-step-indicator');
    const prevBtn = document.getElementById('gift-prev-btn');
    const nextBtn = document.getElementById('gift-next-btn');
    if (!container) return;

    indicator.innerText = `الخطوة ${currentGiftStep} من 6`;
    prevBtn.classList.toggle('hidden', currentGiftStep === 1);

    if (currentGiftStep === 6) {
        nextBtn.innerText = 'تأكيد وإرسال الطلب 🚚';
    } else {
        nextBtn.innerHTML = 'التالي <i class="fa-solid fa-arrow-left mr-1"></i>';
    }

    let html = '';

    switch (currentGiftStep) {
        case 1:
            const recipients = ["نفسي", "زوجتي", "زوجي", "الأم", "الأب", "أخت", "أخ", "صديقتي", "صديق", "شخص عزيز"];
            html = `
                <div class="space-y-4">
                    <h4 class="font-bold text-sm text-gray-200">من هو المستلم لهذه الهدية الفاخرة؟</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        ${recipients.map(r => `
                            <button type="button" onclick="setGiftRecipient('${r}')" class="p-3 rounded-xl border text-xs font-bold transition ${giftData.recipient === r ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]' : 'border-gray-800 bg-black/40 text-white hover:border-gray-600'}">
                                ${r}
                            </button>
                        `).join('')}
                    </div>
                    <div class="bg-black/60 p-4 rounded-xl border border-gray-800 text-center">
                        <p class="text-xs text-[#D4AF37] font-bold">✨ رسالة تفاعلية: هدية رائعة لـ "${giftData.recipient}" ستترك انطباعاً لا يُنسى اليوم!</p>
                    </div>
                </div>
            `;
            break;

        case 2:
            html = `
                <div class="space-y-4">
                    <h4 class="font-bold text-sm text-gray-200">حدد الميزانية المرغوبة (بالدينار الجزائري):</h4>
                    <div class="grid grid-cols-3 gap-3">
                        ${[3000, 5000, 10000, 15000, 20000, 30000].map(b => `
                            <button type="button" onclick="setGiftBudget(${b})" class="p-3 rounded-xl border text-xs font-bold transition ${giftData.budget === b ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]' : 'border-gray-800 bg-black/40 text-white'}">
                                ${b.toLocaleString()} دج
                            </button>
                        `).join('')}
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-gray-400">أو أدخل ميزانية مخصصة:</label>
                        <input type="number" id="custom-budget-input" value="${giftData.budget}" oninput="setGiftBudget(this.value)" class="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm text-white outline-none focus:border-[#D4AF37]">
                    </div>
                </div>
            `;
            break;

        case 3:
            const allowedProducts = (typeof products !== 'undefined' ? products : []).filter(p => {
                const cat = (p.category || '').toLowerCase();
                return !cat.includes('علب') && !cat.includes('تغليف');
            });
            const currentTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const progressPercent = giftData.budget > 0 ? Math.min(Math.round((currentTotal / giftData.budget) * 100), 100) : 0;

            html = `
                <div class="space-y-4">
                    <div class="flex justify-between items-center bg-black/60 p-3 rounded-xl border border-gray-800 text-xs">
                        <span>إجمالي المنتجات: <strong class="text-[#D4AF37]">${currentTotal.toLocaleString()} دج</strong> / الميزانية: <strong>${giftData.budget.toLocaleString()} دج</strong></span>
                        <span class="${currentTotal >= giftData.budget ? 'text-red-400 font-bold' : 'text-green-400'}">${progressPercent}%</span>
                    </div>
                    <div class="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div class="h-full gold-gradient transition-all duration-300" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
                        ${allowedProducts.map(p => {
                            const existing = giftData.selectedProducts.find(item => item.id === p.id);
                            const qty = existing ? existing.qty : 0;
                            return `
                                <div class="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-gray-800 text-xs">
                                    <div class="flex items-center gap-3">
                                        <img src="${(p.images && p.images[0]) || p.image || ''}" class="w-10 h-10 object-contain rounded-lg bg-black">
                                        <div>
                                            <p class="font-bold text-white">${p.name}</p>
                                            <p class="text-[#D4AF37] font-bold">${(p.price || 0).toLocaleString()} دج</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <button type="button" onclick="updateGiftProductQty('${p.id}', -1)" class="w-7 h-7 bg-gray-800 text-white rounded-lg flex items-center justify-center font-bold">-</button>
                                        <span class="w-6 text-center font-bold">${qty}</span>
                                        <button type="button" onclick="updateGiftProductQty('${p.id}', 1)" class="w-7 h-7 bg-[#D4AF37] text-black rounded-lg flex items-center justify-center font-bold">+</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            break;

        case 4:
            const boxProducts = (typeof products !== 'undefined' ? products : []).filter(p => {
                const cat = (p.category || '').toLowerCase();
                return cat.includes('علب');
            });
            html = `
                <div class="space-y-4">
                    <h4 class="font-bold text-sm text-gray-200">اختر صندوق/علبة الهدية الفاخرة:</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                        ${boxProducts.map(b => {
                            const isSelected = giftData.selectedBox && giftData.selectedBox.id === b.id;
                            return `
                                <div onclick="selectGiftBox('${b.id}')" class="bg-black/40 p-3 rounded-2xl border cursor-pointer transition text-center space-y-2 ${isSelected ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] bg-[#D4AF37]/10' : 'border-gray-800 hover:border-gray-600'}">
                                    <img src="${(b.images && b.images[0]) || b.image || ''}" class="w-20 h-20 object-contain mx-auto rounded-xl bg-black">
                                    <p class="font-bold text-xs text-white truncate">${b.name}</p>
                                    <p class="text-[#D4AF37] font-bold text-xs">${(b.price || 0).toLocaleString()} دج</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            break;

        case 5:
            html = `
                <div class="space-y-4">
                    <h4 class="font-bold text-sm text-gray-200">تغليف الهدية وبطاقة الإهداء:</h4>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-gray-400">لون الشريط والتغليف:</label>
                        <div class="flex gap-3">
                            ${["ذهبي", "أحمر ملكي", "أسود أنيق", "وردي فاخر"].map(c => `
                                <label class="border border-gray-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer bg-black/40">
                                    <input type="radio" name="wrap_color" value="${c}" ${giftData.wrappingColor === c ? 'checked' : ''} onchange="giftData.wrappingColor='${c}'" class="accent-[#D4AF37]">
                                    <span>${c}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold mb-1 text-gray-400">رسالة بطاقة الإهداء:</label>
                        <textarea id="gift-msg-textarea" oninput="giftData.giftMessage=this.value" rows="3" class="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm text-white outline-none focus:border-[#D4AF37]" placeholder="اكتب رسالة الإهداء هنا...">${giftData.giftMessage}</textarea>
                    </div>
                </div>
            `;
            break;

        case 6:
            const prodTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const boxPrice = giftData.selectedBox ? (giftData.selectedBox.price || 0) : 0;
            const subTotalSum = prodTotal + boxPrice;

            html = `
                <div class="space-y-4 text-xs">
                    <div class="bg-black/60 p-4 rounded-2xl border border-gray-800 space-y-2">
                        <h4 class="font-bold text-[#D4AF37] border-b border-gray-800 pb-2">📋 ملخص الهدية المخصصة:</h4>
                        <p><strong>المستلم:</strong> ${giftData.recipient}</p>
                        <p><strong>المنتجات (${giftData.selectedProducts.length}):</strong> ${giftData.selectedProducts.map(i => `${i.name} (x${i.qty})`).join(', ') || 'لا توجد منتجات'}</p>
                        <p><strong>العلبة:</strong> ${giftData.selectedBox ? giftData.selectedBox.name : 'لم يتم اختيار علبة'}</p>
                        <p><strong>التغليف والشريط:</strong> ${giftData.wrappingColor}</p>
                        <p><strong>رسالة الإهداء:</strong> "${giftData.giftMessage || 'بدون رسالة'}"</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <input type="text" id="g-name" placeholder="الاسم واللقب *" class="bg-black border border-gray-800 p-3 rounded-xl text-white outline-none">
                        <input type="tel" id="g-phone" maxlength="10" placeholder="رقم الهاتف (06/07/05) *" class="bg-black border border-gray-800 p-3 rounded-xl text-white outline-none">
                        <select id="g-wilaya" class="bg-black border border-gray-800 p-3 rounded-xl text-white outline-none">
                            <option value="">اختر الولاية...</option>
                            ${(typeof WILAYAS !== 'undefined' ? WILAYAS : []).map(w => `<option value="${w.code}">${w.code} -${w.name}</option>`).join('')}
                        </select>
                        <input type="text" id="g-commune" placeholder="العنوان التفصيلي / الحي *" class="bg-black border border-gray-800 p-3 rounded-xl text-white outline-none">
                    </div>

                    <div class="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-center text-emerald-400 font-bold">
                        🚚 التوصيل متوفر والدفع عند الاستلام: كي تلحقك فريفي من بعد خلص!
                    </div>
                </div>
            `;
            break;
    }

    container.innerHTML = html;
}

function setGiftRecipient(r) {
    giftData.recipient = r;
    renderGiftStep();
}

function setGiftBudget(val) {
    giftData.budget = parseFloat(val) || 0;
    renderGiftStep();
}

function updateGiftProductQty(prodId, delta) {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const currentTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const existing = giftData.selectedProducts.find(item => item.id === prodId);

    if (delta > 0) {
        if (currentTotal + prod.price > giftData.budget) {
            showCustomAlert('تنبيه الميزانية 💰', 'عذراً، لقد وصلت إلى الحد الأقصى لميزانيتك المحددة!', false);
            return;
        }
        if (existing) {
            existing.qty += 1;
        } else {
            giftData.selectedProducts.push({ id: prod.id, name: prod.name, price: prod.price, qty: 1 });
        }
    } else if (delta < 0 && existing) {
        existing.qty -= 1;
        if (existing.qty <= 0) {
            giftData.selectedProducts = giftData.selectedProducts.filter(item => item.id !== prodId);
        }
    }
    renderGiftStep();
}

function selectGiftBox(boxId) {
    const box = products.find(p => p.id === boxId);
    if (box) {
        giftData.selectedBox = box;
        renderGiftStep();
    }
}

function nextGiftStep() {
    if (currentGiftStep === 6) {
        submitGiftOrder();
        return;
    }
    currentGiftStep++;
    renderGiftStep();
}

function prevGiftStep() {
    if (currentGiftStep > 1) {
        currentGiftStep--;
        renderGiftStep();
    }
}

function submitGiftOrder() {
    const name = document.getElementById('g-name')?.value.trim();
    const phone = document.getElementById('g-phone')?.value.trim();
    const wilayaCode = document.getElementById('g-wilaya')?.value;
    const commune = document.getElementById('g-commune')?.value.trim();

    if (!name || !wilayaCode || !commune) {
        showCustomAlert('تنبيه', 'يرجى ملء كافة معلومات الاسم والولاية والعنوان!', false);
        return;
    }
    if (typeof isValidDzPhone === 'function' && !isValidDzPhone(phone)) {
        showCustomAlert('رقم الهاتف غير صحيح', 'يرجى إدخال رقم هاتف جزائري صحيح من 10 أرقام.', false);
        return;
    }

    const wilaya = (typeof WILAYAS !== 'undefined' ? WILAYAS : []).find(w => w.code === wilayaCode);
    const prodTotal = giftData.selectedProducts.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const boxPrice = giftData.selectedBox ? (giftData.selectedBox.price || 0) : 0;
    const shipCost = wilaya ? (wilaya.homeCost || wilaya.officeCost || 500) : 500;
    const grandTotal = prodTotal + boxPrice + shipCost;

    const itemsSummary = giftData.selectedProducts.map(i => `${i.name} (x${i.qty})`).join(' + ');

    const newOrder = {
        customer: name,
        phone: phone,
        wilaya: wilaya ? wilaya.name : wilayaCode,
        commune: `${commune} (هدية مخصصة لـ: ${giftData.recipient})`,
        product: `🎁 هدية مخصصة: [العلبة: ${giftData.selectedBox ? giftData.selectedBox.name : 'بدون'}] | [المنتجات: ${itemsSummary}] | [الإهداء: ${giftData.giftMessage}]`,
        total: grandTotal,
        status: 'جديد',
        date: new Date().toLocaleDateString('ar-DZ'),
        createdAt: new Date()
    };

    db.collection("orders").add(newOrder).then(() => {
        closeGiftBuilder();
        showCustomAlert('تم إرسال هديتك بنجاح! 🎉', 'تم حفظ الهدية المخصصة وإرسالها للأدمن بنجاح. سنتصل بك قريباً!', true);
        showPage('home');
    }).catch(err => {
        showCustomAlert('خطأ', 'تعذر إرسال الطلب: ' + err.message, false);
    });
}
