let logoClickCount = 0;
let logoClickTimer = null;
let pendingDeleteOrderId = null;

function handleLogoClick(event) {
    logoClickCount++;
    if (logoClickCount === 1) {
        logoClickTimer = setTimeout(() => {
            if (logoClickCount < 3) showPage('home');
            logoClickCount = 0;
        }, 800);
    } else if (logoClickCount === 3) {
        clearTimeout(logoClickTimer);
        logoClickCount = 0;
        document.getElementById('admin-auth-modal').style.display = 'flex';
    }
}

function checkAdminPassword() {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === storeSettings.pass) {
        document.getElementById('admin-auth-modal').style.display = 'none';
        document.getElementById('admin-pass-input').value = '';
        showPage('admin');
    } else {
        showCustomAlert('خطأ', 'كلمة المرور غير صحيحة!', false);
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-white');
        b.classList.add('bg-gray-800', 'text-gray-300');
    });

    document.getElementById('admin-tab-' + tabName).classList.add('active');
    const btn = document.getElementById('tab-btn-' + tabName);
    btn.classList.remove('bg-gray-800', 'text-gray-300');
    btn.classList.add('bg-black', 'text-white');
}

function renderAdminDashboard() {
    const confirmedOrders = orders.filter(o => o.status === 'مكتملاً' || o.status === 'مؤكد' || !o.status);
    const totalSales = confirmedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const completedCount = orders.filter(o => o.status === 'مكتملاً').length;
    const successRate = orders.length ? Math.round((completedCount / orders.length) * 100) : 0;

    document.getElementById('stat-total-sales').innerText = totalSales.toLocaleString() + ' دج';
    document.getElementById('stat-orders-count').innerText = orders.length;
    document.getElementById('stat-avg-order').innerText = confirmedOrders.length ? Math.round(totalSales / confirmedOrders.length).toLocaleString() + ' دج' : '0 دج';
    document.getElementById('stat-success-rate').innerText = successRate + '%';
    document.getElementById('orders-badge-count').innerText = orders.length;

    const ordersTbody = document.getElementById('admin-orders-log');
    if (ordersTbody) {
        if (orders.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400">لا توجد طلبيات مسجلة بعد</td></tr>';
        } else {
            ordersTbody.innerHTML = orders.map(o => {
                const status = o.status || 'جديد';
                let statusBadgeClass = 'bg-yellow-100 text-yellow-800';
                if (status === 'مؤكد') statusBadgeClass = 'bg-blue-100 text-blue-800';
                if (status === 'قيد الشحن') statusBadgeClass = 'bg-purple-100 text-purple-800';
                if (status === 'مكتملاً') statusBadgeClass = 'bg-green-100 text-green-800';
                if (status === 'ملغى') statusBadgeClass = 'bg-red-100 text-red-800';

                let cleanPhone = (o.phone || '').replace(/\s+/g, '');
                if (cleanPhone.startsWith('0')) cleanPhone = '213' + cleanPhone.substring(1);

                const waMsg = encodeURIComponent(`مرحباً ${o.customer}، نتوجه إليك من متجر ${storeSettings.name} لتأكيد طلبكم الخاص بـ: ${o.product}. المبلغ الإجمالي: ${o.total} دج.`);

                return `
                    <tr class="border-b hover:bg-gray-50 transition">
                        <td class="p-3">
                            <div class="font-bold text-gray-900">${o.customer}</div>
                            <div class="text-xs text-gray-500 font-mono">${o.phone}</div>
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-xs text-gray-800">${o.wilaya || 'غير محدد'}</div>
                            <div class="text-[11px] text-gray-500">${o.commune || ''}</div>
                        </td>
                        <td class="p-3">
                            <div class="font-bold text-xs text-gray-900">${o.product}</div>
                            <div class="font-black text-xs text-[#B8860B]">${o.total ? o.total.toLocaleString() : 0} دج</div>
                        </td>
                        <td class="p-3">
                            <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-xs font-bold p-1.5 rounded-lg border outline-none cursor-pointer ${statusBadgeClass}">
                                <option value="جديد" ${status === 'جديد' ? 'selected' : ''}>🟡 جديد (قيد الانتظار)</option>
                                <option value="مؤكد" ${status === 'مؤكد' ? 'selected' : ''}>🔵 تم التأكيد هاتفياً</option>
                                <option value="قيد الشحن" ${status === 'قيد الشحن' ? 'selected' : ''}>🟣 قيد الشحن</option>
                                <option value="مكتملاً" ${status === 'مكتملاً' ? 'selected' : ''}>🟢 تم التسليم والمبلغ</option>
                                <option value="ملغى" ${status === 'ملغى' ? 'selected' : ''}>🔴 ملغى</option>
                            </select>
                        </td>
                        <td class="p-3 flex items-center gap-2">
                            <a href="tel:${o.phone}" class="bg-green-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1">
                                📞 اتصال
                            </a>
                            <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-600 flex items-center gap-1">
                                💬 واتساب
                            </a>
                            <button onclick="promptDeleteOrder('${o.id}')" class="bg-red-100 text-red-600 text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-red-200">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // إعدادات الرسائل
    if (document.getElementById('set-store-name')) {
        document.getElementById('set-store-name').value = storeSettings.name || '';
        document.getElementById('set-store-slogan').value = storeSettings.slogan || '';
        document.getElementById('set-logo-url').value = storeSettings.logoUrl || '';
        document.getElementById('set-pass').value = storeSettings.pass || 'admin123';
        document.getElementById('set-msg-success').value = storeSettings.msgSuccess || '';
        document.getElementById('set-msg-warning').value = storeSettings.msgWarning || '';
    }
}

// نافذة الحذف المخصصة
function promptDeleteOrder(id) {
    pendingDeleteOrderId = id;
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('confirm-action-btn').onclick = function() {
        confirmDeleteOrder();
    };
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCustomConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    pendingDeleteOrderId = null;
}

function confirmDeleteOrder() {
    if (pendingDeleteOrderId) {
        db.collection("orders").doc(pendingDeleteOrderId).delete().then(() => {
            closeCustomConfirm();
            showCustomAlert('تم الحذف', 'تم حذف الطلبية بنجاح.', true);
        });
    }
}

function updateOrderStatus(id, newStatus) {
    db.collection("orders").doc(id).update({ status: newStatus }).then(() => {
        renderAdminDashboard();
    });
}

function handleSaveSettings(e) {
    e.preventDefault();
    const settings = {
        name: document.getElementById('set-store-name').value,
        slogan: document.getElementById('set-store-slogan').value,
        logoUrl: document.getElementById('set-logo-url').value,
        pass: document.getElementById('set-pass').value,
        msgSuccess: document.getElementById('set-msg-success').value,
        msgWarning: document.getElementById('set-msg-warning').value
    };

    db.collection("settings").doc("main").set(settings, { merge: true }).then(() => {
        showCustomAlert('تم الحفظ', 'تم تحديث كافة الإعدادات والرسائل المخصصة بنجاح!', true);
    });
}
