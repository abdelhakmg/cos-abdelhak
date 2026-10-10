// js/app.js - إدارة المنطق العام والمبيعات

let logoClickCount = 0;
let logoClickTimer = null;

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
        const modal = document.getElementById('admin-auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
        }
    }
}

function handleGiftSection() {
    showCustomAlert('هديتك 🎁', 'قريباً! نجهز لكم مفاجآت وقسائم هدايا مميزة لزبائننا الكرام.', true);
}

// حصر وتقييد الأرقام المكتوبة للأرقام الجزائرية فقط (10 أرقام تبدأ بـ 05/06/07)
function validatePhoneInput(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 10) val = val.substring(0, 10);
    input.value = val;
}

function isAlgerianPhoneValid(phone) {
    const regex = /^(05|06|07)[0-9]{8}$/;
    return regex.test(phone);
}

function handleLiveSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    
    const q = query.trim().toLowerCase();
    if (!q) {
        if (dropdown) dropdown.classList.add('hidden');
        if (mobileDropdown) mobileDropdown.classList.add('hidden');
        return;
    }

    const matches = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 5);

    let htmlContent = '';
    if (matches.length === 0) {
        htmlContent = '<div class="p-4 text-xs text-amber-400 text-center leading-relaxed">المنتج غير متوفر، تأكد من البحث عنه يدويا من الفئات حسب نوعية المنتج</div>';
    } else {
        htmlContent = matches.map(p => `
            <div onclick="openBottomSheet('${p.id}'); hideAllDropdowns();" class="flex items-center gap-3 p-3 hover:bg-[#1e1e1e] cursor-pointer transition border-b border-gray-800">
                <img src="${(p.images && p.images[0]) || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-contain rounded-lg bg-black">
                <div class="text-right">
                    <p class="text-xs font-bold text-white truncate">${p.name}</p>
                    <p class="text-[10px] text-[#D4AF37] font-bold">${p.price.toLocaleString()} دج</p>
                </div>
            </div>
        `).join('');
    }

    if (dropdown) {
        dropdown.innerHTML = htmlContent;
        dropdown.classList.remove('hidden');
    }
    if (mobileDropdown) {
        mobileDropdown.innerHTML = htmlContent;
        mobileDropdown.classList.remove('hidden');
    }
}

function handleSearchKeydown(event, query) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const q = query.trim().toLowerCase();
        if (!q) return;
        const found = products.find(p => p.name && p.name.toLowerCase().includes(q));
        hideAllDropdowns();
        if (found) {
            openBottomSheet(found.id);
        } else {
            showCustomAlert('غير متوفر', 'المنتج غير متوفر، تأكد من البحث عنه يدويا من الفئات حسب نوعية المنتج', false);
        }
    }
}

function hideAllDropdowns() {
    const dropdown = document.getElementById('search-results-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (mobileDropdown) mobileDropdown.classList.add('hidden');
}

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin' && typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (pageId === 'cart') renderCart();
    if (pageId === 'wishlist') renderWishlistPage();
}

function renderSingleProductCard(p) {
    const displayImg = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/300';
    const isFav = favorites.includes(p.id);

    return `
        <div class="gold-glow-card rounded-3xl p-4 text-right flex flex-col justify-between group">
            <button onclick="toggleFavorite('${p.id}')" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 border border-[#D4AF37]/30 shadow flex items-center justify-center text-gray-400 hover:text-red-500 transition z-10 backdrop-blur-md">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>

            <div>
                <div class="h-48 bg-black/50 rounded-2xl p-2 mb-3 flex items-center justify-center cursor-pointer overflow-hidden border border-gray-800/80" onclick="openBottomSheet('${p.id}')">
                    <img src="${displayImg}" class="max-h-full object-contain group-hover:scale-110 transition duration-500">
                </div>

                <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="w-2 h-2 rounded-full ${p.inStock ? 'bg-green-500' : 'bg-red-500'}"></span>
                    <span class="text-[10px] font-bold ${p.inStock ? 'text-green-400' : 'text-red-400'}">${p.inStock ? 'متوفر بالمخزون' : 'غير متوفر'}</span>
                </div>

                <h3 class="font-bold text-sm text-white truncate my-1 cursor-pointer group-hover:text-[#D4AF37] transition" onclick="openBottomSheet('${p.id}')">${p.name}</h3>

                <div class="flex items-center gap-2 mb-2">
                    <span class="font-black text-base gold-text">${p.price ? p.price.toLocaleString() : 0} دج</span>
                    ${p.oldPrice ? `<span class="text-xs text-gray-500 line-through">${p.oldPrice.toLocaleString()} دج</span>` : ''}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <button onclick="openBottomSheet('${p.id}')" class="w-full py-3 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2">
                    شراء سريع الآن ⚡
                </button>
            </div>
        </div>
    `;
}

function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('lb_favs_v7', JSON.stringify(favorites));
    updateBadges();
    renderProducts();
}

function renderWishlistPage() {
    const grid = document.getElementById('wishlist-products-grid');
    if (!grid) return;

    const favProducts = products.filter(p => favorites.includes(p.id));
    if (favProducts.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-12">لم تقم بإضافة أي منتج للمفضلة بعد.</p>';
    } else {
        grid.innerHTML = favProducts.map(p => renderSingleProductCard(p)).join('');
    }
}

