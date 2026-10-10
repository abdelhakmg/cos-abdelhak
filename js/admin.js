// js/admin.js - الدخول المباشر والآمن للوحة التحكم

function closeAdminAuthModal() {
    const modal = document.getElementById('admin-auth-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

function checkAdminPassword() {
    const inputEl = document.getElementById('admin-pass-input');
    if (!inputEl) return;

    const val = inputEl.value ? inputEl.value.trim() : '';

    if (val === '123456') {
        closeAdminAuthModal();
        inputEl.value = '';
        showPage('admin');
        renderAdminDashboard();
    } else {
        alert('كلمة المرور غير صحيحة! كلمة السر هي: 123456');
    }
}

function renderAdminDashboard() {
    const log = document.getElementById('admin-orders-log');
    if (!log) return;

    if (orders.length === 0) {
        log.innerHTML = '<p class="text-gray-500 text-xs text-center py-4">لا توجد طلبيات مسجلة.</p>';
        return;
    }

    log.innerHTML = `
        <table class="w-full text-right text-xs">
            <thead><tr class="border-b"><th class="p-2">الزبون</th><th class="p-2">الولاية</th><th class="p-2">المنتج</th><th class="p-2">المبلغ</th></tr></thead>
            <tbody>
                ${orders.map(o => `<tr class="border-b"><td class="p-2 font-bold">${o.customer}</td><td class="p-2">${o.wilaya}</td><td class="p-2">${o.product}</td><td class="p-2 font-bold text-[#B8860B]">${o.total} دج</td></tr>`).join('')}
            </tbody>
        </table>
    `;
}
