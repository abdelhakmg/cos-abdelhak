// --- ملف js/admin-digital.js (لوحة تحكم الخدمات الإلكترونية والشحن الفوري - معزول تماماً) ---
import { showCustomAlert } from './utils/helpers.js';

let digitalOrdersUnsub = null;
const admDigState = {
    orders: [],
    categories: [],
    services: [],
    packages: [],
    settings: { isActive: true, bannerImage: '', baridiImage: '' },
    activeSubTab: 'orders',
    editingPkgId: '',
    editingCatId: '',
    pkgFields: []
};

function isSuperAdmin() {
    return (localStorage.getItem('cosAdminRole') || 'super') === 'super';
}

// 1. نقطة الدخول الرئيسية عند فتح تبويب الخدمات الإلكترونية في لوحة التحكم
export async function loadDigitalAdminData() {
    const container = document.getElementById('admin-digital-root');
    if (!container || typeof window.db === 'undefined') return;

    const superUser = isSuperAdmin();

    // بناء الهيكل الأساسي للوحة
    container.innerHTML = `
        <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5 text-gray-900">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                <div>
                    <h3 class="font-black text-xl text-gray-900"><i class="fa-solid fa-bolt text-[#D4AF37] ml-1"></i> إدارة الخدمات الإلكترونية والشحن الفوري</h3>
                    <p class="text-xs text-gray-500 mt-1">${superUser ? 'تحكم كامل بالطلبات، الأقسام، الباقات، والبانر الإعلاني.' : 'متابعة وتنفيذ طلبات الشحن ومراجعة وصولات الدفع.'}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button onclick="switchDigitalSubTab('orders')" id="dig-subbtn-orders" class="dig-sub-btn px-4 py-2 rounded-xl text-xs font-bold bg-black text-[#D4AF37] cursor-pointer">📥 طلبات الشحن</button>
                    ${superUser ? `
                        <button onclick="switchDigitalSubTab('catalog')" id="dig-subbtn-catalog" class="dig-sub-btn px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">🗂️ الأقسام والخدمات</button>
                        <button onclick="switchDigitalSubTab('packages')" id="dig-subbtn-packages" class="dig-sub-btn px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">📦 الباقات والأسعار</button>
                        <button onclick="switchDigitalSubTab('settings')" id="dig-subbtn-settings" class="dig-sub-btn px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer">🎨 البانر والإعدادات</button>
                    ` : ''}
                </div>
            </div>

            <!-- 1. قسم الطلبات -->
            <div id="dig-panel-orders" class="dig-sub-panel space-y-4">
                <div class="flex flex-wrap justify-between items-center gap-3">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-black text-gray-800">سجل طلبات الشحن (<span id="dig-orders-count" class="text-[#B8860B]">0</span>)</span>
                    </div>
                    <select id="dig-orders-filter" onchange="renderDigitalOrdersTable()" class="border border-gray-300 p-2 rounded-xl text-xs font-bold bg-gray-50 outline-none cursor-pointer">
                        <option value="الجميع">جميع الطلبات 📋</option>
                        <option value="جديد">🟡 الجديدة فقط</option>
                        <option value="قيد التنفيذ">🔵 قيد التنفيذ</option>
                        <option value="مكتمل">🟢 المكتملة</option>
                        <option value="مرفوض">🔴 المرفوضة</option>
                    </select>
                </div>
                <div class="overflow-x-auto rounded-xl border border-gray-100">
                    <table class="w-full text-right text-xs">
                        <thead class="bg-gray-50 border-b text-gray-700">
                            <tr>
                                <th class="p-3 font-bold">التاريخ والزبون</th>
                                <th class="p-3 font-bold">الخدمة والباقة</th>
                                <th class="p-3 font-bold">بيانات الحساب (نسخ سريع)</th>
                                <th class="p-3 font-bold text-center">وصل بريدي موب</th>
                                <th class="p-3 font-bold text-center">الحالة</th>
                                <th class="p-3 font-bold text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="dig-orders-tbody" class="divide-y divide-gray-100">
                            <tr><td colspan="6" class="text-center py-8 text-gray-400">جاري جلب الطلبات...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            ${superUser ? `
            <!-- 2. قسم الأقسام والخدمات -->
            <div id="dig-panel-catalog" class="dig-sub-panel hidden space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- إضافة قسم رئيسي -->
                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                        <h4 class="font-bold text-sm text-gray-800 border-b pb-2"><i class="fa-solid fa-folder-plus text-[#B8860B]"></i> إضافة قسم رئيسي (مثال: شحن الألعاب)</h4>
                        <form onsubmit="saveDigitalCategory(event)" class="space-y-3">
                            <input type="text" id="dig-cat-name" placeholder="اسم القسم *" required class="w-full border p-2.5 rounded-xl text-xs bg-white outline-none focus:border-[#D4AF37]">
                            <div class="flex gap-2">
                                <input type="file" id="dig-cat-file" accept="image/*" class="hidden" onchange="uploadDigitalAdminImg(event, 'dig-cat-img')">
                                <button type="button" onclick="document.getElementById('dig-cat-file').click()" class="bg-[#D4AF37] text-black font-bold px-3 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer"><i class="fa-solid fa-upload"></i> صورة</button>
                                <input type="url" id="dig-cat-img" placeholder="رابط صورة القسم *" required class="flex-1 border p-2.5 rounded-xl text-xs bg-white outline-none">
                            </div>
                            <div class="flex gap-2">
                                <input type="file" id="dig-cat-banner-file" accept="image/*" class="hidden" onchange="uploadDigitalAdminImg(event, 'dig-cat-banner')">
                                <button type="button" onclick="document.getElementById('dig-cat-banner-file').click()" class="bg-gray-800 text-[#D4AF37] font-bold px-3 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer"><i class="fa-regular fa-image"></i> بانر القسم</button>
                                <input type="url" id="dig-cat-banner" placeholder="رابط بانر إعلاني خاص بهذا القسم (اختياري)" class="flex-1 border p-2.5 rounded-xl text-xs bg-white outline-none">
                            </div>
                            <div class="flex gap-2">
                                <input type="number" id="dig-cat-order" placeholder="الترتيب (مثال: 1)" value="1" class="w-28 border p-2.5 rounded-xl text-xs bg-white outline-none">
                                <button type="submit" class="flex-1 bg-black text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#D4AF37] hover:text-black transition cursor-pointer">حفظ القسم</button>
                            </div>
                        </form>
                        <div id="dig-admin-cats-list" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-h-72 overflow-y-auto"></div>
                    </div>

                    <!-- إضافة خدمة داخل قسم -->
                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                        <h4 class="font-bold text-sm text-gray-800 border-b pb-2"><i class="fa-solid fa-gamepad text-[#B8860B]"></i> إضافة خدمة / لعبة (مثال: فري فاير، نتفلكس)</h4>
                        <form onsubmit="saveDigitalService(event)" class="space-y-3">
                            <select id="dig-srv-cat" required class="w-full border p-2.5 rounded-xl text-xs bg-white outline-none focus:border-[#D4AF37]"></select>
                            <input type="text" id="dig-srv-name" placeholder="اسم الخدمة / اللعبة *" required class="w-full border p-2.5 rounded-xl text-xs bg-white outline-none focus:border-[#D4AF37]">
                            <div class="flex gap-2">
                                <input type="file" id="dig-srv-file" accept="image/*" class="hidden" onchange="uploadDigitalAdminImg(event, 'dig-srv-img')">
                                <button type="button" onclick="document.getElementById('dig-srv-file').click()" class="bg-[#D4AF37] text-black font-bold px-3 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer"><i class="fa-solid fa-upload"></i> صورة</button>
                                <input type="url" id="dig-srv-img" placeholder="رابط صورة الخدمة *" required class="flex-1 border p-2.5 rounded-xl text-xs bg-white outline-none">
                            </div>
                            <button type="submit" class="w-full bg-black text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#D4AF37] hover:text-black transition cursor-pointer">حفظ الخدمة</button>
                        </form>
                        <div id="dig-admin-srvs-list" class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-h-72 overflow-y-auto"></div>
                    </div>
                </div>
            </div>

            <!-- 3. قسم الباقات وصانع الحقول -->
            <div id="dig-panel-packages" class="dig-sub-panel hidden space-y-6">
                <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                    <div class="flex justify-between items-center border-b pb-2">
                        <h4 id="dig-pkg-form-title" class="font-bold text-sm text-[#B8860B]"><i class="fa-solid fa-box"></i> إضافة / تعديل باقة شحن</h4>
                        <button type="button" id="dig-pkg-cancel-btn" onclick="resetDigitalPkgForm()" class="hidden text-xs bg-red-100 text-red-600 font-bold px-3 py-1 rounded-lg cursor-pointer">إلغاء التعديل</button>
                    </div>
                    <form onsubmit="saveDigitalPackage(event)" id="dig-pkg-form" class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select id="dig-pkg-srv" required class="border p-2.5 rounded-xl text-xs bg-white outline-none focus:border-[#D4AF37]"></select>
                        <input type="text" id="dig-pkg-name" placeholder="اسم الباقة (مثال: 100 جوهرة، شهر نتفلكس) *" required class="border p-2.5 rounded-xl text-xs bg-white outline-none focus:border-[#D4AF37]">
                        <input type="text" id="dig-pkg-subgroup" placeholder="مجموعة فرعية (اختياري: جواهر، عضويات)" class="border p-2.5 rounded-xl text-xs bg-white outline-none">

                        <input type="number" id="dig-pkg-price" placeholder="السعر النهائي للزبون (دج) *" required class="border p-2.5 rounded-xl text-xs bg-white outline-none focus:border-[#D4AF37]">
                        <input type="number" id="dig-pkg-oldprice" placeholder="السعر القديم (اختياري)" class="border p-2.5 rounded-xl text-xs bg-white outline-none">
                        <input type="text" id="dig-pkg-badge" placeholder="شارة خصم (اختياري: عرض 15%)" class="border p-2.5 rounded-xl text-xs bg-white outline-none">

                        <div class="flex gap-2 md:col-span-2">
                            <input type="file" id="dig-pkg-file" accept="image/*" class="hidden" onchange="uploadDigitalAdminImg(event, 'dig-pkg-img')">
                            <button type="button" onclick="document.getElementById('dig-pkg-file').click()" class="bg-[#D4AF37] text-black font-bold px-3 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer"><i class="fa-solid fa-upload"></i> صورة الباقة</button>
                            <input type="url" id="dig-pkg-img" placeholder="رابط صورة الباقة (اتركه فارغاً لاستخدام صورة الخدمة)" class="flex-1 border p-2.5 rounded-xl text-xs bg-white outline-none">
                        </div>

                        <select id="dig-pkg-qtymode" onchange="toggleDigitalCustomQtyInputs()" class="border p-2.5 rounded-xl text-xs bg-white outline-none font-bold">
                            <option value="fixed">الكمية: ثابتة (عنصر واحد)</option>
                            <option value="stepper">الكمية: عداد (+/-)</option>
                            <option value="custom">الكمية: عدد حر بحد أدنى (دعم سوشيال)</option>
                        </select>

                        <div id="dig-custom-qty-box" class="hidden md:col-span-3 grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
                            <input type="number" id="dig-pkg-minqty" placeholder="الحد الأدنى (مثال: 500)" value="500" class="border p-2 rounded-lg text-xs bg-white">
                            <input type="number" id="dig-pkg-stepqty" placeholder="مقدار الزيادة (مثال: 100)" value="100" class="border p-2 rounded-lg text-xs bg-white">
                        </div>

                        <!-- صانع الحقول المطلوبة من الزبون -->
                        <div class="md:col-span-3 bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                            <div class="flex flex-wrap justify-between items-center gap-2">
                                <span class="text-xs font-black text-gray-800"><i class="fa-solid fa-list-check text-[#B8860B]"></i> الحقول المطلوبة من الزبون (اتركها فارغة إذا كانت بطاقة/كود):</span>
                                <div class="flex flex-wrap gap-1.5">
                                    <button type="button" onclick="addDigitalFieldPreset('أيدي اللاعب (ID)', 'text')" class="bg-gray-100 hover:bg-[#D4AF37] text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">+ ID اللاعب</button>
                                    <button type="button" onclick="addDigitalFieldPreset('السيرفر (Server)', 'select', ['europe', 'asia', 'america', 'tw_hk_mo'])" class="bg-gray-100 hover:bg-[#D4AF37] text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">+ سيرفر</button>
                                    <button type="button" onclick="addDigitalFieldPreset('البريد الإلكتروني (Email)', 'text')" class="bg-gray-100 hover:bg-[#D4AF37] text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">+ إيميل</button>
                                    <button type="button" onclick="addDigitalFieldPreset('كلمة المرور (Password)', 'text')" class="bg-gray-100 hover:bg-[#D4AF37] text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">+ كلمة سر</button>
                                    <button type="button" onclick="addDigitalFieldPreset('رابط الحساب أو المنشور (Link)', 'text')" class="bg-gray-100 hover:bg-[#D4AF37] text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">+ رابط</button>
                                    <button type="button" onclick="addDigitalFieldPreset('رقم السيريال (SN / IMEI)', 'text')" class="bg-gray-100 hover:bg-[#D4AF37] text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">+ سيريال</button>
                                    <button type="button" onclick="addDigitalFieldPreset('', 'text')" class="bg-black text-[#D4AF37] text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer">+ حقل مخصص</button>
                                </div>
                            </div>
                            <div id="dig-pkg-fields-list" class="space-y-2"></div>
                        </div>

                        <textarea id="dig-pkg-notes" rows="3" placeholder="ملاحظات وشروط التنفيذ للزبون (مثال: أوقات العمل، مدة التنفيذ، رابط تحميل أداة...)" class="md:col-span-3 border p-3 rounded-xl text-xs bg-white outline-none focus:border-[#D4AF37]"></textarea>

                        <button type="submit" class="md:col-span-3 bg-black text-white font-black py-3 rounded-xl text-xs hover:bg-[#D4AF37] hover:text-black transition shadow cursor-pointer">حفظ الباقة</button>
                    </form>
                </div>

                <!-- جدول الباقات الحالية -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-sm text-gray-800">الباقات المضافة حالياً:</h4>
                        <select id="dig-pkg-filter-srv" onchange="renderDigitalPackagesTable()" class="border p-2 rounded-xl text-xs bg-gray-50 font-bold outline-none"></select>
                    </div>
                    <div class="overflow-x-auto rounded-xl border border-gray-100 max-h-96 overflow-y-auto">
                        <table class="w-full text-right text-xs">
                            <thead class="bg-gray-50 border-b text-gray-700">
                                <tr>
                                    <th class="p-3">الباقة</th>
                                    <th class="p-3">الخدمة</th>
                                    <th class="p-3">السعر</th>
                                    <th class="p-3">الحقول</th>
                                    <th class="p-3 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="dig-admin-pkgs-tbody" class="divide-y divide-gray-100"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 4. قسم البانر والإعدادات -->
            <div id="dig-panel-settings" class="dig-sub-panel hidden space-y-5">
                <div class="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                    <div class="flex justify-between items-center border-b pb-3">
                        <span class="font-bold text-sm text-gray-800">حالة قسم الخدمات الإلكترونية في المتجر:</span>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="dig-set-active" checked class="w-5 h-5 accent-emerald-600">
                            <span class="text-xs font-bold text-gray-700">مفعّل وظاهر للزبائن</span>
                        </label>
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-bold text-gray-700">صورة البانر الإعلاني لعروض الشحن (يظهر في الصفحة الرئيسية وأعلى القسم):</label>
                        <div class="flex gap-2">
                            <input type="file" id="dig-banner-file" accept="image/*" class="hidden" onchange="uploadDigitalAdminImg(event, 'dig-set-banner')">
                            <button type="button" onclick="document.getElementById('dig-banner-file').click()" class="bg-[#D4AF37] text-black font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap cursor-pointer"><i class="fa-solid fa-cloud-arrow-up"></i> رفع بانر جديد</button>
                            <input type="url" id="dig-set-banner" placeholder="رابط صورة البانر الإعلاني..." class="flex-1 border p-2.5 rounded-xl text-xs bg-white outline-none">
                        </div>
                        <img id="dig-banner-preview" src="" class="hidden w-full max-h-44 object-cover rounded-xl border border-gray-300 mt-2">
                    </div>

                    <div class="space-y-2">
                        <label class="block text-xs font-bold text-gray-700">صورة حساب بريدي موب (اختياري - اتركه فارغاً لاستخدام صورة المتجر الحالية):</label>
                        <input type="url" id="dig-set-baridi" placeholder="رابط صورة RIP بريدي موب..." class="w-full border p-2.5 rounded-xl text-xs bg-white outline-none">
                    </div>

                    <button onclick="saveDigitalSettings()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs shadow transition cursor-pointer">
                        <i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات ونشر البانر
                    </button>
                </div>
            </div>
            ` : ''}
        </div>
    `;

    // تشغيل مزامنة الطلبات الحية
    initDigitalOrdersSync();

    // إذا كان المدير الأساسي، نجلب الأقسام والخدمات والباقات والإعدادات
    if (superUser) {
        await fetchDigitalAdminCatalog();
    }
}

