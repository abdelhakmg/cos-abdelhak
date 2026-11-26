// --- ملف js/digital-services.js (واجهة الزبائن للخدمات الإلكترونية والشحن الفوري - معزول تماماً) ---
import { showCustomAlert } from './utils/helpers.js';

const DEFAULT_BARIDI_IMG = "https://firebasestorage.googleapis.com/v0/b/cos-abdelhak.firebasestorage.app/o/%D8%AA%D9%86%D8%B2%D9%8A%D9%84.png?alt=media&token=32badda4-d399-4254-b2a1-da8ebb15ed16";

const digitalState = {
    settings: { isActive: true, bannerImage: '', bannerTitle: '⚡ عالم الشحن الفوري والخدمات الإلكترونية', bannerSubtitle: 'شحن ألعاب، بطاقات، اشتراكات، ودعم سوشيال ميديا بأفضل الأسعار', baridiImage: DEFAULT_BARIDI_IMG },
    categories: [],
    services: [],
    packages: [],
    isLoaded: false,
    view: 'categories', // 'categories' | 'services' | 'packages'
    selectedCategory: null,
    selectedService: null,
    selectedSubGroup: 'الكل',
    searchQuery: '',
    activePackage: null,
    currentQty: 1,
    uploadedReceiptUrl: ''
};

// 1. تحميل البانر الإعلاني في الصفحة الرئيسية تلقائياً عند فتح الموقع
export async function initDigitalBanner() {
    if (typeof window.db === 'undefined') return;
    try {
        const doc = await window.db.collection('digital_settings').doc('main').get();
        if (doc.exists) {
            digitalState.settings = { ...digitalState.settings, ...doc.data() };
        }
        const wrapper = document.getElementById('promo-banner-digital-wrapper');
        const imgEl = document.getElementById('promo-banner-digital-img');
        const fallbackBox = document.getElementById('promo-banner-digital-fallback');

        if (wrapper) {
            if (digitalState.settings.isActive === false) {
                wrapper.classList.add('hidden');
            } else {
                wrapper.classList.remove('hidden');
                if (digitalState.settings.bannerImage && imgEl) {
                    imgEl.src = digitalState.settings.bannerImage;
                    imgEl.classList.remove('hidden');
                    if (fallbackBox) fallbackBox.classList.add('hidden');
                }
            }
        }
    } catch (err) {
        console.warn('Digital banner load notice:', err);
    }
}

// 2. جلب بيانات الأقسام والخدمات والباقات عند فتح النافذة
async function loadDigitalCatalog() {
    if (typeof window.db === 'undefined') return;
    try {
        const [setDoc, catSnap, srvSnap, pkgSnap] = await Promise.all([
            window.db.collection('digital_settings').doc('main').get(),
            window.db.collection('digital_categories').get(),
            window.db.collection('digital_services').get(),
            window.db.collection('digital_packages').get()
        ]);

        if (setDoc.exists) digitalState.settings = { ...digitalState.settings, ...setDoc.data() };

        digitalState.categories = [];
        catSnap.forEach(d => { if (d.data().isActive !== false) digitalState.categories.push({ id: d.id, ...d.data() }); });
        digitalState.categories.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

        digitalState.services = [];
        srvSnap.forEach(d => { if (d.data().isActive !== false) digitalState.services.push({ id: d.id, ...d.data() }); });
        digitalState.services.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

        digitalState.packages = [];
        pkgSnap.forEach(d => { if (d.data().isActive !== false) digitalState.packages.push({ id: d.id, ...d.data() }); });
        digitalState.packages.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

        digitalState.isLoaded = true;
    } catch (err) {
        console.error('Error loading digital catalog:', err);
    }
}

