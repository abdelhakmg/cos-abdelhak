// --- ملف js/beauty-advisor.js ---

import { state, saveCartToLocal } from './store/state.js';
import { showCustomAlert, safeCall, formatPrice } from './utils/helpers.js';

let advisorStepIndex = 0;
let activeSteps = []; // مسار الأسئلة الديناميكي
let userAnswers = {
    journey: '',
    skinType: '',
    skinConcern: '',
    hairType: '',
    hairConcern: ''
};

// بنك الأسئلة بالبطاقات البصرية
// بنك الأسئلة بالبطاقات البصرية (محدث ليتطابق مع فلاتر المتجر)
const questionsBank = {
    journey: {
        title: 'مرحباً بك يا جميلة ✨',
        subtitle: 'ما الذي ترغبين في العناية به اليوم؟',
        options: [
            { value: 'skin', label: 'العناية بالبشرة', icon: 'fa-solid fa-face-smile-beam' },
            { value: 'hair', label: 'العناية بالشعر', icon: 'fa-solid fa-spray-can-sparkles' },
            { value: 'both', label: 'البشرة والشعر معاً', icon: 'fa-solid fa-spa' }
        ]
    },
    skinType: {
        title: 'لنبدأ ببشرتك 🌸',
        subtitle: 'كيف تصفين نوع بشرتك؟',
        options: [
            { value: 'العادية', label: 'العادية', icon: 'fa-solid fa-face-smile' },
            { value: 'الجافة', label: 'الجافة', icon: 'fa-solid fa-leaf' },
            { value: 'الدهنية', label: 'الدهنية', icon: 'fa-solid fa-droplet' },
            { value: 'المختلطة', label: 'المختلطة', icon: 'fa-solid fa-circle-half-stroke' },
            { value: 'الحساسة', label: 'الحساسة', icon: 'fa-solid fa-feather-pointed' }
        ]
    },
    skinConcern: {
        title: 'رائع! 🎯',
        subtitle: 'ما هو الهدف الأساسي الذي ترغبين في معالجته؟',
        options: [
            { value: 'حب الشباب', label: 'حب الشباب', icon: 'fa-solid fa-circle-dot' },
            { value: 'الرؤوس السوداء والبيضاء', label: 'الرؤوس السوداء', icon: 'fa-solid fa-masks-theater' },
            { value: 'المسام الواسعة', label: 'المسام الواسعة', icon: 'fa-solid fa-magnifying-glass-chart' },
            { value: 'التصبغات والبقع الداكنة', label: 'التصبغات والبقع', icon: 'fa-solid fa-sun' },
            { value: 'التجاعيد والخطوط الدقيقة', label: 'التجاعيد والخطوط', icon: 'fa-solid fa-face-grin-stars' },
            { value: 'الجفاف والتقشر', label: 'الجفاف والتقشر', icon: 'fa-solid fa-water-arrow-down' },
            { value: 'الهالات السوداء', label: 'الهالات السوداء', icon: 'fa-solid fa-eye-low-vision' },
            { value: 'الاحمرار والتهيج', label: 'الاحمرار والتهيج', icon: 'fa-solid fa-fire-flame-simple' }
        ]
    },
    hairType: {
        title: 'ننتقل لجمال شعرك 💇‍♀️',
        subtitle: 'كيف تصفين طبيعة شعرك؟',
        options: [
            { value: 'العادي', label: 'العادي', icon: 'fa-solid fa-check-double' },
            { value: 'الجاف', label: 'الجاف', icon: 'fa-solid fa-seedling' },
            { value: 'الدهني', label: 'الدهني', icon: 'fa-solid fa-water' },
            { value: 'الناعم', label: 'الناعم', icon: 'fa-solid fa-wind' },
            { value: 'المموج', label: 'المموج', icon: 'fa-solid fa-water' },
            { value: 'المجعد', label: 'المجعد', icon: 'fa-solid fa-infinity' },
            { value: 'المصبوغ', label: 'المصبوغ', icon: 'fa-solid fa-fill-drip' },
            { value: 'المعالج كيميائياً', label: 'المعالج كيميائياً', icon: 'fa-solid fa-flask' }
        ]
    },
    hairConcern: {
        title: 'سؤال أخير ⏳',
        subtitle: 'ما هي المشكلة المزعجة في شعرك؟',
        options: [
            { value: 'تساقط الشعر', label: 'تساقط الشعر', icon: 'fa-solid fa-turn-down' },
            { value: 'القشرة', label: 'القشرة', icon: 'fa-solid fa-snowflake' },
            { value: 'تقصف الأطراف', label: 'تقصف الأطراف', icon: 'fa-solid fa-scissors' },
            { value: 'الهيشان والتطاير', label: 'الهيشان والتطاير', icon: 'fa-solid fa-bolt' },
            { value: 'الجفاف والتلف', label: 'الجفاف والتلف', icon: 'fa-solid fa-ban' },
            { value: 'بهتان اللون', label: 'بهتان اللون', icon: 'fa-solid fa-lightbulb' },
            { value: 'حساسية فروة الرأس', label: 'حساسية الفروة', icon: 'fa-solid fa-shield-heart' },
            { value: 'بطء النمو', label: 'بطء النمو', icon: 'fa-solid fa-hourglass-empty' },
            { value: 'الشيب', label: 'الشيب', icon: 'fa-solid fa-user-tie' }
        ]
    }
};

