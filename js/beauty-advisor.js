// --- ملف js/beauty-advisor.js ---

import { state, saveCartToLocal } from './store/state.js';
import { showCustomAlert, safeCall } from './utils/helpers.js';

let advisorStep = 0;
let userAnswers = {
    skinType: '',
    skinConcern: '',
    hairType: '',
    hairConcern: ''
};

const advisorQuestions = [
    {
        id: 'skinType',
        title: 'مرحباً بك يا جميلة ✨',
        subtitle: 'لنبدأ ببشرتك.. كيف تصفين نوعها؟',
        options: [
            { value: 'دهنية', label: 'دهنية (تلمع بسرعة)' },
            { value: 'جافة', label: 'جافة (مشدودة ومتقشرة)' },
            { value: 'مختلطة', label: 'مختلطة (تلمع في الجبهة والأنف)' },
            { value: 'حساسة', label: 'حساسة (تحمر وتتهيج بسرعة)' }
        ]
    },
    {
        id: 'skinConcern',
        title: 'رائع! 🌸',
        subtitle: 'ما هو الهدف الأساسي الذي ترغبين في معالجته ببشرتك؟',
        options: [
            { value: 'حب الشباب', label: 'حب الشباب وآثاره' },
            { value: 'تصبغات', label: 'التصبغات والبقع الداكنة' },
            { value: 'تجاعيد', label: 'التجاعيد وعلامات التقدم' },
            { value: 'مسام', label: 'المسام الواسعة' },
            { value: 'جفاف', label: 'الجفاف الشديد والبهتان' }
        ]
    },
    {
        id: 'hairType',
        title: 'جميل جداً! ننتقل لشعرك 💇‍♀️',
        subtitle: 'كيف تصفين طبيعة شعرك؟',
        options: [
            { value: 'دهني', label: 'دهني (يحتاج غسيل متكرر)' },
            { value: 'جاف', label: 'جاف ومتقصف' },
            { value: 'عادي', label: 'عادي / متوازن' },
            { value: 'مصبوغ', label: 'مصبوغ / معالج كيميائياً' }
        ]
    },
    {
        id: 'hairConcern',
        title: 'سؤال أخير ويكون روتينك جاهزاً ⏳',
        subtitle: 'ما هي المشكلة المزعجة في شعرك؟',
        options: [
            { value: 'تساقط', label: 'التساقط والفراغات' },
            { value: 'قشرة', label: 'القشرة والحكة' },
            { value: 'هيشان', label: 'الهيشان والنفشة (Frizz)' },
            { value: 'تلف', label: 'التلف والتقصف الشديد' }
        ]
    }
];

