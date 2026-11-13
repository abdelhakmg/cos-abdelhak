// --- ملف js/main.js ---

// استيراد كافة وحدات المشروع بإصدار موحد لكسر الكاش في الهواتف فوراً
import './store/state.js';
import './utils/helpers.js';
import './services/database.js?v=23';
import './app.js?v=23';
import './ui.js?v=23';
import './landing.js?v=23';
import './gift-builder.js?v=23';
import './admin.js?v=23';
import './admin-custom.js?v=23';
import './custom-builder.js?v=23';
import './beauty-advisor.js?v=23';
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
        }

        // 4. تطبيق عروض الصاعقة الحقيقية (بناءً على وقت انتهاء حقيقي لكل منتج)
        // 4. تطبيق عروض الصاعقة الحقيقية مع أزرار السلة والطلب والمؤقت الحقيقي
        window.renderRealFlashSales = function() {
            const flashContainer = document.getElementById('flash-sale-products');
            if (!flashContainer || !state.products) return;

            const now = Date.now();
            const activeFlashProducts = state.products.filter(p => p.isFlashSale && p.flashExpiresAt && p.flashExpiresAt > now);

            if (activeFlashProducts.length > 0) {
                flashContainer.innerHTML = activeFlashProducts.map(p => {
                    const displayImg = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'https://via.placeholder.com/300');
                    const priceNum = Number(p.price) || 0;
                    const oldPrice = p.oldPrice ? p.oldPrice : Math.round(priceNum * 1.25);
                    
                    return `
                    <div class="bg-[#121212] rounded-2xl p-2.5 border border-red-900/50 flex flex-col justify-between h-full relative cursor-pointer hover:border-[#D4AF37] transition-all group snap-center min-w-[155px]" onclick="safeCall('openLandingPage', '${p.id}')">
                        <span class="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded z-10 shadow-md">⚡ عرض خاص</span>
                        
                        <div class="h-28 bg-white rounded-xl p-1.5 mb-2 flex items-center justify-center overflow-hidden border border-gray-200">
                            <img src="${displayImg}" loading="lazy" class="max-h-full object-contain group-hover:scale-110 transition duration-300 drop-shadow-sm">
                        </div>
                        
                        <div class="flex flex-col flex-1 justify-between">
                            <div>
                                <h4 class="text-white font-bold text-[11px] line-clamp-2 leading-tight mb-1 group-hover:text-[#D4AF37] text-right">${p.name || 'منتج'}</h4>
                                <div class="flex items-center justify-between mt-1">
                                    <span class="text-[#D4AF37] font-black text-sm">${priceNum} دج</span>
                                    <span class="text-gray-500 text-[10px] line-through">${oldPrice} دج</span>
                                </div>
                            </div>

                            <!-- المؤقت التنازلي للمنتج -->
                            <div class="my-1.5 text-[9px] text-red-400 font-mono font-bold text-center bg-red-950/40 py-1 px-1.5 rounded border border-red-900/30" data-expires="${p.flashExpiresAt}">
                                ⏳ جاري الحساب...
                            </div>

                            <!-- 🌟 أزرار اطلب الآن + أضف للسلة 🌟 -->
                            <div class="mt-1 flex gap-1.5 pt-1 border-t border-gray-800/80">
                                <button type="button" onclick="event.stopPropagation(); safeCall('openLandingPage', '${p.id}');" class="flex-1 py-1.5 gold-gradient text-black font-extrabold text-[10px] rounded-lg shadow hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1">
                                    <i class="fa-solid fa-bolt"></i> اطلب
                                </button>
                                <button type="button" onclick="event.stopPropagation(); safeCall('addToCart', '${p.id}');" class="w-8 h-7 flex items-center justify-center bg-black border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold rounded-lg transition cursor-pointer" title="أضف للسلة">
                                    <i class="fa-solid fa-cart-plus text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
                }).join('');

                if (window.flashTimerInterval) clearInterval(window.flashTimerInterval);
                const maxExpiresAt = Math.max(...activeFlashProducts.map(p => Number(p.flashExpiresAt) || 0));

                window.flashTimerInterval = setInterval(() => {
                    const nowMs = Date.now();
                    const mainDiff = maxExpiresAt - nowMs;
                    const hEl = document.getElementById('flash-h');
                    const mEl = document.getElementById('flash-m');
                    const sEl = document.getElementById('flash-s');
                    if (hEl && mEl && sEl) {
                        if (mainDiff > 0) {
                            hEl.innerText = Math.floor(mainDiff / (1000 * 60 * 60)).toString().padStart(2, '0');
                            mEl.innerText = Math.floor((mainDiff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                            sEl.innerText = Math.floor((mainDiff % (1000 * 60)) / 1000).toString().padStart(2, '0');
                        } else {
                            hEl.innerText = '00'; mEl.innerText = '00'; sEl.innerText = '00';
                        }
                    }

                    document.querySelectorAll('[data-expires]').forEach(el => {
                        const expiresAt = parseInt(el.getAttribute('data-expires'));
                        const diff = expiresAt - nowMs;
                        if (diff <= 0) {
                            el.innerText = "انتهى العرض ❌";
                            el.closest('.snap-center')?.remove();
                        } else {
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                            el.innerText = `⏳ ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        }
                    });
                }, 1000);
            } else {
                flashContainer.innerHTML = '<div class="text-gray-500 text-xs py-4 text-center col-span-full">لا توجد عروض نشطة حالياً.</div>';
            }
        };

        window.renderRealFlashSales();
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
