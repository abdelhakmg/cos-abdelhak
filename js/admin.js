function renderCategorySpecificAdminFields() {
    const catSelect = document.getElementById('prod-category-select');
    const container = document.getElementById('category-dynamic-fields-container');
    if (!catSelect || !container) return;

    const selectedCategory = (catSelect.value || '').trim().toLowerCase();

    let html = '';

    if (selectedCategory.includes('كوسمتيك')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">✨ خصائص قسم الكوسمتيك:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">منطقة الاستخدام:</label>
                        <select id="prod-cosmetic-area" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="للوجه">للوجه</option>
                            <option value="للجسد">للجسد</option>
                            <option value="للشعر">للشعر</option>
                            <option value="للتدليك والعناية">للتدليك والعناية (يدين وقدمين)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع المنتج الفرعي:</label>
                        <input type="text" id="prod-cosmetic-type" placeholder="مثال: شامبو، جل دش، كريم مرطب..." class="w-full border p-2.5 rounded-xl text-xs bg-white">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-2">أنواع البشرة المناسبة:</label>
                        <div id="admin-prod-skin-checkboxes" class="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border max-h-32 overflow-y-auto text-xs"></div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-2">أنواع الشعر المناسبة:</label>
                        <div id="admin-prod-hair-checkboxes" class="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border max-h-32 overflow-y-auto text-xs"></div>
                    </div>
                </div>
            </div>
        `;
    } else if (selectedCategory.includes('بلاكيور') || selectedCategory.includes('اصي')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">💍 خصائص قسم بلاكيور + أسي:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع المعدن *</label>
                        <select id="prod-jewelry-metal" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="بلاكيور أور">بلاكيور أور</option>
                            <option value="أسي إينوكسيدابل / Steel">أسي إينوكسيدابل / Steel</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع القطعة *</label>
                        <select id="prod-jewelry-type" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="سلسلة">سلسلة</option>
                            <option value="خاتم">خاتم</option>
                            <option value="قورمات">قورمات</option>
                            <option value="بارور">بارور</option>
                            <option value="مناقش">مناقش</option>
                            <option value="خلخال">خلخال</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    } else if (selectedCategory === 'علب' || selectedCategory.includes('علب')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🎁 خصائص قسم العلب:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">شكل ومادة الصندوق *</label>
                    <select id="prod-giftbox-shape" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="شكل قلب">شكل قلب</option>
                        <option value="شكل مربع">شكل مربع</option>
                        <option value="شكل مستطيل">شكل مستطيل</option>
                        <option value="شكل رسالة">شكل رسالة</option>
                        <option value="شكل دائري">شكل دائري</option>
                        <option value="علب فوركس">علب فوركس</option>
                        <option value="علب زجاج">علب زجاج</option>
                        <option value="صاك كرتون">صاك كرتون</option>
                        <option value="صاك شفاف">صاك شفاف</option>
                        <option value="PMMA">PMMA</option>
                    </select>
                </div>
            </div>
        `;
    } else if (selectedCategory.includes('مايكاب')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">💄 خصائص قسم المايكاب:</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع منتج المايكاب *</label>
                        <select id="prod-makeup-type" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                            <option value="فوندوتان">فوندوتان</option>
                            <option value="كونسيلر">كونسيلر</option>
                            <option value="ماسكارا">ماسكارا</option>
                            <option value="طراسور">طراسور</option>
                            <option value="روج لافر">روج لافر</option>
                            <option value="قلوص">قلوص</option>
                            <option value="هايلايتر">هايلايتر</option>
                            <option value="كونتور">كونتور</option>
                            <option value="بالات">بالات</option>
                            <option value="برايمر">برايمر</option>
                            <option value="ليوناغ">ليوناغ</option>
                            <option value="فرشاة">فرشاة</option>
                            <option value="بونجة">بونجة</option>
                            <option value="آلات">آلات</option>
                            <option value="أشفار">أشفار</option>
                            <option value="أظافر">أظافر</option>
                            <option value="لسقة أشفار">لسقة أشفار</option>
                            <option value="لسقة أظافر">لسقة أظافر</option>
                            <option value="فلامينغو">فلامينغو</option>
                            <option value="فارني">فارني</option>
                            <option value="أخرى">أخرى</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-2">نوع البشرة المناسبة:</label>
                        <div id="admin-prod-skin-checkboxes" class="grid grid-cols-2 gap-2 bg-white p-2 rounded-xl border max-h-28 overflow-y-auto text-xs"></div>
                    </div>
                </div>
            </div>
        `;
    } else if (selectedCategory.includes('عطور')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🌸 خصائص قسم العطور:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">فئة العطر والاستخدام *</label>
                    <select id="prod-perfume-target" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="نساء">نساء</option>
                        <option value="رجال">رجال</option>
                        <option value="أطفال">أطفال</option>
                        <option value="للجنسين">للجنسين</option>
                        <option value="عطور جسم">عطور جسم</option>
                        <option value="عطور غرف">عطور غرف</option>
                        <option value="عطور ملابس">عطور ملابس</option>
                        <option value="عطور سيارات">عطور سيارات</option>
                    </select>
                </div>
            </div>
        `;
    } else if (selectedCategory.includes('اكسسوارات شعر')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🎀 خصائص قسم إكسسوارات الشعر:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">نوع الإكسسوار *</label>
                    <select id="prod-hairacc-type" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="مساك">مساك</option>
                        <option value="شوشو">شوشو</option>
                        <option value="كخاب">كخاب</option>
                        <option value="بوندانة">بوندانة</option>
                        <option value="سيغتات">سيغتات</option>
                        <option value="مناقش">مناقش</option>
                        <option value="سنسلة">سنسلة</option>
                        <option value="خاتم">خاتم</option>
                        <option value="قورمات">قورمات</option>
                        <option value="خلخال">خلخال</option>
                    </select>
                </div>
            </div>
        `;
    } else if (selectedCategory === 'هدايا' || selectedCategory.includes('هدايا')) {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border space-y-3">
                <h4 class="font-bold text-xs text-[#B8860B]">🎁 خصائص قسم الهدايا:</h4>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">نوع ومناسبة الهدية *</label>
                    <select id="prod-gift-occasion" class="w-full border p-2.5 rounded-xl text-xs bg-white">
                        <option value="رجالية">رجالية</option>
                        <option value="نسائية">نسائية</option>
                        <option value="بوكي ورد">بوكي ورد</option>
                        <option value="بيبي">بيبي</option>
                        <option value="تغليف">تغليف</option>
                    </select>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="bg-gray-50 p-4 rounded-xl border text-center text-xs text-gray-500">
                هذا القسم ينطبق على الخصائص المباشرة للمنتج (السعر والتوافر).
            </div>
        `;
    }

    container.innerHTML = html;

    const skinCbContainer = document.getElementById('admin-prod-skin-checkboxes');
    if (skinCbContainer && typeof availableSkinTypes !== 'undefined') {
        skinCbContainer.innerHTML = availableSkinTypes.map(st => `
            <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" value="${st}" class="prod-skin-cb accent-[#D4AF37]">
                <span>${st}</span>
            </label>
        `).join('');
    }

    const hairCbContainer = document.getElementById('admin-prod-hair-checkboxes');
    if (hairCbContainer && typeof availableHairTypes !== 'undefined') {
        hairCbContainer.innerHTML = availableHairTypes.map(ht => `
            <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" value="${ht}" class="prod-hair-cb accent-[#D4AF37]">
                <span>${ht}</span>
            </label>
        `).join('');
    }
}
