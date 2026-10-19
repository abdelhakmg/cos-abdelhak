// --- ملف js/utils/helpers.js ---

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

export function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// 🌟 تصحيح: تنظيف رقم الهاتف لدعم المسافات ورمز الدولة +213
export function isValidDzPhone(phone) {
    if (!phone) return false;
    let cleanPhone = phone.trim().replace(/\s+/g, '');
    if (cleanPhone.startsWith('+213')) {
        cleanPhone = '0' + cleanPhone.substring(4);
    } else if (cleanPhone.startsWith('00213')) {
        cleanPhone = '0' + cleanPhone.substring(5);
    }
    const dzPhoneRegex = /^(05|06|07)[0-9]{8}$/;
    return dzPhoneRegex.test(cleanPhone);
}

// 🌟 تصحيح: استخدام ?? لدعم التوصيل المجاني (0 دج) وتفادي مشكلة Falsy للرقم 0
export function calculateShippingCost(wilayaCode, wilayasArray, shipType) {
    if (!wilayaCode || !wilayasArray) return 0;
    const wilaya = wilayasArray.find(w => w.code === wilayaCode);
    if (!wilaya) return 0;
    
    if (shipType === 'office') {
        return wilaya.officeCost ?? 0;
    } else {
        return wilaya.homeCost ?? wilaya.officeCost ?? 0;
    }
}

export function formatPrice(price) {
    return (price || 0).toLocaleString() + ' دج';
}

export function safeCall(fnName, ...args) {
    if (typeof window[fnName] === 'function') {
        try {
            window[fnName](...args);
        } catch (e) {
            console.warn(`Error executing ${fnName}:`, e);
        }
    }
}

window.showCustomAlert = showCustomAlert;
window.closeCustomAlert = closeCustomAlert;
window.isValidDzPhone = isValidDzPhone;
window.calculateShippingCost = calculateShippingCost; // تمت إضافتها للتصدير
window.safeCall = safeCall;
window.formatPrice = formatPrice;
