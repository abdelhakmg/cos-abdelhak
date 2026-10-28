// --- ملف js/main.js (موحد الإصدارات بالكامل لضمان تحديث الهواتف فوراً) ---

// استيراد كافة وحدات المشروع بإصدار موحد لكسر الكاش (Cache Busting)
import './store/state.js?v=10.0';
import './utils/helpers.js?v=10.0';
import './services/database.js?v=10.0';
import './app.js?v=10.0';
import './ui.js?v=10.0';
import './landing.js?v=10.0';
import './gift-builder.js?v=10.0';
import './admin.js?v=10.0';
import './admin-custom.js?v=10.0';
import './custom-builder.js?v=10.0';
import './beauty-advisor.js?v=10.0';

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

    // 5. إغلاق قائمة نتائج البحث تلقائياً عند النقر خارجها
    document.addEventListener('click', (e) => {
        const desktopSearch = document.getElementById('live-search-input') || document.getElementById('customer-search-input');
        const mobileSearch = document.getElementById('mobile-search-input') || document.getElementById('customer-search-input-mobile');
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
