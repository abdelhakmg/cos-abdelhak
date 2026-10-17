// --- ملف js/admin-custom.js ---

import { state } from './store/state.js';
import { showCustomAlert } from './utils/helpers.js';

let workshopConfig = {
    isActive: true,
    products: [] // هنا سيتم تخزين كل منتجاتك الديناميكية
};

// 1. تحميل بيانات الإدارة
export async function loadCustomAdminData() {
    if (typeof window.db !== 'undefined') {
        try {
            const doc = await window.db.collection('settings').doc('custom_workshop').get();
            if (doc.exists) {
                const data = doc.data();
                workshopConfig.isActive = data.isActive !== false;
                workshopConfig.products = data.products || [];
                
                // تحديث المتجر المحلي
                if(!state.storeSettings) state.storeSettings = {};
                state.storeSettings.custom_workshop = workshopConfig;
            }
        } catch (error) {
            console.error("خطأ في جلب بيانات الورشة:", error);
        }
    }
    
    const masterSwitch = document.getElementById('custom-master-switch');
    if (masterSwitch) {
        masterSwitch.checked = workshopConfig.isActive;
        toggleCustomSystem(masterSwitch.checked, false);
    }

    renderCustomAdminSettings();
}

// 2. تحديث حالة الورشة ككل
export function toggleCustomSystem(isActive, saveToDb = true) {
    workshopConfig.isActive = isActive;
    const statusText = document.getElementById('custom-status-text');
    if (statusText) {
        statusText.innerText = isActive ? "مفتوحة للطلبات 🟢" : "مغلقة مؤقتاً 🔴";
        statusText.className = isActive ? "mr-3 text-xs font-bold text-green-600" : "mr-3 text-xs font-bold text-gray-500";
    }
    if(saveToDb) saveWorkshopConfig();
}