export function openBeautyAdvisor() {
    advisorStep = 0;
    userAnswers = { skinType: '', skinConcern: '', hairType: '', hairConcern: '' };
    
    const modal = document.getElementById('advisor-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    renderAdvisorStep();
}

export function closeBeautyAdvisor() {
    const modal = document.getElementById('advisor-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

export function renderAdvisorStep() {
    const container = document.getElementById('advisor-content');
    if (!container) return;

    if (advisorStep < advisorQuestions.length) {
        const q = advisorQuestions[advisorStep];
        const progress = ((advisorStep + 1) / advisorQuestions.length) * 100;
        
        container.innerHTML = `
            <div class="animate-fade-in text-center space-y-6">
                <!-- شريط التقدم -->
                <div class="w-full bg-gray-800 rounded-full h-1.5 mb-6">
                    <div class="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                </div>
                
                <h3 class="text-2xl font-black text-white gold-text">${q.title}</h3>
                <p class="text-gray-400 text-sm">${q.subtitle}</p>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    ${q.options.map(opt => `
                        <button onclick="selectAdvisorAnswer('${q.id}', '${opt.value}')" class="p-4 rounded-xl border border-gray-700 bg-gray-900/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] text-white font-bold transition transform hover:-translate-y-1 cursor-pointer">
                            ${opt.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        generateSmartRoutine();
    }
}

export function selectAdvisorAnswer(questionId, answerValue) {
    userAnswers[questionId] = answerValue;
    advisorStep++;
    renderAdvisorStep();
}

// محرك الفلترة الذكي للروتين
function generateSmartRoutine() {
    const container = document.getElementById('advisor-content');
    container.innerHTML = `<div class="flex flex-col items-center justify-center py-10 space-y-4"><i class="fa-solid fa-spinner fa-spin text-4xl text-[#D4AF37]"></i><p class="text-white font-bold text-sm">جاري تحليل إجاباتك وصناعة الروتين المثالي...</p></div>`;
    
    setTimeout(() => {
        // البحث عن المنتجات التي تطابق الكلمات المفتاحية في خصائصها أو اسمها أو وصفها
        const matchProduct = (product, keywords) => {
            const str = [
                product.name, 
                product.desc, 
                product.category,
                JSON.stringify(product.attributes || {})
            ].join(' ').toLowerCase();
            return keywords.some(k => str.includes(k.toLowerCase()));
        };

        const availableProducts = state.products.filter(p => p.inStock !== false);
        
        // جلب منتجات البشرة
        const skinKeywords = [userAnswers.skinType, userAnswers.skinConcern];
        let skinRoutine = availableProducts.filter(p => 
            (p.category && (p.category.includes('بشرة') || p.category.includes('وجه') || p.category.includes('عناية'))) && 
            matchProduct(p, skinKeywords)
        ).slice(0, 3); // أخذ أفضل 3 منتجات للبشرة

        // جلب منتجات الشعر
        const hairKeywords = [userAnswers.hairType, userAnswers.hairConcern];
        let hairRoutine = availableProducts.filter(p => 
            (p.category && (p.category.includes('شعر') || p.category.includes('عناية'))) && 
            matchProduct(p, hairKeywords)
        ).slice(0, 2); // أخذ أفضل منتجين للشعر

        const finalRoutine = [...skinRoutine, ...hairRoutine];
        window.currentGeneratedRoutine = finalRoutine; // حفظها للإضافة للسلة

        if (finalRoutine.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 space-y-4 animate-fade-in">
                    <i class="fa-solid fa-face-frown text-4xl text-gray-500"></i>
                    <h3 class="text-lg font-black text-white">عذراً يا جميلة</h3>
                    <p class="text-gray-400 text-sm">لم نجد حالياً منتجات متوفرة تطابق حالتك بدقة 100%. جربي تصفح الأقسام لتشكيلة أوسع.</p>
                    <button onclick="closeBeautyAdvisor(); safeCall('showPage', 'catalog');" class="bg-[#D4AF37] text-black font-bold px-6 py-2.5 rounded-xl mt-4">تصفح المنتجات</button>
                </div>`;
            return;
        }

        const totalPrice = finalRoutine.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        // خصم 10% ديناميكي عند أخذ الروتين كامل
        const bundleDiscount = Math.round(totalPrice * 0.10);
        const finalPrice = totalPrice - bundleDiscount;

        let html = `
            <div class="animate-fade-in space-y-6 text-right max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 rounded-full gold-gradient flex items-center justify-center text-black text-3xl mx-auto mb-3 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                        <i class="fa-solid fa-magic"></i>
                    </div>
                    <h3 class="text-xl font-black text-white">روتينك السحري جاهز! ✨</h3>
                    <p class="text-[#D4AF37] text-xs mt-1 font-bold">بناءً على إجاباتك، اخترنا لك هذه المجموعة الفعالة.</p>
                </div>

                <div class="space-y-3">
                    ${finalRoutine.map((p, idx) => `
                        <div class="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center gap-3 relative">
                            <span class="absolute -top-2 -right-2 w-6 h-6 bg-black text-[#D4AF37] border border-[#D4AF37]/50 rounded-full flex items-center justify-center text-[10px] font-black">${idx + 1}</span>
                            <img src="${(p.images && p.images[0]) || p.image}" class="w-16 h-16 object-contain bg-black rounded-xl p-1 border border-gray-800">
                            <div>
                                <h4 class="font-bold text-white text-xs line-clamp-1">${p.name}</h4>
                                <p class="text-gray-400 text-[10px] line-clamp-1 mt-0.5">${p.category}</p>
                                <p class="text-[#D4AF37] font-black text-xs mt-1">${(p.price || 0).toLocaleString()} دج</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="bg-[#D4AF37]/10 border border-[#D4AF37]/40 p-4 rounded-2xl">
                    <div class="flex justify-between text-xs text-gray-300 mb-2"><span>سعر المنتجات:</span> <span>${totalPrice.toLocaleString()} دج</span></div>
                    <div class="flex justify-between text-xs text-emerald-400 mb-2 font-bold"><span>خصم الباقة المتكاملة (10%):</span> <span>- ${bundleDiscount.toLocaleString()} دج</span></div>
                    <div class="flex justify-between text-lg font-black text-white border-t border-[#D4AF37]/30 pt-2 mt-2">
                        <span>الإجمالي:</span>
                        <span class="gold-text">${finalPrice.toLocaleString()} دج</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <button onclick="addAllRoutineToCart()" class="flex-1 py-3.5 gold-gradient text-black font-black rounded-xl shadow-lg hover:scale-105 transition flex items-center justify-center gap-2 cursor-pointer">
                        <i class="fa-solid fa-cart-arrow-down"></i> أضف الروتين بخصم 10%
                    </button>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }, 1500); // محاكاة تفكير الذكاء الاصطناعي/المستشارة
}

export function addAllRoutineToCart() {
    if (!window.currentGeneratedRoutine) return;
    
    // إضافة المنتجات للسلة
    window.currentGeneratedRoutine.forEach(prod => {
        const existingItem = state.cart.find(item => item.id === prod.id && !item.selectedOptionsText);
        if (existingItem) {
            existingItem.qty = (Number(existingItem.qty) || 1) + 1;
        } else {
            state.cart.push({ ...prod, qty: 1 });
        }
    });

    // 🌟 تفعيل كود خصم تلقائي للروتين إذا لم يكن موجوداً، نقوم بإنشائه
    const routineCouponCode = 'ROUTINE10';
    if (!state.coupons) state.coupons = [];
    const hasRoutineCoupon = state.coupons.find(c => c.code === routineCouponCode);
    if (!hasRoutineCoupon) {
        state.coupons.push({
            code: routineCouponCode,
            type: 'percent',
            value: 10,
            targetProductId: 'all',
            targetProductName: 'خصم الباقة المتكاملة'
        });
        // تحديثه صامتاً في الداتابيز
        if (typeof window.db !== 'undefined') {
            window.db.collection("settings").doc("main").set({ coupons: state.coupons }, { merge: true });
        }
    }

    saveCartToLocal();
    safeCall('updateBadges');
    closeBeautyAdvisor();
    
    // توجيه للسلة وتعبئة الكوبون تلقائياً
    safeCall('showPage', 'cart');
    setTimeout(() => {
        const couponInput = document.getElementById('cart-coupon-input');
        if (couponInput) {
            couponInput.value = routineCouponCode;
            safeCall('applyCartCoupon');
        }
        showCustomAlert('روتينك في السلة 🛒', 'تمت إضافة منتجات الروتين وتفعيل خصم 10% بنجاح!', true);
    }, 500);
}

// Window Bindings
window.openBeautyAdvisor = openBeautyAdvisor;
window.closeBeautyAdvisor = closeBeautyAdvisor;
window.selectAdvisorAnswer = selectAdvisorAnswer;
window.addAllRoutineToCart = addAllRoutineToCart;
