// --- ملف js/main.js ---

// استيراد كافة وحدات المشروع لتعمل معاً
import './store/state.js';
import './utils/helpers.js';
import './services/database.js';
import './app.js';
import './ui.js';
import './landing.js';
import './gift-builder.js';
import './admin.js';

// تشغيل الوظائف الأساسية فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // 1. بدء الاتصال بقاعدة البيانات
    if (typeof window.initFirebaseSync === 'function') {
        window.initFirebaseSync();
    }
    
    // 2. تشغيل شاشة الافتتاح الفاخرة
    if (typeof window.initLuxurySplashScreen === 'function') {
        window.initLuxurySplashScreen();
    }
    
    // 3. التحقق من تسجيل دخول الإدارة لتثبيت الجلسة
    if (localStorage.getItem('cosAdminLoggedIn') === 'true') {
        if (typeof window.showPage === 'function') {
            window.showPage('admin');
        }
    }
});