// 3. حقن النافذة المنبثقة في الصفحة تلقائياً (دون إثقال index.html)
function ensureDigitalModalExists() {
    if (document.getElementById('digital-services-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'digital-services-modal';
    modal.className = 'hidden fixed inset-0 z-[110] bg-black/90 backdrop-blur-md items-center justify-center p-2 sm:p-4';
    modal.innerHTML = `
        <div class="bg-[#0a0a0a] w-full max-w-5xl rounded-3xl border border-[#D4AF37]/40 shadow-[0_0_40px_rgba(212,175,55,0.18)] flex flex-col overflow-hidden max-h-[95vh] text-right">
            <!-- الهيدر -->
            <div class="flex justify-between items-center p-4 sm:p-5 border-b border-[#D4AF37]/20 bg-black">
                <div class="flex items-center gap-3">
                    <button id="digital-back-btn" onclick="digitalGoBack()" class="hidden w-9 h-9 bg-[#1a1a1a] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-full items-center justify-center transition cursor-pointer border border-[#D4AF37]/30">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <div>
                        <h3 id="digital-modal-title" class="text-base sm:text-xl font-black text-[#D4AF37] flex items-center gap-2">
                            <i class="fa-solid fa-bolt"></i> الشحن الفوري والخدمات الإلكترونية
                        </h3>
                        <p id="digital-modal-breadcrumb" class="text-[11px] text-gray-400 font-bold mt-0.5">اختر القسم المطلوب</p>
                    </div>
                </div>
                <button onclick="closeDigitalServices()" class="w-9 h-9 bg-[#1a1a1a] hover:bg-red-600 text-gray-300 hover:text-white rounded-full flex items-center justify-center transition cursor-pointer">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <!-- شريط البحث -->
            <div class="px-4 sm:px-6 pt-4 pb-2 bg-[#0d0d0d]">
                <div class="relative">
                    <input type="text" id="digital-search-input" oninput="handleDigitalSearch(this.value)" placeholder="ابحث عن لعبة، اشتراك، بطاقة شحن..." class="w-full bg-black border border-[#D4AF37]/30 text-white text-xs sm:text-sm rounded-xl py-2.5 px-4 pr-10 outline-none focus:border-[#D4AF37] transition">
                    <i class="fa-solid fa-magnifying-glass absolute right-3.5 top-3 text-[#D4AF37] text-xs"></i>
                </div>
            </div>

            <!-- المحتوى الديناميكي -->
            <div id="digital-modal-body" class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5"></div>
        </div>

        <!-- نافذة استمارة الطلب والدفع المسبق -->
        <div id="digital-order-overlay" class="hidden fixed inset-0 z-[120] bg-black/90 backdrop-blur-md items-center justify-center p-3 sm:p-4">
            <div class="bg-[#121212] border border-[#D4AF37]/50 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto custom-scrollbar p-5 sm:p-6 text-right relative shadow-2xl">
                <button onclick="closeDigitalOrderModal()" class="absolute top-4 left-4 w-8 h-8 bg-black text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition cursor-pointer border border-gray-800">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div id="digital-order-content"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 4. فتح وإغلاق قسم الخدمات الإلكترونية
export async function openDigitalServices() {
    ensureDigitalModalExists();
    const modal = document.getElementById('digital-services-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const body = document.getElementById('digital-modal-body');
    if (!digitalState.isLoaded) {
        body.innerHTML = `<div class="py-16 text-center text-[#D4AF37]"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3"></i><p class="text-xs font-bold text-gray-400">جاري تحميل الخدمات...</p></div>`;
        await loadDigitalCatalog();
    }

    if (digitalState.settings.isActive === false) {
        body.innerHTML = `<div class="py-16 text-center space-y-3"><i class="fa-solid fa-clock text-4xl text-[#D4AF37]"></i><h4 class="text-white font-black text-lg">القسم متوقف مؤقتاً للصيانة</h4><p class="text-gray-400 text-xs">سنعود قريباً بخدمات وعروض جديدة!</p></div>`;
        return;
    }

    digitalState.view = 'categories';
    digitalState.selectedCategory = null;
    digitalState.selectedService = null;
    digitalState.searchQuery = '';
    const searchInp = document.getElementById('digital-search-input');
    if (searchInp) searchInp.value = '';
    renderDigitalView();
}

export function closeDigitalServices() {
    const modal = document.getElementById('digital-services-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    closeDigitalOrderModal();
}

export function digitalGoBack() {
    if (digitalState.view === 'packages') {
        digitalState.view = 'services';
        digitalState.selectedService = null;
        digitalState.selectedSubGroup = 'الكل';
    } else {
        digitalState.view = 'categories';
        digitalState.selectedCategory = null;
    }
    renderDigitalView();
}

export function handleDigitalSearch(q) {
    digitalState.searchQuery = (q || '').trim().toLowerCase();
    renderDigitalView();
}

// 5. عرض المستويات (أقسام -> خدمات -> باقات)
function renderDigitalView() {
    const body = document.getElementById('digital-modal-body');
    const backBtn = document.getElementById('digital-back-btn');
    const crumb = document.getElementById('digital-modal-breadcrumb');
    if (!body) return;

    // إذا كان هناك بحث نشط، نبحث في الباقات والخدمات مباشرة
    if (digitalState.searchQuery) {
        backBtn.classList.add('hidden');
        crumb.innerText = `نتائج البحث عن: "${digitalState.searchQuery}"`;
        const matchedPkgs = digitalState.packages.filter(p => (p.name || '').toLowerCase().includes(digitalState.searchQuery));
        const matchedSrvs = digitalState.services.filter(s => (s.name || '').toLowerCase().includes(digitalState.searchQuery));

        if (matchedPkgs.length === 0 && matchedSrvs.length === 0) {
            body.innerHTML = `<div class="py-16 text-center text-gray-500 text-sm font-bold">لا توجد خدمات أو باقات مطابقة لبحثك.</div>`;
            return;
        }

        let html = '';
        if (matchedSrvs.length > 0) {
            html += `<h4 class="text-xs font-black text-[#D4AF37] mb-3">الخدمات المطابقة:</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">${matchedSrvs.map(renderServiceCard).join('')}</div>`;
        }
        if (matchedPkgs.length > 0) {
            html += `<h4 class="text-xs font-black text-[#D4AF37] mb-3">الباقات المطابقة:</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">${matchedPkgs.map(renderPackageCard).join('')}</div>`;
        }
        body.innerHTML = html;
        return;
    }

    // المستوى 1: الأقسام الرئيسية + البانر الإعلاني
    if (digitalState.view === 'categories') {
        backBtn.classList.add('hidden');
        crumb.innerText = 'اختر القسم المطلوب';

        const bannerHtml = digitalState.settings.bannerImage ? `
            <div class="w-full h-32 sm:h-44 rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-lg relative">
                <img src="${digitalState.settings.bannerImage}" class="w-full h-full object-cover" alt="عروض الشحن">
            </div>` : '';

        if (digitalState.categories.length === 0) {
            body.innerHTML = bannerHtml + `<div class="py-12 text-center text-gray-500 text-xs font-bold">لم يتم إضافة أقسام بعد.</div>`;
            return;
        }

        body.innerHTML = bannerHtml + `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                ${digitalState.categories.map(c => `
                    <div onclick="selectDigitalCategory('${c.id}')" class="bg-[#121212] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 shadow-lg flex flex-col">
                        <div class="aspect-[4/3] bg-black overflow-hidden flex items-center justify-center p-2">
                            <img src="${c.image || 'logo.png'}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500" loading="lazy">
                        </div>
                        <div class="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#E5C158] text-black font-black text-xs sm:text-sm py-2 px-2 text-center truncate">
                            ${c.name}
                        </div>
                    </div>
                `).join('')}
            </div>`;
        return;
    }

    // المستوى 2: الخدمات داخل القسم (مع بانر القسم المخصص)
    if (digitalState.view === 'services' && digitalState.selectedCategory) {
        backBtn.classList.remove('hidden');
        backBtn.classList.add('flex');
        crumb.innerText = `الأقسام / ${digitalState.selectedCategory.name}`;

        const catBannerHtml = digitalState.selectedCategory.bannerImage ? `
            <div class="w-full h-32 sm:h-44 rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-lg mb-4">
                <img src="${digitalState.selectedCategory.bannerImage}" class="w-full h-full object-cover" alt="${digitalState.selectedCategory.name}">
            </div>` : '';

        const srvs = digitalState.services.filter(s => s.categoryId === digitalState.selectedCategory.id);
        if (srvs.length === 0) {
            body.innerHTML = catBannerHtml + `<div class="py-16 text-center text-gray-500 text-xs font-bold">لا توجد خدمات مضافة في هذا القسم حالياً.</div>`;
            return;
        }
        body.innerHTML = catBannerHtml + `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">${srvs.map(renderServiceCard).join('')}</div>`;
        return;
    }

    // المستوى 3: الباقات داخل الخدمة
    if (digitalState.view === 'packages' && digitalState.selectedService) {
        backBtn.classList.remove('hidden');
        backBtn.classList.add('flex');
        crumb.innerText = `${digitalState.selectedCategory?.name || ''} / ${digitalState.selectedService.name}`;

        const allPkgs = digitalState.packages.filter(p => p.serviceId === digitalState.selectedService.id);
        if (allPkgs.length === 0) {
            body.innerHTML = `<div class="py-16 text-center text-gray-500 text-xs font-bold">لا توجد باقات متوفرة لهذه الخدمة حالياً.</div>`;
            return;
        }

        // فلترة المجموعات الفرعية (مثل: جواهر / عضويات) إن وُجدت
        const subGroups = [...new Set(allPkgs.map(p => (p.subGroup || '').trim()).filter(Boolean))];
        let tabsHtml = '';
        if (subGroups.length > 0) {
            tabsHtml = `<div class="flex gap-2 overflow-x-auto pb-2 mb-3 custom-scrollbar">
                ${['الكل', ...subGroups].map(sg => `
                    <button onclick="filterDigitalSubGroup('${sg.replace(/'/g, "\\'")}')" class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${digitalState.selectedSubGroup === sg ? 'bg-[#D4AF37] text-black' : 'bg-[#1a1a1a] text-gray-300 border border-gray-800 hover:border-[#D4AF37]/50'}">${sg}</button>
                `).join('')}
            </div>`;
        }

        const filteredPkgs = digitalState.selectedSubGroup === 'الكل' ? allPkgs : allPkgs.filter(p => (p.subGroup || '').trim() === digitalState.selectedSubGroup);
        body.innerHTML = tabsHtml + `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">${filteredPkgs.map(renderPackageCard).join('')}</div>`;
    }
}

function renderServiceCard(s) {
    return `
        <div onclick="selectDigitalService('${s.id}')" class="bg-[#121212] border border-gray-800 hover:border-[#D4AF37] rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 shadow-md flex flex-col">
            <div class="aspect-square bg-black p-3 flex items-center justify-center overflow-hidden">
                <img src="${s.image || 'logo.png'}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500" loading="lazy">
            </div>
            <div class="bg-[#1a1a1a] border-t border-[#D4AF37]/20 text-white group-hover:text-[#D4AF37] font-bold text-xs sm:text-sm py-2.5 px-2 text-center truncate transition">
                ${s.name}
            </div>
        </div>`;
}

function renderPackageCard(p) {
    const img = p.image || digitalState.selectedService?.image || 'logo.png';
    return `
        <div onclick="openDigitalOrderModal('${p.id}')" class="bg-[#121212] border border-gray-800 hover:border-[#D4AF37] rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 shadow-md flex flex-col relative">
            <span class="absolute top-2 left-2 z-10 bg-black/90 border border-[#D4AF37]/60 text-[#D4AF37] font-black text-[11px] px-2.5 py-1 rounded-full shadow-md">
                ${Number(p.price || 0).toLocaleString()} دج
            </span>
            ${p.discountBadge ? `<span class="absolute top-2 right-2 z-10 bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow">${p.discountBadge}</span>` : ''}
            <div class="aspect-square bg-black p-3 flex items-center justify-center overflow-hidden">
                <img src="${img}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500" loading="lazy">
            </div>
            <div class="bg-[#1a1a1a] border-t border-[#D4AF37]/20 p-2.5 text-center">
                <div class="text-white font-bold text-xs line-clamp-2 leading-snug">${p.name}</div>
                ${p.oldPrice ? `<div class="text-[10px] text-gray-500 line-through mt-0.5">${Number(p.oldPrice).toLocaleString()} دج</div>` : ''}
            </div>
        </div>`;
}

export function selectDigitalCategory(catId) {
    digitalState.selectedCategory = digitalState.categories.find(c => c.id === catId);
    digitalState.view = 'services';
    renderDigitalView();
}

export function selectDigitalService(srvId) {
    digitalState.selectedService = digitalState.services.find(s => s.id === srvId);
    if (!digitalState.selectedCategory && digitalState.selectedService) {
        digitalState.selectedCategory = digitalState.categories.find(c => c.id === digitalState.selectedService.categoryId);
    }
    digitalState.selectedSubGroup = 'الكل';
    digitalState.searchQuery = '';
    const searchInp = document.getElementById('digital-search-input');
    if (searchInp) searchInp.value = '';
    digitalState.view = 'packages';
    renderDigitalView();
}

export function filterDigitalSubGroup(sg) {
    digitalState.selectedSubGroup = sg;
    renderDigitalView();
}

// 6. نافذة استمارة الطلب والدفع المسبق (بريدي موب)
function linkifyText(text) {
    if (!text) return '';
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-[#D4AF37] underline hover:text-yellow-300 break-all">$1</a>');
}

export function openDigitalOrderModal(pkgId) {
    const pkg = digitalState.packages.find(p => p.id === pkgId);
    if (!pkg) return;

    digitalState.activePackage = pkg;
    digitalState.uploadedReceiptUrl = '';
    digitalState.currentQty = pkg.qtyMode === 'custom' ? (Number(pkg.minQty) || 500) : 1;

    const overlay = document.getElementById('digital-order-overlay');
    const content = document.getElementById('digital-order-content');
    const baridiImg = digitalState.settings.baridiImage || DEFAULT_BARIDI_IMG;

    // بناء قسم الكمية حسب النوع
    let qtyHtml = '';
    if (pkg.qtyMode === 'stepper') {
        qtyHtml = `
            <div class="flex items-center justify-between bg-black p-3 rounded-xl border border-gray-800">
                <span class="text-xs font-bold text-gray-300">الكمية:</span>
                <div class="flex items-center gap-3">
                    <button type="button" onclick="changeDigitalQty(-1)" class="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white font-black hover:bg-gray-800 cursor-pointer">-</button>
                    <span id="dig-qty-display" class="w-8 text-center font-black text-[#D4AF37]">1</span>
                    <button type="button" onclick="changeDigitalQty(1)" class="w-8 h-8 rounded-lg gold-gradient text-black font-black cursor-pointer">+</button>
                </div>
            </div>`;
    } else if (pkg.qtyMode === 'custom') {
        const minQ = Number(pkg.minQty) || 500;
        qtyHtml = `
            <div class="bg-black p-3 rounded-xl border border-gray-800 space-y-1.5">
                <label class="block text-xs font-bold text-gray-300">العدد المطلوب (الحد الأدنى: ${minQ}):</label>
                <input type="number" id="dig-custom-qty" value="${minQ}" min="${minQ}" step="${Number(pkg.stepQty) || 100}" oninput="updateDigitalCustomQty(this.value)" class="w-full bg-[#121212] border border-gray-700 p-2.5 rounded-lg text-sm text-[#D4AF37] font-black outline-none focus:border-[#D4AF37]">
            </div>`;
    }

    // بناء الحقول الديناميكية (ID، سيرفر، إيميل، رابط، إلخ)
    const fields = Array.isArray(pkg.fields) ? pkg.fields : [];
    const fieldsHtml = fields.map((f, i) => {
        if (f.type === 'select' && Array.isArray(f.options) && f.options.length > 0) {
            return `
                <div>
                    <label class="block text-xs font-bold text-gray-300 mb-1">${f.label} *</label>
                    <select id="dig-field-${i}" data-label="${f.label}" class="dig-dyn-field w-full bg-black border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]">
                        <option value="">-- اختر ${f.label} --</option>
                        ${f.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                </div>`;
        }
        return `
            <div>
                <label class="block text-xs font-bold text-gray-300 mb-1">${f.label} *</label>
                <input type="text" id="dig-field-${i}" data-label="${f.label}" placeholder="${f.placeholder || f.label}" class="dig-dyn-field w-full bg-black border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]">
            </div>`;
    }).join('');

    content.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-gray-800 pb-3 pl-8">
                <h4 class="text-base sm:text-lg font-black text-white">${pkg.name}</h4>
                <span id="dig-total-badge" class="bg-[#D4AF37] text-black font-black text-sm px-3 py-1 rounded-full whitespace-nowrap">${Number(pkg.price || 0).toLocaleString()} دج</span>
            </div>

            ${pkg.notes ? `
                <div class="bg-[#0a0a0a] border-r-4 border-[#D4AF37] p-3.5 rounded-xl text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                    ${linkifyText(pkg.notes)}
                </div>` : ''}

            ${qtyHtml}

            <div class="space-y-3">
                ${fieldsHtml}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                    <div>
                        <label class="block text-xs font-bold text-gray-300 mb-1">الاسم الكامل *</label>
                        <input type="text" id="dig-cust-name" placeholder="اسمك" class="w-full bg-black border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-300 mb-1">رقم الواتساب / الهاتف *</label>
                        <input type="tel" id="dig-cust-phone" maxlength="10" placeholder="05 / 06 / 07..." oninput="this.value=this.value.replace(/[^0-9]/g,'')" class="w-full bg-black border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-[#D4AF37]">
                    </div>
                </div>
            </div>

            <!-- الدفع المسبق بريدي موب -->
            <div class="bg-black border border-[#D4AF37]/30 rounded-2xl p-3.5 space-y-3">
                <div class="text-center">
                    <p class="text-xs font-black text-[#D4AF37] mb-1">💳 الدفع المسبق عبر بريدي موب (BaridiMob)</p>
                    <p class="text-[11px] text-gray-400">حوّل المبلغ الإجمالي <strong id="dig-pay-amount" class="text-white">${Number(pkg.price || 0).toLocaleString()} دج</strong> ثم أرفق صورة الوصل:</p>
                </div>
                <img src="${baridiImg}" class="w-full h-auto max-h-40 object-contain rounded-xl border border-gray-800 mx-auto" alt="حساب بريدي موب">
                <div>
                    <label class="block text-xs font-bold text-[#D4AF37] mb-1.5">أرفق صورة وصل الدفع *</label>
                    <input type="file" id="dig-receipt-file" accept="image/*" onchange="handleDigitalReceiptUpload(event)" class="w-full border border-gray-700 p-2 rounded-xl text-xs bg-[#121212] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#D4AF37] file:text-black cursor-pointer">
                    <p id="dig-receipt-status" class="text-[11px] font-bold mt-1.5 hidden"></p>
                </div>
            </div>

            <button id="dig-submit-btn" onclick="submitDigitalOrder()" disabled class="w-full py-3.5 bg-gray-800 text-gray-500 font-black rounded-xl transition flex items-center justify-center gap-2 cursor-not-allowed">
                <i class="fa-solid fa-paper-plane"></i> تأكيد وإرسال الطلب
            </button>
        </div>
    `;

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
}

export function closeDigitalOrderModal() {
    const overlay = document.getElementById('digital-order-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

function getDigitalCalculatedTotal() {
    const pkg = digitalState.activePackage;
    if (!pkg) return 0;
    const unitPrice = Number(pkg.price) || 0;
    if (pkg.qtyMode === 'custom') {
        const minQ = Number(pkg.minQty) || 1;
        return Math.round((digitalState.currentQty / minQ) * unitPrice);
    }
    return Math.round(digitalState.currentQty * unitPrice);
}

function refreshDigitalTotalUI() {
    const total = getDigitalCalculatedTotal();
    const badge = document.getElementById('dig-total-badge');
    const payAmt = document.getElementById('dig-pay-amount');
    if (badge) badge.innerText = total.toLocaleString() + ' دج';
    if (payAmt) payAmt.innerText = total.toLocaleString() + ' دج';
}

export function changeDigitalQty(delta) {
    digitalState.currentQty = Math.max(1, digitalState.currentQty + delta);
    const el = document.getElementById('dig-qty-display');
    if (el) el.innerText = digitalState.currentQty;
    refreshDigitalTotalUI();
}

export function updateDigitalCustomQty(val) {
    const minQ = Number(digitalState.activePackage?.minQty) || 1;
    const num = parseInt(val) || minQ;
    digitalState.currentQty = Math.max(1, num);
    refreshDigitalTotalUI();
}

export async function handleDigitalReceiptUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const statusEl = document.getElementById('dig-receipt-status');
    const submitBtn = document.getElementById('dig-submit-btn');

    statusEl.classList.remove('hidden', 'text-emerald-400', 'text-red-400');
    statusEl.classList.add('text-yellow-400');
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري رفع وصل الدفع...';

    try {
        const url = await window.compressAndUploadImage(file, 'customer_uploads', 900);
        digitalState.uploadedReceiptUrl = url;
        statusEl.classList.replace('text-yellow-400', 'text-emerald-400');
        statusEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> تم رفع الوصل بنجاح! يمكنك تأكيد الطلب الآن.';

        submitBtn.disabled = false;
        submitBtn.className = 'w-full py-3.5 gold-gradient text-black font-black rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer';
    } catch (err) {
        statusEl.classList.replace('text-yellow-400', 'text-red-400');
        statusEl.innerHTML = '❌ فشل رفع الصورة، حاول مجدداً.';
    }
}

export async function submitDigitalOrder() {
    const pkg = digitalState.activePackage;
    if (!pkg) return;

    const customer = document.getElementById('dig-cust-name')?.value.trim();
    const phone = document.getElementById('dig-cust-phone')?.value.trim();

    if (!customer || !phone || phone.length < 9) {
        showCustomAlert('بيانات ناقصة', 'يرجى إدخال الاسم ورقم الهاتف الصحيح (واتساب).', false);
        return;
    }

    if (pkg.qtyMode === 'custom' && digitalState.currentQty < (Number(pkg.minQty) || 1)) {
        showCustomAlert('تنبيه', `الحد الأدنى للطلب هو ${pkg.minQty}.`, false);
        return;
    }

    const customFields = [];
    const fieldEls = document.querySelectorAll('.dig-dyn-field');
    for (const el of fieldEls) {
        const val = el.value.trim();
        if (!val) {
            showCustomAlert('بيانات ناقصة', `يرجى ملء حقل: ${el.dataset.label}`, false);
            return;
        }
        customFields.push({ label: el.dataset.label, value: val });
    }

    if (!digitalState.uploadedReceiptUrl) {
        showCustomAlert('وصل الدفع مطلوب', 'يرجى إرفاق صورة وصل بريدي موب أولاً.', false);
        return;
    }

    const btn = document.getElementById('dig-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...';

    try {
        const total = getDigitalCalculatedTotal();
        await window.db.collection('digital_orders').add({
            customer,
            phone,
            categoryName: digitalState.selectedCategory?.name || '',
            serviceName: digitalState.selectedService?.name || '',
            packageId: pkg.id,
            packageName: pkg.name,
            quantity: digitalState.currentQty,
            unitPrice: Number(pkg.price) || 0,
            total,
            customFields,
            receiptUrl: digitalState.uploadedReceiptUrl,
            status: 'جديد',
            createdAt: new Date()
        });

        closeDigitalOrderModal();
        showCustomAlert('تم استلام طلبك بنجاح 🎉', 'تم تسجيل طلب الشحن الخاص بك مع وصل الدفع. سنقوم بتنفيذه والتواصل معك عبر واتساب في أقرب وقت!', true);
    } catch (err) {
        console.error('Digital order submit error:', err);
        showCustomAlert('خطأ', 'تعذر إرسال الطلب، يرجى المحاولة مرة أخرى.', false);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> تأكيد وإرسال الطلب';
    }
}

// التصدير للـ Window وتشغيل البانر تلقائياً
window.openDigitalServices = openDigitalServices;
window.closeDigitalServices = closeDigitalServices;
window.digitalGoBack = digitalGoBack;
window.handleDigitalSearch = handleDigitalSearch;
window.selectDigitalCategory = selectDigitalCategory;
window.selectDigitalService = selectDigitalService;
window.filterDigitalSubGroup = filterDigitalSubGroup;
window.openDigitalOrderModal = openDigitalOrderModal;
window.closeDigitalOrderModal = closeDigitalOrderModal;
window.changeDigitalQty = changeDigitalQty;
window.updateDigitalCustomQty = updateDigitalCustomQty;
window.handleDigitalReceiptUpload = handleDigitalReceiptUpload;
window.submitDigitalOrder = submitDigitalOrder;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initDigitalBanner, 800);
});
