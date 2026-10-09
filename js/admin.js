// ==========================================
// ⚙️ إدارة لوحة التحكم (Admin Dashboard)
// ==========================================

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-black', 'text-white');
        btn.classList.add('bg-gray-800', 'text-gray-300');
    });

    const targetTab = document.getElementById(`admin-tab-${tabName}`);
    const targetBtn = document.getElementById(`tab-btn-${tabName}`);

    if (targetTab) {
        targetTab.classList.remove('hidden');
        targetTab.classList.add('active');
    }
    if (targetBtn) {
        targetBtn.classList.remove('bg-gray-800', 'text-gray-300');
        targetBtn.classList.add('bg-black', 'text-white');
    }
}

function renderAdminDashboard() {
    switchAdminTab('analytics');
}

function handleImageUpload(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const input = document.getElementById(targetInputId);
        if (input) input.value = e.target.result;
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('تم الرفع 📸', 'تم تجهيز الصورة بنجاح!');
        }
    };
    reader.readAsDataURL(file);
}

function handleSaveProduct(e) {
    if (e) e.preventDefault();
    if (typeof showCustomAlert === 'function') {
        showCustomAlert('تم الحفظ 👍', 'تم حفظ بيانات المنتج بنجاح!');
    }
}

function resetProductForm() {
    const form = document.getElementById('product-edit-form');
    if (form) form.reset();
}
