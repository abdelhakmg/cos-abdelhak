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
if (isSuccess && (title.includes('الاستلام') || title.includes('طلب') || title.includes('بنجاح'))) {
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', { currency: 'DZD', value: 1 }); 
        }
    }
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
export async function compressAndUploadImage(file, folderName, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                } else if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
                
                canvas.width = Math.round(width);
                canvas.height = Math.round(height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // تحويل الصورة لـ Blob ورفعها لـ Storage
                canvas.toBlob(async (blob) => {
                    if (!blob) return reject("فشل معالجة الصورة");
                    try {
                        const fileName = `${folderName}/img_${Date.now()}_${Math.floor(Math.random()*1000)}.webp`;
                        const storageRef = window.storage.ref().child(fileName);
                        const snapshot = await storageRef.put(blob, { contentType: 'image/webp' });
                        const downloadURL = await snapshot.ref.getDownloadURL();
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }, 'image/webp', 0.70);
            };
        };
        reader.onerror = error => reject(error);
    });
}

window.compressAndUploadImage = compressAndUploadImage;
window.showCustomAlert = showCustomAlert;
window.closeCustomAlert = closeCustomAlert;
window.isValidDzPhone = isValidDzPhone;
window.calculateShippingCost = calculateShippingCost; // تمت إضافتها للتصدير
window.safeCall = safeCall;
window.formatPrice = formatPrice;