// 3. رسم قائمة المنتجات في الإدارة
export function renderCustomAdminSettings() {
    const container = document.getElementById('admin-custom-settings-container');
    if (!container) return;

    let html = `
        <div class="col-span-1 md:col-span-2 flex justify-between items-center mb-2">
            <h4 class="font-black text-lg text-gray-800">المنتجات والخدمات المعروضة (${workshopConfig.products.length})</h4>
            <button onclick="openAdminCustomProdModal()" class="bg-[#D4AF37] text-black font-black px-4 py-2.5 rounded-xl shadow-md hover:scale-105 transition flex items-center gap-2 text-sm">
                <i class="fa-solid fa-plus"></i> إضافة منتج جديد
            </button>
        </div>
        <div class="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    `;

    if (workshopConfig.products.length === 0) {
        html += `<div class="col-span-3 text-center p-10 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold">لا يوجد منتجات في الورشة حتى الآن. اضغط على إضافة منتج جديد!</div>`;
    } else {
        workshopConfig.products.forEach((p, index) => {
            const categoryIcon = p.category === 'laser' ? '<i class="fa-solid fa-fire text-red-500"></i>' : 
                                 p.category === 'print' ? '<i class="fa-solid fa-shirt text-purple-500"></i>' : 
                                 p.category === 'frame' ? '<i class="fa-solid fa-image text-blue-500"></i>' : 
                                 '<i class="fa-solid fa-scissors text-green-500"></i>';
            
            html += `
                <div class="bg-white p-4 rounded-2xl border ${p.inStock ? 'border-gray-200' : 'border-red-200 bg-red-50'} shadow-sm relative group">
                    <div class="absolute top-2 right-2 flex gap-1">
                        <button onclick="openAdminCustomProdModal('${p.id}')" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center justify-center transition"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteCustomProduct('${p.id}')" class="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center transition"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    
                    <img src="${p.image || 'https://via.placeholder.com/150'}" class="w-20 h-20 object-cover rounded-xl border border-gray-100 mb-3 bg-gray-50">
                    
                    <h5 class="font-black text-gray-800 text-sm line-clamp-1 mb-1">${categoryIcon} ${p.name}</h5>
                    <p class="text-[#B8860B] font-black text-sm mb-2">${(p.basePrice || 0).toLocaleString()} دج</p>
                    
                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span class="text-[10px] font-bold text-gray-500">${p.colors ? 'متوفر ألوان' : 'بدون خيارات ألوان'}</span>
                        <button onclick="toggleCustomProdStock('${p.id}')" class="text-[10px] font-bold px-2 py-1 rounded border transition ${p.inStock ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}">
                            ${p.inStock ? 'متوفر ✅' : 'نفذ الكمية ❌'}
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    container.innerHTML = html;
}

// 4. فتح نافذة الإضافة/التعديل
window.openAdminCustomProdModal = function(productId = null) {
    const form = document.getElementById('custom-prod-form');
    if(form) form.reset();
    
    document.getElementById('cp-image-preview').classList.add('hidden');
    document.getElementById('cp-image-base64').value = '';
    
    if (productId) {
        // حالة التعديل
        const prod = workshopConfig.products.find(p => p.id === productId);
        if (prod) {
            document.getElementById('cp-id').value = prod.id;
            document.getElementById('cp-category').value = prod.category;
            document.getElementById('cp-name').value = prod.name;
            document.getElementById('cp-base-price').value = prod.basePrice;
            document.getElementById('cp-colors').value = prod.colors || '';
            
            // 🌟 الحقول الجديدة
            document.getElementById('cp-sizes').value = prod.sizes || '';
            document.getElementById('cp-fonts').value = prod.fonts || '';
            document.getElementById('cp-positions').value = prod.positions || '';
            document.getElementById('cp-max-chars').value = prod.maxChars || '';
            document.getElementById('cp-img-req').value = prod.imgReq || 'optional';

            document.getElementById('cp-face2-price').value = prod.face2Price || '';
            document.getElementById('cp-label-1').value = prod.label1 || '';
            document.getElementById('cp-label-2').value = prod.label2 || '';
            document.getElementById('cp-label-notes').value = prod.labelNotes || '';
            document.getElementById('cp-in-stock').checked = prod.inStock !== false;
            
            if (prod.image) {
                document.getElementById('cp-image-base64').value = prod.image;
                document.getElementById('cp-img-tag').src = prod.image;
                document.getElementById('cp-image-preview').classList.remove('hidden');
            }
        }
    } else {
        // حالة إضافة جديد
        document.getElementById('cp-id').value = '';
        document.getElementById('cp-img-req').value = 'optional'; // القيمة الافتراضية
        document.getElementById('cp-in-stock').checked = true;
    }

    const modal = document.getElementById('admin-custom-prod-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
// دالة ضغط الصور للإدارة (لتقليل الحجم قبل الإرسال لفايربيس)
function compressAdminImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // أقصى عرض للصورة
            const MAX_HEIGHT = 800; // أقصى طول للصورة
            let width = img.width;
            let height = img.height;

            if (width > height && width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            } else if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // ضغط الصورة بصيغة JPEG بجودة 70%
            callback(canvas.toDataURL('image/jpeg', 0.7));
        }
    };
}

// 5. تحويل الصورة إلى Base64 (بعد الضغط)
window.handleAdminCustomImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // استدعاء دالة الضغط
    compressAdminImage(file, function(compressedBase64) {
        document.getElementById('cp-image-base64').value = compressedBase64;
        document.getElementById('cp-img-tag').src = compressedBase64;
        document.getElementById('cp-image-preview').classList.remove('hidden');
    });
}

// 6. حفظ المنتج
window.saveCustomProduct = function(event) {
    event.preventDefault();
    
    const idField = document.getElementById('cp-id').value;
    const newProduct = {
        id: idField || 'cp_' + Date.now(), // توليد ID فريد
        category: document.getElementById('cp-category').value,
        name: document.getElementById('cp-name').value.trim(),
        image: document.getElementById('cp-image-base64').value,
        basePrice: parseFloat(document.getElementById('cp-base-price').value) || 0,
        colors: document.getElementById('cp-colors').value.trim(),
        face2Price: parseFloat(document.getElementById('cp-face2-price').value) || 0,
        label1: document.getElementById('cp-label-1').value.trim(),
        label2: document.getElementById('cp-label-2').value.trim(),
        labelNotes: document.getElementById('cp-label-notes').value.trim(),
        inStock: document.getElementById('cp-in-stock').checked
    };

    if (!newProduct.image) {
        showCustomAlert("خطأ", "يجب إرفاق صورة للمنتج!", false);
        return;
    }

    if (idField) {
        // تحديث
        const index = workshopConfig.products.findIndex(p => p.id === idField);
        if (index !== -1) workshopConfig.products[index] = newProduct;
    } else {
        // إضافة جديد
        workshopConfig.products.unshift(newProduct); // يضاف في بداية القائمة
    }

    document.getElementById('admin-custom-prod-modal').classList.add('hidden');
    document.getElementById('admin-custom-prod-modal').classList.remove('flex');
    
    saveWorkshopConfig();
}

// 7. تغيير حالة المخزون بضغطة زر
window.toggleCustomProdStock = function(id) {
    const prod = workshopConfig.products.find(p => p.id === id);
    if (prod) {
        prod.inStock = !prod.inStock;
        saveWorkshopConfig();
    }
}

// 8. حذف منتج
window.deleteCustomProduct = function(id) {
    if(confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        workshopConfig.products = workshopConfig.products.filter(p => p.id !== id);
        saveWorkshopConfig();
    }
}

// 9. الحفظ النهائي في فايربيس
async function saveWorkshopConfig() {
    if (typeof window.db !== 'undefined') {
        try {
            await window.db.collection("settings").doc("custom_workshop").set(workshopConfig);
            if(!state.storeSettings) state.storeSettings = {};
            state.storeSettings.custom_workshop = workshopConfig; // تحديث محلي
            
            renderCustomAdminSettings();
            showCustomAlert("نجاح", "تم حفظ وتحديث الورشة بنجاح!", true);
        } catch (error) {
            showCustomAlert("خطأ", "فشل الحفظ: " + error.message, false);
        }
    }
}

// Window Bindings
window.toggleCustomSystem = toggleCustomSystem;
window.loadCustomAdminData = loadCustomAdminData;
window.saveCustomServicesSettings = saveWorkshopConfig;
