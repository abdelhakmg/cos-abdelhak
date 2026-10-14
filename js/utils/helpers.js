// --- ملف js/utils/helpers.js ---

// 1. دالة عرض التنبيهات الموحدة
export function showCustomAlert(title, message, isSuccess = true) {
    const modal = document.getElementById('custom-alert-modal');
    const iconBox = document.getElementById('alert-icon-box');
    const icon = document.getElementById('alert-icon');
    const titleEl = document.getElementById('alert-title');
    const msgEl = document.getElementById('alert-message');

    if (!modal) return;

    titleEl.innerText = title;
    msgEl.innerText = message;

    if (isSuccess) {
        iconBox.className = "w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto text-black text-2xl shadow-lg";
        icon.className = "fa-solid fa-check";
    } else {
        iconBox.className = "w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-500 text-2xl shadow-lg";
        icon.className = "fa-solid fa-circle-exclamation";
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// 2. إغلاق التنبيه
export function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// 3. التحقق من صحة رقم الهاتف الجزائري
export function isValidDzPhone(phone) {
    const cleanPhone = phone.trim();
    const dzPhoneRegex = /^(05|06|07)[0-9]{8}$/;
    return dzPhoneRegex.test(cleanPhone);
}

// 4. دالة موحدة لحساب تكلفة التوصيل (تغنينا عن تكرار الكود 3 مرات)
export function calculateShippingCost(wilayaCode, wilayasArray, shipType) {
    if (!wilayaCode || !wilayasArray) return 0;
    const wilaya = wilayasArray.find(w => w.code === wilayaCode);
    if (!wilaya) return 0;
    
    if (shipType === 'office') {
        return wilaya.officeCost || 0;
    } else {
        // إذا كان للمنزل، أو إذا لم يُحدد سعر المنزل نأخذ سعر المكتب
        return wilaya.homeCost || wilaya.officeCost || 0;
    }
}

// 5. تنسيق السعر بالدينار الجزائري
export function formatPrice(price) {
    return (price || 0).toLocaleString() + ' دج';
}

// 6. التنفيذ الآمن للدوال
export function safeCall(fnName, ...args) {
    if (typeof window[fnName] === 'function') {
        try {
            window[fnName](...args);
        } catch (e) {
            console.warn(`Error executing ${fnName}:`, e);
        }
    }
}

// --- ربط الدوال بالواجهة (Window Binding) لتظل أزرار HTML تعمل ---
window.showCustomAlert = showCustomAlert;
window.closeCustomAlert = closeCustomAlert;
window.isValidDzPhone = isValidDzPhone;
