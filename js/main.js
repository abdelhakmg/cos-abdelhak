// --- ملف js/main.js ---

// استيراد كافة وحدات المشروع بإصدار موحد لكسر الكاش في الهواتف فوراً
import './store/state.js';
import './utils/helpers.js';
import './services/database.js?v=13';
import './app.js?v=13';
import './ui.js?v=13';
import './landing.js?v=13';
import './gift-builder.js?v=13';
import './admin.js?v=13';
import './admin-custom.js?v=13';
import './custom-builder.js?v=13';
import './beauty-advisor.js?v=13';

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
// 🌟 نظام التثبيت الذكي للتطبيق (PWA Install Prompt)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const pwaBanner = document.getElementById('pwa-install-banner');
    // إظهار البانر فقط إذا لم يتم تثبيت التطبيق مسبقاً
    if (pwaBanner && !window.matchMedia('(display-mode: standalone)').matches) {
        pwaBanner.classList.remove('hidden');
    }
});

document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('pwa-install-banner').classList.add('hidden');
        }
        deferredPrompt = null;
    }
});
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