function updateBadges() {
    const cartBadge = document.getElementById('cart-badge');
    const wishBadge = document.getElementById('wishlist-badge');
    if (cartBadge) cartBadge.innerText = cart.length;
    if (wishBadge) wishBadge.innerText = favorites.length;
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    const select = document.getElementById('cart-cust-wilaya');

    if (select && select.options.length <= 1) {
        select.innerHTML = '<option value="">اختر الولاية...</option>' + 
            WILAYAS.map(w => `<option value="${w.code}">${w.code} - ${w.name}</option>`).join('');
    }

    if (!cartList) return;

    if (cart.length === 0) {
        cartList.innerHTML = '<p class="text-center text-gray-400 py-8">سلة التسوق فارغة حالياً.</p>';
        calculateCartTotal();
        return;
    }

    cartList.innerHTML = cart.map((item, idx) => `
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
                <h4 class="font-bold text-sm text-white">${item.name}</h4>
                <span class="text-xs text-[#D4AF37] font-bold">${item.price.toLocaleString()} دج</span>
            </div>
            <button onclick="removeFromCart(${idx})" class="text-red-500 font-bold text-xs"><i class="fa-solid fa-trash"></i> حذف</button>
        </div>
    `).join('');

    calculateCartTotal();
}

function handleCartWilayaChange() {
    const code = document.getElementById('cart-cust-wilaya').value;
    const wilaya = WILAYAS.find(w => w.code === code);
    const communeSelect = document.getElementById('cart-cust-commune');

    if (wilaya && communeSelect) {
        communeSelect.innerHTML = wilaya.communes.map(c => `<option value="${c}">${c}</option>`).join('');
    } else if (communeSelect) {
        communeSelect.innerHTML = '<option value="">اختر البلدية...</option>';
    }
    calculateCartTotal();
}

function calculateCartTotal() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const wilayaCode = document.getElementById('cart-cust-wilaya')?.value;
    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const shipType = document.querySelector('input[name="cart_shipping_type"]:checked')?.value || 'home';

    let shipCost = wilaya ? (shipType === 'home' ? wilaya.homeCost : wilaya.officeCost) : 0;

    const subEl = document.getElementById('subtotal');
    const shipEl = document.getElementById('shipping-cost');
    const totalEl = document.getElementById('total');

    if (subEl) subEl.innerText = subtotal.toLocaleString() + ' دج';
    if (shipEl) shipEl.innerText = wilaya ? shipCost.toLocaleString() + ' دج' : '0 دج (حدد الولاية)';
    if (totalEl) totalEl.innerText = (subtotal + shipCost).toLocaleString() + ' دج';
}

function submitCartCheckout() {
    if (cart.length === 0) return showCustomAlert('تنبيه', 'السلة فارغة!', false);

    const name = document.getElementById('cart-cust-name').value.trim();
    const phone = document.getElementById('cart-cust-phone').value.trim();
    const wilayaCode = document.getElementById('cart-cust-wilaya').value;

    if (!name) return showCustomAlert('تنبيه', 'يرجى إدخال الاسم!', false);
    if (!isAlgerianPhoneValid(phone)) return showCustomAlert('خطأ', 'يرجى إدخال رقم هاتف جزائري صحيح (10 أرقام تبدأ بـ 05/06/07).', false);
    if (!wilayaCode) return showCustomAlert('تنبيه', 'يرجى اختيار الولاية!', false);

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    const total = cart.reduce((s, i) => s + i.price, 0) + wilaya.homeCost;

    orders.push({ customer: name, phone, wilaya: wilaya.name, product: 'سلة المنتجات', total });
    cart = [];
    localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
    showCustomAlert('تم الطلب 🎉', 'تم تسليم طلبك بنجاح!', true);
    showPage('home');
}

function renderProducts() {
    const grid = document.getElementById('home-products');
    const catGrid = document.getElementById('catalog-products');
    if (!grid) return;

    const cardsHtml = products.map(p => renderSingleProductCard(p)).join('');

    grid.innerHTML = cardsHtml;
    if (catGrid) catGrid.innerHTML = cardsHtml;
}

// النافذة المنبثقة التفاعلية (تتغير بين جميع الطلبيات المسجلة للزبائن)
function initRealOrdersTicker() {
    const toast = document.getElementById('social-proof-toast');
    const spCustomer = document.getElementById('sp-customer');
    const spProduct = document.getElementById('sp-product');
    if (!toast || !spCustomer || !spProduct) return;

    let orderIdx = 0;
    setInterval(() => {
        if (!orders || orders.length === 0) return;
        const ord = orders[orderIdx % orders.length];
        orderIdx++;

        spCustomer.innerText = `${ord.customer} من ${ord.wilaya}`;
        spProduct.innerText = `اشترى ${ord.product} منذ قليل`;

        toast.classList.remove('translate-y-28', 'opacity-0');
        setTimeout(() => toast.classList.add('translate-y-28', 'opacity-0'), 4000);
    }, 12000);
}

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateBadges();
    initRealOrdersTicker();
});
