// --- ملف js/main.js ---

// استيراد كافة وحدات المشروع بإصدار موحد لكسر الكاش في الهواتف فوراً
import './store/state.js';
import './utils/helpers.js';
import './services/database.js?v=16';
import './app.js?v=16';
import './ui.js?v=16';
import './landing.js?v=16';
import './gift-builder.js?v=16';
import './admin.js?v=16';
import './admin-custom.js?v=16';
import './custom-builder.js?v=16';
import './beauty-advisor.js?v=16';
import { state } from './store/state.js';

// 🌟 دالة جلب وتطبيق إعدادات الواجهة والتسويق (البانرات وعروض الصاعقة المخصصة)
async function loadAndApplyUiConfig() {
    try {
        if (typeof window.db === 'undefined') return;
        const doc = await window.db.collection('settings').doc('ui_config').get();
        if (doc.exists) {
            const data = doc.data();
            
            // 1. تطبيق البانر العريض الرئيسي
            const mainBanner = document.getElementById('promo-banner-pink');
            if (mainBanner && data.bannerMain) {
                mainBanner.src = data.bannerMain;
            }

            // 2. تطبيق بوستر خدمة "صمم هديتك"
            const giftBanner = document.getElementById('promo-banner-gift');
            if (giftBanner && data.bannerGift) {
                giftBanner.src = data.bannerGift;
            }

            // 3. تطبيق بوستر خدمة "ورشة التخصيص"
            const workshopBanner = document.getElementById('promo-banner-workshop');
            if (workshopBanner && data.bannerWorkshop) {
                workshopBanner.src = data.bannerWorkshop;
            }

            // 4. تطبيق منتجات عروض الصاعقة المخصصة من الإدارة إن وجدت
            if (data.flashIds && data.flashIds.trim() !== '') {
                const targetIds = data.flashIds.split(',').map(id => id.trim()).filter(Boolean);
                if (targetIds.length > 0 && state.products) {
                    const customFlashProducts = state.products.filter(p => targetIds.includes(p.id));
                    if (customFlashProducts.length > 0) {
                        const flashContainer = document.getElementById('flash-sale-products');
                        if (flashContainer) {
                            flashContainer.innerHTML = customFlashProducts.map(p => {
                                const displayImg = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'https://via.placeholder.com/300');
                                const priceNum = Number(p.price) || 0;
                                const oldPrice = Math.round(priceNum * 1.25);
                                return `
                                <div class="bg-[#121212] rounded-2xl p-2 border border-red-900/50 flex flex-col justify-between h-full relative cursor-pointer hover:border-red-500 transition-colors group snap-center min-w-[140px]" onclick="safeCall('openLandingPage', '${p.id}')">
                                    <span class="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded z-10 shadow-md">-25%</span>
                                    <div class="h-24 bg-white rounded-xl p-1 mb-2 flex items-center justify-center overflow-hidden border border-gray-200">
                                        <img src="${displayImg}" loading="lazy" class="max-h-full object-contain group-hover:scale-110 transition duration-300 drop-shadow-sm">
                                    </div>
                                    <div>
                                        <h4 class="text-white font-bold text-[10px] line-clamp-2 leading-tight mb-1 group-hover:text-[#D4AF37] text-right">${p.name || 'منتج'}</h4>
                                        <div class="flex flex-col text-right mt-1">
                                            <span class="text-[#D4AF37] font-black text-[13px]">${priceNum} دج</span>
                                            <span class="text-gray-500 text-[10px] line-through">${oldPrice} دج</span>
                                        </div>
                                    </div>
                                </div>`;
                            }).join('');
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error loading UI config:", e);
    }
}

// تشغيل الوظائف الأساسية فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // 1. تحديث عدادات السلة والمفضلة المحفوظة مسبقاً فور فتح الموقع
    if (typeof window.updateBadges === 'function') {
        window.updateBadges();
    }

    // 2. بدء الاتصال بقاعدة البيانات ومزامنة البيانات
    if (typeof window.initFirebaseSync === 'function') {
        window.initFirebaseSync();
    }
    if (typeof window.loadCustomAdminData === 'function') {
        window.loadCustomAdminData();
    }
    
    // 3. تشغيل شاشة الافتتاح الفاخرة
    if (typeof window.initLuxurySplashScreen === 'function') {
        window.initLuxurySplashScreen();
    }
    
    // 4. التحقق من تسجيل دخول الإدارة لتثبيت الجلسة
    if (localStorage.getItem('cosAdminLoggedIn') === 'true') {
        if (typeof window.showPage === 'function') {
            window.showPage('admin');
        }
    }

    // 🌟 تشغيل محرك تخصيص الواجهة والبانرات بعد تحميل المنتجات بقليل
    setTimeout(loadAndApplyUiConfig, 1200);

    // 5. إغلاق قائمة نتائج البحث تلقائياً عند النقر خارجها
    document.addEventListener('click', (e) => {
        const desktopSearch = document.getElementById('live-search-input');
        const mobileSearch = document.getElementById('mobile-search-input');
        const desktopDropdown = document.getElementById('search-results-dropdown');
        const mobileDropdown = document.getElementById('mobile-search-dropdown');

        const clickedInsideSearch = 
            (desktopSearch && desktopSearch.contains(e.target)) ||
            (mobileSearch && mobileSearch.contains(e.target)) ||
            (desktopDropdown && desktopDropdown.contains(e.target)) ||
            (mobileDropdown && mobileDropdown.contains(e.target));

        if (!clickedInsideSearch && typeof window.hideAllDropdowns === 'function') {
            window.hideAllDropdowns();
        }
    });
});

// 🌟 نظام التثبيت الذكي للتطبيق (PWA Install Prompt) خارج DOMContentLoaded لضمان الالتقاط المبكر
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const pwaBanner = document.getElementById('pwa-install-banner');
    if (pwaBanner && !window.matchMedia('(display-mode: standalone)').matches) {
        pwaBanner.classList.remove('hidden');
    }
});

document.addEventListener('click', async (e) => {
    if (e.target && (e.target.id === 'pwa-install-btn' || e.target.closest('#pwa-install-btn'))) {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                const banner = document.getElementById('pwa-install-banner');
                if (banner) banner.classList.add('hidden');
            }
            deferredPrompt = null;
        }
    }
});