export function openBeautyAdvisor() {
    advisorStepIndex = 0;
    activeSteps = ['journey'];
    userAnswers = { journey: '', skinType: '', skinConcern: '', hairType: '', hairConcern: '' };
    
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

// زر الرجوع الداخلي للنافذة
export function prevAdvisorStep() {
    if (advisorStepIndex > 0) {
        advisorStepIndex--;
        renderAdvisorStep();
    }
}

export function renderAdvisorStep() {
    const container = document.getElementById('advisor-content');
    const headerTitle = document.getElementById('advisor-header-title');
    const backBtn = document.getElementById('advisor-back-btn');
    if (!container) return;

    // إظهار/إخفاء زر الرجوع الداخلي
    if (backBtn) {
        backBtn.style.visibility = advisorStepIndex > 0 ? 'visible' : 'hidden';
    }

    if (advisorStepIndex < activeSteps.length) {
        const stepKey = activeSteps[advisorStepIndex];
        const q = questionsBank[stepKey];
        const progress = ((advisorStepIndex + 1) / (activeSteps.length + 1)) * 100; // +1 لخطوة النتيجة
        
        if (headerTitle) headerTitle.innerText = "مستشارة الجمال";

        container.innerHTML = `
            <div class="animate-fade-in text-center space-y-6">
                <div class="w-full bg-gray-800 rounded-full h-1.5 mb-2">
                    <div class="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(212,175,55,0.8)]" style="width: ${progress}%"></div>
                </div>
                
                <h3 class="text-2xl font-black text-white gold-text">${q.title}</h3>
                <p class="text-gray-400 text-sm mb-6">${q.subtitle}</p>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    ${q.options.map(opt => `
                        <button onclick="selectAdvisorAnswer('${stepKey}', '${opt.value}')" class="group relative bg-black border border-gray-700 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] cursor-pointer overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-t from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <i class="${opt.icon} text-3xl text-gray-400 group-hover:text-[#D4AF37] transition-colors duration-300 relative z-10"></i>
                            <span class="text-white font-bold text-xs relative z-10">${opt.label}</span>
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
    
    // تحديد مسار الأسئلة بعد السؤال الأول (الرحلة)
    if (questionId === 'journey') {
        activeSteps = ['journey'];
        if (answerValue === 'skin') {
            activeSteps.push('skinType', 'skinConcern');
        } else if (answerValue === 'hair') {
            activeSteps.push('hairType', 'hairConcern');
        } else if (answerValue === 'both') {
            activeSteps.push('skinType', 'skinConcern', 'hairType', 'hairConcern');
        }
    }
    
    advisorStepIndex++;
    renderAdvisorStep();
}

function generateSmartRoutine() {
    const container = document.getElementById('advisor-content');
    const headerTitle = document.getElementById('advisor-header-title');
    if (headerTitle) headerTitle.innerText = "النتيجة والتوصيات";

    container.innerHTML = `<div class="flex flex-col items-center justify-center py-12 space-y-4"><i class="fa-solid fa-spinner fa-spin text-5xl text-[#D4AF37]"></i><p class="text-white font-bold text-sm">جاري تحليل إجاباتك وفلترة المنتجات...</p></div>`;
    
    setTimeout(() => {
        const matchProduct = (product, keywords) => {
            const str = [product.name, product.desc, product.category, JSON.stringify(product.attributes || {})].join(' ').toLowerCase();
            return keywords.some(k => str.includes(k.toLowerCase()));
        };

        const availableProducts = state.products.filter(p => p.inStock !== false);
        let finalRoutine = [];

        if (userAnswers.journey === 'skin' || userAnswers.journey === 'both') {
            const skinKeywords = [userAnswers.skinType, userAnswers.skinConcern];
            const skinProds = availableProducts.filter(p => 
                (p.category && (p.category.includes('بشرة') || p.category.includes('وجه'))) && 
                matchProduct(p, skinKeywords)
            ).slice(0, 4);
            finalRoutine = [...finalRoutine, ...skinProds];
        }

        if (userAnswers.journey === 'hair' || userAnswers.journey === 'both') {
            const hairKeywords = [userAnswers.hairType, userAnswers.hairConcern];
            const hairProds = availableProducts.filter(p => 
                (p.category && p.category.includes('شعر')) && 
                matchProduct(p, hairKeywords)
            ).slice(0, 4);
            finalRoutine = [...finalRoutine, ...hairProds];
        }

        // إزالة التكرار إن وجد
        finalRoutine = Array.from(new Set(finalRoutine.map(a => a.id)))
            .map(id => finalRoutine.find(a => a.id === id));

        if (finalRoutine.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 space-y-4 animate-fade-in">
                    <div class="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto text-4xl text-gray-500 mb-2"><i class="fa-solid fa-face-frown"></i></div>
                    <h3 class="text-xl font-black text-white">عذراً يا جميلة</h3>
                    <p class="text-gray-400 text-sm leading-relaxed">لم نجد حالياً منتجات متوفرة في المخزون تطابق طلبك بدقة. سيتم توفيرها قريباً.</p>
                    <button onclick="closeBeautyAdvisor(); safeCall('showPage', 'catalog');" class="bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-xl mt-4 w-full shadow-lg">تصفح الكتالوج كاملاً</button>
                </div>`;
            return;
        }

        window.currentGeneratedRoutine = finalRoutine; // حفظ المنتجات

        let html = `
            <div class="animate-fade-in space-y-6 text-right max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar pb-24">
                <div class="text-center mb-6">
                    <h3 class="text-xl font-black text-white mb-2">المنتجات المناسبة لكِ ✨</h3>
                    <p class="text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 inline-block px-3 py-1 rounded-full border border-[#D4AF37]/30">اخترنا لك الأفضل لحالتك، اختاري ما يناسبك منها:</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    ${finalRoutine.map(p => `
                        <div class="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex flex-col justify-between hover:border-[#D4AF37] transition">
                            <div>
                                <img src="${(p.images && p.images[0]) || p.image}" class="w-full h-24 object-contain bg-black rounded-xl p-1 border border-gray-800 mb-2">
                                <h4 class="font-bold text-white text-xs line-clamp-2 leading-snug">${p.name}</h4>
                                <p class="text-[#D4AF37] font-black text-sm mt-2 mb-3">${formatPrice(p.price)}</p>
                            </div>
                            <button onclick="addSingleRoutineItem('${p.id}', this)" class="w-full bg-[#1a1a1a] text-white border border-gray-700 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                                <i class="fa-solid fa-plus"></i> أضف للسلة
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- شريط سفلي ثابت يوجه للسلة -->
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-black/95 border-t border-[#D4AF37]/30 backdrop-blur-md">
                <button onclick="closeBeautyAdvisor(); safeCall('showPage', 'cart');" class="w-full py-3.5 gold-gradient text-black font-black rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer">
                    <i class="fa-solid fa-bag-shopping"></i> الذهاب إلى السلة
                </button>
            </div>
        `;
        container.innerHTML = html;
    }, 1200);
}

// دالة إضافة منتج واحد من القائمة للسلة بتأثير بصري
export function addSingleRoutineItem(productId, btnElement) {
    const prod = window.currentGeneratedRoutine.find(p => p.id === productId);
    if (!prod) return;

    const existingItem = state.cart.find(item => item.id === prod.id && !item.selectedOptionsText);
    if (existingItem) {
        existingItem.qty = (Number(existingItem.qty) || 1) + 1;
    } else {
        state.cart.push({ ...prod, qty: 1 });
    }

    saveCartToLocal();
    safeCall('updateBadges');

    // تأثير بصري للزر
    const originalHtml = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
    btnElement.className = 'w-full bg-green-600 text-white border border-green-500 text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5';
    
    setTimeout(() => {
        btnElement.innerHTML = originalHtml;
        btnElement.className = 'w-full bg-[#1a1a1a] text-white border border-gray-700 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer';
    }, 2000);
}

// Window Bindings
window.openBeautyAdvisor = openBeautyAdvisor;
window.closeBeautyAdvisor = closeBeautyAdvisor;
window.prevAdvisorStep = prevAdvisorStep;
window.selectAdvisorAnswer = selectAdvisorAnswer;
window.addSingleRoutineItem = addSingleRoutineItem;