export function switchDigitalSubTab(tab) {
    admDigState.activeSubTab = tab;
    document.querySelectorAll('.dig-sub-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.dig-sub-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-[#D4AF37]');
        b.classList.add('bg-gray-100', 'text-gray-700');
    });

    const panel = document.getElementById('dig-panel-' + tab);
    const btn = document.getElementById('dig-subbtn-' + tab);
    if (panel) panel.classList.remove('hidden');
    if (btn) {
        btn.classList.remove('bg-gray-100', 'text-gray-700');
        btn.classList.add('bg-black', 'text-[#D4AF37]');
    }
}

// 2. مزامنة وعرض طلبات الشحن (للمدير والمشرفين)
function initDigitalOrdersSync() {
    if (digitalOrdersUnsub) digitalOrdersUnsub();
    digitalOrdersUnsub = window.db.collection('digital_orders')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .onSnapshot(snap => {
            admDigState.orders = [];
            snap.forEach(d => admDigState.orders.push({ id: d.id, ...d.data() }));
            renderDigitalOrdersTable();
        }, err => console.warn('Digital orders sync:', err));
}

export function renderDigitalOrdersTable() {
    const tbody = document.getElementById('dig-orders-tbody');
    const countEl = document.getElementById('dig-orders-count');
    const filterVal = document.getElementById('dig-orders-filter')?.value || 'الجميع';
    if (!tbody) return;

    let list = admDigState.orders;
    if (filterVal !== 'الجميع') list = list.filter(o => (o.status || 'جديد') === filterVal);
    if (countEl) countEl.innerText = list.length;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400 font-bold">لا توجد طلبات شحن حالياً.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(o => {
        const st = o.status || 'جديد';
        let badge = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (st === 'قيد التنفيذ') badge = 'bg-blue-100 text-blue-800 border-blue-200';
        if (st === 'مكتمل') badge = 'bg-green-100 text-green-800 border-green-200';
        if (st === 'مرفوض') badge = 'bg-red-100 text-red-800 border-red-200';

        let dateStr = '';
        if (o.createdAt) {
            const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            dateStr = d.toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
        }

        const fieldsHtml = (Array.isArray(o.customFields) && o.customFields.length > 0)
            ? o.customFields.map(f => `
                <div class="flex items-center justify-between gap-2 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 mb-1">
                    <span class="truncate max-w-[160px]"><b>${f.label}:</b> <span class="font-mono text-blue-700">${f.value}</span></span>
                    <button type="button" onclick="copyDigitalText('${String(f.value).replace(/'/g, "\\'")}')" class="text-[#B8860B] hover:text-black font-bold px-1.5 py-0.5 bg-white rounded border cursor-pointer" title="نسخ"><i class="fa-regular fa-copy"></i></button>
                </div>`).join('')
            : '<span class="text-gray-400 italic">كود / حساب جاهز (يُرسل عبر واتساب)</span>';

        let cleanPhone = (o.phone || '').replace(/\s+/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '213' + cleanPhone.substring(1);
        const waMsg = encodeURIComponent(`مرحباً ${o.customer}، بخصوص طلبك (${o.packageName}) من متجر كوسمتيك عبد الحق: تم تنفيذ طلبك بنجاح ✅`);

        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="p-3">
                    <div class="font-bold text-gray-900">${o.customer}</div>
                    <div class="text-[11px] font-mono text-gray-500">${o.phone}</div>
                    <div class="text-[10px] text-gray-400 mt-0.5">${dateStr}</div>
                </td>
                <td class="p-3">
                    <div class="font-black text-gray-900">${o.packageName}</div>
                    <div class="text-[10px] text-gray-500">${o.serviceName || ''} ${o.quantity > 1 ? `| العدد: <b>${o.quantity}</b>` : ''}</div>
                    <div class="font-black text-[#B8860B] mt-1">${Number(o.total || 0).toLocaleString()} دج</div>
                </td>
                <td class="p-3 min-w-[200px]">${fieldsHtml}</td>
                <td class="p-3 text-center">
                    ${o.receiptUrl ? `<img src="${o.receiptUrl}" onclick="openImageModal(this.src)" class="w-12 h-12 object-cover rounded-lg border-2 border-blue-500 cursor-zoom-in mx-auto shadow-sm" title="اضغط لتكبير الوصل">` : '-'}
                </td>
                <td class="p-3 text-center">
                    <select onchange="updateDigitalOrderStatus('${o.id}', this.value)" class="text-xs font-bold p-1.5 rounded-lg border outline-none cursor-pointer ${badge}">
                        <option value="جديد" ${st === 'جديد' ? 'selected' : ''}>🟡 جديد</option>
                        <option value="قيد التنفيذ" ${st === 'قيد التنفيذ' ? 'selected' : ''}>🔵 قيد التنفيذ</option>
                        <option value="مكتمل" ${st === 'مكتمل' ? 'selected' : ''}>🟢 مكتمل</option>
                        <option value="مرفوض" ${st === 'مرفوض' ? 'selected' : ''}>🔴 مرفوض</option>
                    </select>
                </td>
                <td class="p-3 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="bg-emerald-50 text-emerald-600 border border-emerald-200 p-2 rounded-lg hover:bg-emerald-100" title="مراسلة الزبون عبر واتساب"><i class="fa-brands fa-whatsapp text-sm"></i></a>
                        <button type="button" onclick="deleteDigitalOrder('${o.id}')" class="bg-red-50 text-red-600 border border-red-200 p-2 rounded-lg hover:bg-red-100 cursor-pointer" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

export function copyDigitalText(txt) {
    navigator.clipboard.writeText(txt).then(() => {
        showCustomAlert('تم النسخ 📋', `تم نسخ: ${txt}`, true);
    });
}

export function updateDigitalOrderStatus(id, status) {
    window.db.collection('digital_orders').doc(id).update({ status });
}

export function deleteDigitalOrder(id) {
    if (confirm('هل أنت متأكد من حذف طلب الشحن هذا؟')) {
        window.db.collection('digital_orders').doc(id).delete();
    }
}

// 3. إدارة الأقسام والخدمات والباقات (للمدير الأساسي فقط)
async function fetchDigitalAdminCatalog() {
    const [setDoc, catSnap, srvSnap, pkgSnap] = await Promise.all([
        window.db.collection('digital_settings').doc('main').get(),
        window.db.collection('digital_categories').get(),
        window.db.collection('digital_services').get(),
        window.db.collection('digital_packages').get()
    ]);

    if (setDoc.exists) admDigState.settings = { ...admDigState.settings, ...setDoc.data() };
    admDigState.categories = [];
    catSnap.forEach(d => admDigState.categories.push({ id: d.id, ...d.data() }));
    admDigState.categories.sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

    admDigState.services = [];
    srvSnap.forEach(d => admDigState.services.push({ id: d.id, ...d.data() }));

    admDigState.packages = [];
    pkgSnap.forEach(d => admDigState.packages.push({ id: d.id, ...d.data() }));

    // تعبئة الإعدادات
    const actEl = document.getElementById('dig-set-active');
    const banEl = document.getElementById('dig-set-banner');
    const barEl = document.getElementById('dig-set-baridi');
    const prevEl = document.getElementById('dig-banner-preview');
    if (actEl) actEl.checked = admDigState.settings.isActive !== false;
    if (banEl) banEl.value = admDigState.settings.bannerImage || '';
    if (barEl) barEl.value = admDigState.settings.baridiImage || '';
    if (prevEl && admDigState.settings.bannerImage) {
        prevEl.src = admDigState.settings.bannerImage;
        prevEl.classList.remove('hidden');
    }

    renderDigitalCatalogLists();
    renderDigitalPackagesTable();
}

function renderDigitalCatalogLists() {
    const catList = document.getElementById('dig-admin-cats-list');
    const srvList = document.getElementById('dig-admin-srvs-list');
    const srvCatSel = document.getElementById('dig-srv-cat');
    const pkgSrvSel = document.getElementById('dig-pkg-srv');
    const pkgFiltSel = document.getElementById('dig-pkg-filter-srv');

    if (catList) {
        catList.innerHTML = admDigState.categories.map(c => `
            <div class="bg-white p-2 rounded-xl border text-center space-y-1">
                <img src="${c.image}" class="w-12 h-12 object-contain mx-auto rounded">
                <div class="font-bold text-[11px] truncate">${c.name}</div>
                <div class="flex gap-1">
                    <button type="button" onclick="editDigitalCategory('${c.id}')" class="text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded flex-1 font-bold cursor-pointer">تعديل</button>
                    <button type="button" onclick="deleteDigitalCategory('${c.id}')" class="text-[10px] text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded flex-1 font-bold cursor-pointer">حذف</button>
                </div>
            </div>`).join('') || '<p class="text-xs text-gray-400 col-span-full">لا توجد أقسام.</p>';
    }

    if (srvCatSel) {
        srvCatSel.innerHTML = '<option value="">-- اختر القسم الرئيسي * --</option>' +
            admDigState.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    if (srvList) {
        srvList.innerHTML = admDigState.services.map(s => {
            const catName = admDigState.categories.find(c => c.id === s.categoryId)?.name || '';
            return `
            <div class="bg-white p-2 rounded-xl border text-center space-y-1">
                <img src="${s.image}" class="w-12 h-12 object-contain mx-auto rounded">
                <div class="font-bold text-[11px] truncate">${s.name}</div>
                <div class="text-[9px] text-gray-400 truncate">${catName}</div>
                <button onclick="deleteDigitalService('${s.id}')" class="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded w-full font-bold cursor-pointer">حذف</button>
            </div>`;
        }).join('') || '<p class="text-xs text-gray-400 col-span-full">لا توجد خدمات.</p>';
    }

    const srvOpts = admDigState.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    if (pkgSrvSel) pkgSrvSel.innerHTML = '<option value="">-- اختر الخدمة / اللعبة * --</option>' + srvOpts;
    if (pkgFiltSel) pkgFiltSel.innerHTML = '<option value="all">جميع الخدمات 🌐</option>' + srvOpts;
}

export async function uploadDigitalAdminImg(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;
    const inp = document.getElementById(targetInputId);
    if (inp) inp.placeholder = 'جاري الرفع... ⏳';
    try {
        const url = await window.compressAndUploadImage(file, 'digital_assets', 900);
        if (inp) inp.value = url;
        if (targetInputId === 'dig-set-banner') {
            const prev = document.getElementById('dig-banner-preview');
            if (prev) { prev.src = url; prev.classList.remove('hidden'); }
        }
    } catch (e) {
        showCustomAlert('خطأ', 'فشل رفع الصورة.', false);
    }
}

export async function saveDigitalCategory(e) {
    e.preventDefault();
    const name = document.getElementById('dig-cat-name').value.trim();
    const image = document.getElementById('dig-cat-img').value.trim();
    const bannerImage = document.getElementById('dig-cat-banner')?.value.trim() || '';
    const order = parseInt(document.getElementById('dig-cat-order').value) || 1;

    if (admDigState.editingCatId) {
        await window.db.collection('digital_categories').doc(admDigState.editingCatId).update({
            name, image, bannerImage, order, updatedAt: new Date()
        });
        admDigState.editingCatId = '';
        showCustomAlert('تم التحديث 🎉', 'تم تحديث بيانات وبانر القسم بنجاح!', true);
    } else {
        await window.db.collection('digital_categories').add({
            name, image, bannerImage, order, isActive: true, createdAt: new Date()
        });
        showCustomAlert('تم الحفظ', 'تمت إضافة القسم بنجاح!', true);
    }
    e.target.reset();
    await fetchDigitalAdminCatalog();
}

export function editDigitalCategory(id) {
    const c = admDigState.categories.find(x => x.id === id);
    if (!c) return;
    admDigState.editingCatId = c.id;
    document.getElementById('dig-cat-name').value = c.name || '';
    document.getElementById('dig-cat-img').value = c.image || '';
    if (document.getElementById('dig-cat-banner')) document.getElementById('dig-cat-banner').value = c.bannerImage || '';
    document.getElementById('dig-cat-order').value = c.order || 1;
    document.getElementById('dig-cat-name').focus();
    showCustomAlert('وضع التعديل ✏️', `يمكنك الآن تغيير بانر أو بيانات قسم (${c.name}) ثم الضغط على "حفظ القسم".`, true);
}

export async function deleteDigitalCategory(id) {
    if (confirm('حذف هذا القسم؟')) {
        await window.db.collection('digital_categories').doc(id).delete();
        await fetchDigitalAdminCatalog();
    }
}

export async function saveDigitalService(e) {
    e.preventDefault();
    const categoryId = document.getElementById('dig-srv-cat').value;
    const name = document.getElementById('dig-srv-name').value.trim();
    const image = document.getElementById('dig-srv-img').value.trim();
    await window.db.collection('digital_services').add({ categoryId, name, image, isActive: true, createdAt: new Date() });
    e.target.reset();
    await fetchDigitalAdminCatalog();
    showCustomAlert('تم الحفظ', 'تمت إضافة الخدمة بنجاح!', true);
}

export async function deleteDigitalService(id) {
    if (confirm('حذف هذه الخدمة؟')) {
        await window.db.collection('digital_services').doc(id).delete();
        await fetchDigitalAdminCatalog();
    }
}

// 4. صانع الحقول وإدارة الباقات
export function toggleDigitalCustomQtyInputs() {
    const mode = document.getElementById('dig-pkg-qtymode')?.value;
    const box = document.getElementById('dig-custom-qty-box');
    if (box) box.classList.toggle('hidden', mode !== 'custom');
}

export function addDigitalFieldPreset(label, type = 'text', options = []) {
    admDigState.pkgFields.push({ label, type, options });
    renderDigitalPkgFieldsBuilder();
}

export function removeDigitalPkgField(idx) {
    admDigState.pkgFields.splice(idx, 1);
    renderDigitalPkgFieldsBuilder();
}

export function updateDigitalPkgField(idx, key, val) {
    if (!admDigState.pkgFields[idx]) return;
    if (key === 'options') {
        admDigState.pkgFields[idx].options = val.split(/[,،]/).map(s => s.trim()).filter(Boolean);
    } else {
        admDigState.pkgFields[idx][key] = val;
    }
}

function renderDigitalPkgFieldsBuilder() {
    const container = document.getElementById('dig-pkg-fields-list');
    if (!container) return;
    if (admDigState.pkgFields.length === 0) {
        container.innerHTML = '<p class="text-[11px] text-gray-400">لا توجد حقول مطلوبة (سيُطلب من الزبون الاسم ورقم الواتساب ووصل الدفع فقط).</p>';
        return;
    }
    container.innerHTML = admDigState.pkgFields.map((f, i) => `
        <div class="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg border">
            <input type="text" value="${f.label}" oninput="updateDigitalPkgField(${i}, 'label', this.value)" placeholder="اسم الحقل (مثال: أيدي اللاعب)" class="flex-1 border p-1.5 rounded text-xs bg-white">
            ${f.type === 'select' ? `<input type="text" value="${(f.options || []).join(', ')}" oninput="updateDigitalPkgField(${i}, 'options', this.value)" placeholder="الخيارات مفصولة بفاصلة" class="flex-1 border p-1.5 rounded text-xs bg-white">` : ''}
            <button type="button" onclick="removeDigitalPkgField(${i})" class="text-red-500 hover:text-red-700 px-2 py-1 cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('');
}

export async function saveDigitalPackage(e) {
    e.preventDefault();
    const data = {
        serviceId: document.getElementById('dig-pkg-srv').value,
        name: document.getElementById('dig-pkg-name').value.trim(),
        subGroup: document.getElementById('dig-pkg-subgroup').value.trim(),
        price: parseFloat(document.getElementById('dig-pkg-price').value) || 0,
        oldPrice: document.getElementById('dig-pkg-oldprice').value ? parseFloat(document.getElementById('dig-pkg-oldprice').value) : null,
        discountBadge: document.getElementById('dig-pkg-badge').value.trim(),
        image: document.getElementById('dig-pkg-img').value.trim(),
        qtyMode: document.getElementById('dig-pkg-qtymode').value,
        minQty: parseInt(document.getElementById('dig-pkg-minqty').value) || 1,
        stepQty: parseInt(document.getElementById('dig-pkg-stepqty').value) || 1,
        notes: document.getElementById('dig-pkg-notes').value.trim(),
        fields: admDigState.pkgFields.filter(f => f.label && f.label.trim() !== ''),
        isActive: true,
        updatedAt: new Date()
    };

    if (admDigState.editingPkgId) {
        await window.db.collection('digital_packages').doc(admDigState.editingPkgId).update(data);
        showCustomAlert('تم التحديث', 'تم تحديث الباقة بنجاح!', true);
    } else {
        data.createdAt = new Date();
        await window.db.collection('digital_packages').add(data);
        showCustomAlert('تم الحفظ', 'تمت إضافة الباقة الجديدة بنجاح!', true);
    }
    resetDigitalPkgForm();
    await fetchDigitalAdminCatalog();
}

export function editDigitalPackage(id) {
    const p = admDigState.packages.find(x => x.id === id);
    if (!p) return;
    admDigState.editingPkgId = p.id;
    document.getElementById('dig-pkg-srv').value = p.serviceId || '';
    document.getElementById('dig-pkg-name').value = p.name || '';
    document.getElementById('dig-pkg-subgroup').value = p.subGroup || '';
    document.getElementById('dig-pkg-price').value = p.price || 0;
    document.getElementById('dig-pkg-oldprice').value = p.oldPrice || '';
    document.getElementById('dig-pkg-badge').value = p.discountBadge || '';
    document.getElementById('dig-pkg-img').value = p.image || '';
    document.getElementById('dig-pkg-qtymode').value = p.qtyMode || 'fixed';
    document.getElementById('dig-pkg-minqty').value = p.minQty || 500;
    document.getElementById('dig-pkg-stepqty').value = p.stepQty || 100;
    document.getElementById('dig-pkg-notes').value = p.notes || '';
    admDigState.pkgFields = Array.isArray(p.fields) ? JSON.parse(JSON.stringify(p.fields)) : [];

    toggleDigitalCustomQtyInputs();
    renderDigitalPkgFieldsBuilder();
    document.getElementById('dig-pkg-form-title').innerText = 'تعديل الباقة: ' + p.name;
    document.getElementById('dig-pkg-cancel-btn').classList.remove('hidden');
}

export function resetDigitalPkgForm() {
    admDigState.editingPkgId = '';
    admDigState.pkgFields = [];
    const f = document.getElementById('dig-pkg-form');
    if (f) f.reset();
    toggleDigitalCustomQtyInputs();
    renderDigitalPkgFieldsBuilder();
    const title = document.getElementById('dig-pkg-form-title');
    if (title) title.innerHTML = '<i class="fa-solid fa-box"></i> إضافة / تعديل باقة شحن';
    document.getElementById('dig-pkg-cancel-btn')?.classList.add('hidden');
}

export function renderDigitalPackagesTable() {
    const tbody = document.getElementById('dig-admin-pkgs-tbody');
    const filterSrv = document.getElementById('dig-pkg-filter-srv')?.value || 'all';
    if (!tbody) return;

    let list = admDigState.packages;
    if (filterSrv !== 'all') list = list.filter(p => p.serviceId === filterSrv);

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-400">لا توجد باقات مضافة.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(p => {
        const srvName = admDigState.services.find(s => s.id === p.serviceId)?.name || '-';
        const fCount = Array.isArray(p.fields) ? p.fields.length : 0;
        return `
            <tr class="hover:bg-gray-50">
                <td class="p-3 font-bold">${p.name} ${p.subGroup ? `<span class="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">${p.subGroup}</span>` : ''}</td>
                <td class="p-3 text-gray-600">${srvName}</td>
                <td class="p-3 font-black text-[#B8860B]">${Number(p.price || 0).toLocaleString()} دج</td>
                <td class="p-3 text-gray-500">${fCount > 0 ? fCount + ' حقول' : 'بدون حقول'}</td>
                <td class="p-3 text-center">
                    <button onclick="editDigitalPackage('${p.id}')" class="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg ml-1 cursor-pointer">تعديل</button>
                    <button onclick="deleteDigitalPackage('${p.id}')" class="bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-lg cursor-pointer">حذف</button>
                </td>
            </tr>`;
    }).join('');
}

export async function deleteDigitalPackage(id) {
    if (confirm('حذف هذه الباقة نهائياً؟')) {
        await window.db.collection('digital_packages').doc(id).delete();
        await fetchDigitalAdminCatalog();
    }
}

export async function saveDigitalSettings() {
    const isActive = document.getElementById('dig-set-active')?.checked !== false;
    const bannerImage = document.getElementById('dig-set-banner')?.value.trim() || '';
    const baridiImage = document.getElementById('dig-set-baridi')?.value.trim() || '';
    await window.db.collection('digital_settings').doc('main').set({ isActive, bannerImage, baridiImage, updatedAt: new Date() }, { merge: true });
    showCustomAlert('تم الحفظ 🎉', 'تم تحديث البانر وإعدادات الخدمات الإلكترونية بنجاح!', true);
}

// التصدير للـ Window
window.loadDigitalAdminData = loadDigitalAdminData;
window.switchDigitalSubTab = switchDigitalSubTab;
window.renderDigitalOrdersTable = renderDigitalOrdersTable;
window.copyDigitalText = copyDigitalText;
window.updateDigitalOrderStatus = updateDigitalOrderStatus;
window.deleteDigitalOrder = deleteDigitalOrder;
window.uploadDigitalAdminImg = uploadDigitalAdminImg;
window.saveDigitalCategory = saveDigitalCategory;
window.editDigitalCategory = editDigitalCategory;
window.deleteDigitalCategory = deleteDigitalCategory;
window.saveDigitalService = saveDigitalService;
window.deleteDigitalService = deleteDigitalService;
window.toggleDigitalCustomQtyInputs = toggleDigitalCustomQtyInputs;
window.addDigitalFieldPreset = addDigitalFieldPreset;
window.removeDigitalPkgField = removeDigitalPkgField;
window.updateDigitalPkgField = updateDigitalPkgField;
window.saveDigitalPackage = saveDigitalPackage;
window.editDigitalPackage = editDigitalPackage;
window.resetDigitalPkgForm = resetDigitalPkgForm;
window.renderDigitalPackagesTable = renderDigitalPackagesTable;
window.deleteDigitalPackage = deleteDigitalPackage;
window.saveDigitalSettings = saveDigitalSettings;
