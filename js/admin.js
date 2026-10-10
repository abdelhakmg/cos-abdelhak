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
        alert('كلمة المرور غير صحيحة! كلمة السر الافتراضية هي: 123456');
    }
}

// تفعيل زر Enter
document.addEventListener('DOMContentLoaded', () => {
    const passInput = document.getElementById('admin-pass-input');
    if (passInput) {
        passInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAdminPassword();
            }
        });
    }
});

function renderAdminDashboard() {
    const log = document.getElementById('admin-orders-log');
    if (!log) return;

    if (!orders || orders.length === 0) {
        log.innerHTML = '<p class="text-gray-500 text-xs text-center py-4">لا توجد طلبيات مسجلة.</p>';
        return;
    }

    log.innerHTML = `
        <table class="w-full text-right text-xs">
            <thead>
                <tr class="border-b bg-gray-50">
                    <th class="p-3">الزبون والهاتف</th>
                    <th class="p-3">العنوان</th>
                    <th class="p-3">المنتج</th>
                    <th class="p-3">المبلغ</th>
                    <th class="p-3">الحالة</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(o => `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-bold">${o.customer}<br><span class="text-gray-500 font-mono text-[10px]">${o.phone || ''}</span></td>
                        <td class="p-3">${o.wilaya \vert{}\vert{} ''} -${o.commune || ''}</td>
                        <td class="p-3 font-bold text-blue-900">${o.product || ''}</td>
                        <td class="p-3 font-bold text-[#B8860B]">${o.total ? o.total.toLocaleString() : 0} دج</td>
                        <td class="p-3"><span class="bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-full text-[10px]">${o.status || 'جديد'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
