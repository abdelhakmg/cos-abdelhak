// ==========================================
// 🚀 التطبيق الرئيسي والتحكم بالتنقل والضغطات
// ==========================================

let logoClickCount = 0;
let logoClickTimer = null;

// التفاعل عند الضغط على الشعار (3 ضغطات متتالية لدخول لوحة التحكم)
function handleLogoClick(e) {
    if (e) e.preventDefault();
    logoClickCount++;

    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => {
        if (logoClickCount < 3) {
            showPage('home');
        }
        logoClickCount = 0;
    }, 400);

    if (logoClickCount === 3) {
        clearTimeout(logoClickTimer);
        logoClickCount = 0;
        openAdminModal();
    }
}

function openAdminModal() {
    const modal = document.getElementById('admin-auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const passInp = document.getElementById('admin-pass-input');
        if (passInp) {
            passInp.value = '';
            passInp.focus();
        }
    }
}

function closeAdminAuthModal() {
    const modal = document.getElementById('admin-auth-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function checkAdminPassword() {
    const passInp = document.getElementById('admin-pass-input');
    if (!passInp) return;

    const enteredPass = passInp.value.trim();
    const correctPass = (typeof storeSettings !== 'undefined' && storeSettings.adminPassword) ? storeSettings.adminPassword : 'admin123';

    if (enteredPass === correctPass) {
        closeAdminAuthModal();
        showPage('admin');
        if (typeof renderAdminDashboard === 'function') {
            renderAdminDashboard();
        }
        showCustomAlert('أهلاً بك 👋', 'تم تسجيل الدخول إلى لوحة التحكم بنجاح.');
    } else {
        showCustomAlert('خطأ ❌', 'كلمة المرور غير صحيحة!', true);
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active');
    });

    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (pageId === 'admin' && typeof renderAdminDashboard === 'function') {
        renderAdminDashboard();
    }
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

function showCustomAlert(title, message, isError = false) {
    const modal = document.getElementById('custom-alert-modal');
    const titleEl = document.getElementById('alert-title');
    const msgEl = document.getElementById('alert-message');

    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

let onConfirmCallback = null;
function showCustomConfirm(message, callback) {
    const modal = document.getElementById('custom-confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const actionBtn = document.getElementById('confirm-action-btn');

    if (msgEl) msgEl.innerText = message;
    onConfirmCallback = callback;

    if (actionBtn) {
        actionBtn.onclick = function() {
            if (onConfirmCallback) onConfirmCallback();
            closeCustomConfirm();
        };
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeCustomConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// تهيئة أولية آمنة دون التسبب في خطأ في المتصفح
document.addEventListener("DOMContentLoaded", function () {
    if (typeof initBannerRealtimeSync === 'function') {
        initBannerRealtimeSync();
    }
});
