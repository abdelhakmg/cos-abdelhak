// --- ملف js/admin-custom.js ---

import { state } from './store/state.js';
import { showCustomAlert } from './utils/helpers.js';

// الهيكل الافتراضي لأسعار الورشة (سيتم حفظه وتحديثه من Firebase)
let customServicesConfig = {
    isActive: true,
    laser: { face1Price: 1000, face2Price: 500 },
    print: { magicMug: 1500, whiteMug: 1000, tshirtOneSide: 1800, tshirtTwoSides: 2200 },
    frames: { sizeA5: 800, sizeA4: 1200, sizeA3: 2000, foilAddon: 500 },
    cameo: { basePrice: 500, wordPrice: 100 }
};

// 1. تحميل الإعدادات من قاعدة البيانات عند فتح الإدارة
export async function loadCustomAdminData() {
    if (typeof window.db !== 'undefined') {
        try {
            const doc = await window.db.collection('settings').doc('custom_workshop').get();
            if (doc.exists) {
                customServicesConfig = { ...customServicesConfig, ...doc.data() };
                
                // حفظ نسخة محلية لتستخدمها واجهة الزبون لاحقاً
                if(!state.storeSettings) state.storeSettings = {};
                state.storeSettings.custom_workshop = customServicesConfig;
            }
        } catch (error) {
            console.error("خطأ في جلب بيانات الورشة:", error);
        }
    }
    
    // تحديث زر التشغيل الرئيسي (Master Switch)
    const masterSwitch = document.getElementById('custom-master-switch');
    if (masterSwitch) {
        masterSwitch.checked = customServicesConfig.isActive !== false;
        toggleCustomSystem(masterSwitch.checked);
    }

    renderCustomAdminSettings();
}

// 2. تحديث حالة الزر (مفتوحة / مغلقة)
export function toggleCustomSystem(isActive) {
    customServicesConfig.isActive = isActive;
    const statusText = document.getElementById('custom-status-text');
    if (statusText) {
        statusText.innerText = isActive ? "مفتوحة للطلبات 🟢" : "مغلقة مؤقتاً 🔴";
        statusText.className = isActive ? "mr-3 text-xs font-bold text-green-600" : "mr-3 text-xs font-bold text-gray-500";
    }
}

// 3. رسم واجهة الإعدادات الديناميكية للمدير
export function renderCustomAdminSettings() {
    const container = document.getElementById('admin-custom-settings-container');
    if (!container) return;

    container.innerHTML = `
        <!-- إعدادات الليزر -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h4 class="font-bold text-gray-800 border-b pb-2"><i class="fa-solid fa-fire text-red-500 ml-1"></i> حفر الليزر (دج)</h4>
            <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">الوجه الأساسي (1)</label>
                <input type="number" id="laser-face1" value="${customServicesConfig.laser.face1Price}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">إضافة وجه آخر (+)</label>
                <input type="number" id="laser-face2" value="${customServicesConfig.laser.face2Price}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
            </div>
        </div>

        <!-- إعدادات الطباعة الحرارية -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h4 class="font-bold text-gray-800 border-b pb-2"><i class="fa-solid fa-shirt text-purple-500 ml-1"></i> الطباعة الحرارية (أكواب / تيشيرت)</h4>
            <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">كأس أبيض عادي</label>
                <input type="number" id="print-mug-white" value="${customServicesConfig.print.whiteMug}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">كأس سحري</label>
                <input type="number" id="print-mug-magic" value="${customServicesConfig.print.magicMug}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">تيشيرت (وجه واحد)</label>
                <input type="number" id="print-ts-1" value="${customServicesConfig.print.tshirtOneSide}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">تيشيرت (وجهين)</label>
                <input type="number" id="print-ts-2" value="${customServicesConfig.print.tshirtTwoSides}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
            </div>
        </div>

        <!-- إعدادات الكادرات والفؤيل -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h4 class="font-bold text-gray-800 border-b pb-2"><i class="fa-solid fa-image text-blue-500 ml-1"></i> الكادرات والفؤيل الذهبي</h4>
            <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">كادر A5</label>
                <input type="number" id="frame-a5" value="${customServicesConfig.frames.sizeA5}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">كادر A4</label>
                <input type="number" id="frame-a4" value="${customServicesConfig.frames.sizeA4}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">كادر A3</label>
                <input type="number" id="frame-a3" value="${customServicesConfig.frames.sizeA3}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">إضافة فويل ذهبي (+)</label>
                <input type="number" id="frame-foil" value="${customServicesConfig.frames.foilAddon}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
            </div>
        </div>

        <!-- إعدادات الكاميو -->
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h4 class="font-bold text-gray-800 border-b pb-2"><i class="fa-solid fa-scissors text-green-500 ml-1"></i> قص الكاميو 5</h4>
            <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">السعر الأساسي</label>
                <input type="number" id="cameo-base" value="${customServicesConfig.cameo.basePrice}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
                <div><label class="block text-[10px] font-bold text-gray-600 mb-1">سعر الكلمة الإضافية</label>
                <input type="number" id="cameo-word" value="${customServicesConfig.cameo.wordPrice}" class="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-[#D4AF37] bg-gray-50"></div>
            </div>
        </div>
    `;
}

// 4. حفظ الإعدادات في قاعدة البيانات
export async function saveCustomServicesSettings() {
    try {
        // تحديث الكائن من الحقول التي أدخلها المدير
        customServicesConfig.laser.face1Price = parseFloat(document.getElementById('laser-face1').value) || 0;
        customServicesConfig.laser.face2Price = parseFloat(document.getElementById('laser-face2').value) || 0;

        customServicesConfig.print.whiteMug = parseFloat(document.getElementById('print-mug-white').value) || 0;
        customServicesConfig.print.magicMug = parseFloat(document.getElementById('print-mug-magic').value) || 0;
        customServicesConfig.print.tshirtOneSide = parseFloat(document.getElementById('print-ts-1').value) || 0;
        customServicesConfig.print.tshirtTwoSides = parseFloat(document.getElementById('print-ts-2').value) || 0;

        customServicesConfig.frames.sizeA5 = parseFloat(document.getElementById('frame-a5').value) || 0;
        customServicesConfig.frames.sizeA4 = parseFloat(document.getElementById('frame-a4').value) || 0;
        customServicesConfig.frames.sizeA3 = parseFloat(document.getElementById('frame-a3').value) || 0;
        customServicesConfig.frames.foilAddon = parseFloat(document.getElementById('frame-foil').value) || 0;

        customServicesConfig.cameo.basePrice = parseFloat(document.getElementById('cameo-base').value) || 0;
        customServicesConfig.cameo.wordPrice = parseFloat(document.getElementById('cameo-word').value) || 0;

        if (typeof window.db !== 'undefined') {
            await window.db.collection("settings").doc("custom_workshop").set(customServicesConfig, { merge: true });
            showCustomAlert("تم الحفظ 🎉", "تم تحديث أسعار الورشة بنجاح!", true);
            
            // تحديث محلي لكي تعمل واجهة الزبون بالأسعار الجديدة فوراً
            if(!state.storeSettings) state.storeSettings = {};
            state.storeSettings.custom_workshop = customServicesConfig;
        }
    } catch (error) {
        showCustomAlert("خطأ", "حدث خطأ أثناء الحفظ: " + error.message, false);
    }
}

// تصدير الدوال للاستخدام المباشر في HTML
window.toggleCustomSystem = toggleCustomSystem;
window.saveCustomServicesSettings = saveCustomServicesSettings;
window.loadCustomAdminData = loadCustomAdminData;
