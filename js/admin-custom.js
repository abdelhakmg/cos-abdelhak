// --- ملف js/admin-custom.js ---

import { state } from './store/state.js';
import { showCustomAlert } from './utils/helpers.js';

let workshopConfig = {
    isActive: true,
    products: [] // تخزين كافة منتجات الورشة الديناميكية
};
let adminCustomCategoryFilter = 'all';
let currentEditingTemplates = [];

export function setAdminCustomFilter(cat) {
    adminCustomCategoryFilter = cat || 'all';
    renderCustomAdminSettings();
}

// 1. تحميل بيانات الورشة من Firebase
export async function loadCustomAdminData() {
    if (typeof window.db !== 'undefined') {
        try {
            const doc = await window.db.collection('settings').doc('custom_workshop').get();
            if (doc.exists) {
                const data = doc.data();
                workshopConfig.isActive = data.isActive !== false;
                workshopConfig.products = data.products || [];
                
                if (!state.storeSettings) state.storeSettings = {};
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

// 2. تحديث حالة الورشة ككل (مفتوحة / مغلقة)
export function toggleCustomSystem(isActive, saveToDb = true) {
    workshopConfig.isActive = isActive;
    const statusText = document.getElementById('custom-status-text');
    if (statusText) {
        statusText.innerText = isActive ? "مفتوحة للطلبات 🟢" : "مغلقة مؤقتاً 🔴";
        statusText.className = isActive ? "mr-3 text-xs font-bold text-green-600" : "mr-3 text-xs font-bold text-gray-500";
    }
    if (saveToDb) saveWorkshopConfig();
}

// 3. رسم قائمة المنتجات في لوحة التحكم مع فلتر الأقسام
export function renderCustomAdminSettings() {
    const container = document.getElementById('admin-custom-settings-container');
    if (!container) return;

    const filterTabs = [
        { key: 'all', label: 'الكل', icon: 'fa-layer-group' },
        { key: 'laser', label: 'حفر بالليزر', icon: 'fa-fire' },
        { key: 'print', label: 'طباعة حرارية', icon: 'fa-mug-hot' },
        { key: 'frame', label: 'كادرات وصور', icon: 'fa-image' },
        { key: 'cameo', label: 'قص كاميو', icon: 'fa-scissors' }
    ];

    const filteredProducts = adminCustomCategoryFilter === 'all'
        ? workshopConfig.products
        : workshopConfig.products.filter(p => p.category === adminCustomCategoryFilter);

    let html = `
        <div class="col-span-1 md:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-1">
            <h4 class="font-black text-lg text-white">المنتجات والخدمات المعروضة (${workshopConfig.products.length})</h4>
            <button type="button" onclick="openAdminCustomProdModal()" class="bg-[#D4AF37] text-black font-black px-4 py-2.5 rounded-xl shadow-md hover:scale-105 transition flex items-center gap-2 text-sm cursor-pointer">
                <i class="fa-solid fa-plus"></i> إضافة منتج جديد
            </button>
        </div>

        <div class="col-span-1 md:col-span-2 flex flex-wrap gap-2 mb-2">
            ${filterTabs.map(t => {
                const count = t.key === 'all' ? workshopConfig.products.length : workshopConfig.products.filter(p => p.category === t.key).length;
                const isActive = adminCustomCategoryFilter === t.key;
                return `
                    <button type="button" onclick="setAdminCustomFilter('${t.key}')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${isActive ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md' : 'bg-[#1a1a1a] text-gray-300 border-gray-700 hover:border-[#D4AF37]/50'}">
                        <i class="fa-solid ${t.icon}"></i>
                        <span>${t.label}</span>
                        <span class="px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-black/20 text-black' : 'bg-black text-[#D4AF37]'}">${count}</span>
                    </button>
                `;
            }).join('')}
        </div>

        <div class="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    `;

    if (filteredProducts.length === 0) {
        html += `<div class="col-span-full text-center p-10 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold">لا توجد منتجات في هذا القسم حالياً. اضغط على "إضافة منتج جديد"!</div>`;
    } else {
        filteredProducts.forEach((p) => {
            const categoryIcon = p.category === 'laser' ? '<i class="fa-solid fa-fire text-red-500"></i>' : 
                                 p.category === 'print' ? '<i class="fa-solid fa-shirt text-purple-500"></i>' : 
                                 p.category === 'frame' ? '<i class="fa-solid fa-image text-blue-500"></i>' : 
                                 '<i class="fa-solid fa-scissors text-green-500"></i>';
            const templatesCount = Array.isArray(p.templates) ? p.templates.length : 0;
            
            html += `
                <div class="bg-white p-4 rounded-2xl border ${p.inStock ? 'border-gray-200' : 'border-red-200 bg-red-50'} shadow-sm relative group">
                    <div class="absolute top-2 right-2 flex gap-1">
                        <button type="button" onclick="openAdminCustomProdModal('${p.id}')" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex items-center justify-center transition cursor-pointer"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" onclick="deleteCustomProduct('${p.id}')" class="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center transition cursor-pointer"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    
                    <img src="${p.image || 'https://via.placeholder.com/150'}" class="w-20 h-20 object-cover rounded-xl border border-gray-100 mb-3 bg-gray-50" loading="lazy">
                    
                    <h5 class="font-black text-gray-800 text-sm line-clamp-1 mb-1">${categoryIcon} ${p.name}</h5>
                    <p class="text-[#B8860B] font-black text-sm mb-2">${(p.basePrice || 0).toLocaleString()} دج</p>
                    
                    <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                        <span class="text-[10px] font-bold text-gray-500">
                            ${templatesCount > 0 ? `🎨 ${templatesCount} تصاميم جاهزة` : (p.colors ? 'متوفر ألوان' : 'بدون خيارات ألوان')}
                        </span>
                        <button type="button" onclick="toggleCustomProdStock('${p.id}')" class="text-[10px] font-bold px-2 py-1 rounded border transition cursor-pointer ${p.inStock ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}">
                            ${p.inStock ? 'متوفر ✅' : 'نفدت الكمية ❌'}
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    container.innerHTML = html;
}

// 4. فتح نافذة الإضافة / التعديل
export function openAdminCustomProdModal(productId = null) {
    const form = document.getElementById('custom-prod-form');
    if (form) form.reset();
    
    const previewDiv = document.getElementById('cp-image-preview');
    const base64Input = document.getElementById('cp-image-base64');
    if (previewDiv) previewDiv.classList.add('hidden');
    if (base64Input) base64Input.value = '';
    currentEditingTemplates = [];
    const tplNameInput = document.getElementById('cp-template-name');
    if (tplNameInput) tplNameInput.value = '';
    
    if (productId) {
        const prod = workshopConfig.products.find(p => p.id === productId);
        if (prod) {
            document.getElementById('cp-id').value = prod.id;
            document.getElementById('cp-category').value = prod.category;
            document.getElementById('cp-name').value = prod.name;
            document.getElementById('cp-base-price').value = prod.basePrice;
            document.getElementById('cp-colors').value = prod.colors || '';
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
            currentEditingTemplates = Array.isArray(prod.templates) ? [...prod.templates] : [];
            
            if (prod.image) {
                document.getElementById('cp-image-base64').value = prod.image;
                document.getElementById('cp-img-tag').src = prod.image;
                document.getElementById('cp-image-preview').classList.remove('hidden');
            }
        }
    } else {
        document.getElementById('cp-id').value = '';
        document.getElementById('cp-img-req').value = 'optional';
        document.getElementById('cp-in-stock').checked = true;
    }

    renderAdminTemplatesList();

    const modal = document.getElementById('admin-custom-prod-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function renderAdminTemplatesList() {
    const listEl = document.getElementById('cp-templates-list');
    if (!listEl) return;
    if (currentEditingTemplates.length === 0) {
        listEl.innerHTML = '<p class="col-span-full text-[11px] text-gray-400 text-center py-2">لا توجد تصاميم جاهزة مضافة لهذا المنتج حالياً.</p>';
        return;
    }
    listEl.innerHTML = currentEditingTemplates.map(t => `
        <div class="relative bg-white border border-gray-200 rounded-xl p-1.5 text-center shadow-sm">
            <button type="button" onclick="removeAdminTemplate('${t.id}')" class="absolute -top-2 -left-2 w-6 h-6 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center shadow hover:bg-red-700 cursor-pointer" title="حذف النموذج">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <img src="${t.image}" class="w-full h-20 object-cover rounded-lg bg-gray-100 mb-1" loading="lazy">
            <p class="text-[10px] font-bold text-gray-700 line-clamp-1">${t.name}</p>
        </div>
    `).join('');
}

export async function handleAdminTemplateUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const btn = document.getElementById('cp-template-upload-btn');
    const nameInput = document.getElementById('cp-template-name');
    const originalHtml = btn ? btn.innerHTML : '';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الرفع...';
    }

    try {
        const downloadURL = await window.compressAndUploadImage(file, 'workshop_templates', 600);
        const tplName = (nameInput?.value || '').trim() || `نموذج #${currentEditingTemplates.length + 1}`;
        currentEditingTemplates.push({
            id: 'tpl_' + Date.now(),
            name: tplName,
            image: downloadURL
        });
        if (nameInput) nameInput.value = '';
        event.target.value = '';
        renderAdminTemplatesList();
    } catch (error) {
        showCustomAlert("خطأ", "فشل رفع صورة النموذج: " + error.message, false);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }
}

export function removeAdminTemplate(tplId) {
    currentEditingTemplates = currentEditingTemplates.filter(t => t.id !== tplId);
    renderAdminTemplatesList();
}

// 🌟 5. ضغط الصور الذكي (500x500 بصيغة WebP لتجنب تجاوز حد 1MB في Firestore)

export async function handleAdminCustomImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const previewDiv = document.getElementById('cp-image-preview');
    const imgTag = document.getElementById('cp-img-tag');
    const base64Input = document.getElementById('cp-image-base64');
    
    if (previewDiv) previewDiv.classList.add('hidden');
    
    try {
        // نستخدم base64Input لتخزين الرابط النهائي لتجنب كسر كود الحفظ
        const downloadURL = await window.compressAndUploadImage(file, 'workshop_products', 500);
        base64Input.value = downloadURL; 
        imgTag.src = downloadURL;
        previewDiv.classList.remove('hidden');
    } catch(error) {
        showCustomAlert("خطأ", "فشل رفع الصورة: " + error.message, false);
    }
}

// 6. حفظ المنتج في المصفوفة وتحديث القاعدة
export function saveCustomProduct(event) {
    if (event) event.preventDefault();
    
    const idField = document.getElementById('cp-id').value;
    const newProduct = {
        id: idField || 'cp_' + Date.now(),
        category: document.getElementById('cp-category').value,
        name: document.getElementById('cp-name').value.trim(),
        image: document.getElementById('cp-image-base64').value,
        basePrice: parseFloat(document.getElementById('cp-base-price').value) || 0,
        colors: document.getElementById('cp-colors').value.trim(),
        sizes: document.getElementById('cp-sizes').value.trim(),
        fonts: document.getElementById('cp-fonts').value.trim(),
        positions: document.getElementById('cp-positions').value.trim(),
        maxChars: document.getElementById('cp-max-chars').value ? parseInt(document.getElementById('cp-max-chars').value) : null,
        imgReq: document.getElementById('cp-img-req').value,
        face2Price: parseFloat(document.getElementById('cp-face2-price').value) || 0,
        label1: document.getElementById('cp-label-1').value.trim(),
        label2: document.getElementById('cp-label-2').value.trim(),
        labelNotes: document.getElementById('cp-label-notes').value.trim(),
        templates: [...currentEditingTemplates],
        inStock: document.getElementById('cp-in-stock').checked
    };

    if (!newProduct.image) {
        showCustomAlert("خطأ", "يجب إرفاق صورة للمنتج!", false);
        return;
    }

    if (idField) {
        const index = workshopConfig.products.findIndex(p => p.id === idField);
        if (index !== -1) workshopConfig.products[index] = newProduct;
    } else {
        workshopConfig.products.unshift(newProduct);
    }

    const modal = document.getElementById('admin-custom-prod-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    saveWorkshopConfig();
}

// 7. تغيير حالة المخزون بضغطة زر
export function toggleCustomProdStock(id) {
    const prod = workshopConfig.products.find(p => p.id === id);
    if (prod) {
        prod.inStock = !prod.inStock;
        saveWorkshopConfig();
    }
}

// 8. حذف منتج من الورشة
export function deleteCustomProduct(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        workshopConfig.products = workshopConfig.products.filter(p => p.id !== id);
        saveWorkshopConfig();
    }
}

// 9. الحفظ النهائي في Firebase
export async function saveWorkshopConfig() {
    if (typeof window.db !== 'undefined') {
        try {
            await window.db.collection("settings").doc("custom_workshop").set(workshopConfig);
            if (!state.storeSettings) state.storeSettings = {};
            state.storeSettings.custom_workshop = workshopConfig;
            
            renderCustomAdminSettings();
            showCustomAlert("نجاح", "تم حفظ وتحديث الورشة بنجاح!", true);
        } catch (error) {
            showCustomAlert("خطأ", "فشل الحفظ: " + error.message, false);
        }
    }
}

// Window Bindings
window.loadCustomAdminData = loadCustomAdminData;
window.toggleCustomSystem = toggleCustomSystem;
window.renderCustomAdminSettings = renderCustomAdminSettings;
window.openAdminCustomProdModal = openAdminCustomProdModal;
window.handleAdminCustomImage = handleAdminCustomImage;
window.saveCustomProduct = saveCustomProduct;
window.toggleCustomProdStock = toggleCustomProdStock;
window.deleteCustomProduct = deleteCustomProduct;
window.saveCustomServicesSettings = saveWorkshopConfig;
window.setAdminCustomFilter = setAdminCustomFilter;
window.handleAdminTemplateUpload = handleAdminTemplateUpload;
window.removeAdminTemplate = removeAdminTemplate;
