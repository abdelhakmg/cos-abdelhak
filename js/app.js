// js/app.js - التحكم العام بالمتجر

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

function validatePhoneInput(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 10) val = val.substring(0, 10);
    input.value = val;
}

function isAlgerianPhoneValid(phone) {
    return /^(05|06|07)[0-9]{8}$/.test(phone);
}

function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'cart') renderCart();
    if (pageId === 'wishlist') renderWishlistPage();
}

function renderSingleProductCard(p) {
    const isFav = favorites.includes(p.id);
    return `
        <div class="gold-glow-card rounded-3xl p-4 text-right flex flex-col justify-between">
            <button onclick="toggleFavorite('${p.id}')" class="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 border border-[#D4AF37]/30 flex items-center justify-center text-gray-400 hover:text-red-500">
                <i class="${isFav ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart'}"></i>
            </button>
            <div>
                <div class="h-48 bg-black/50 rounded-2xl p-2 mb-3 flex items-center justify-center cursor-pointer" onclick="openBottomSheet('${p.id}')">
                    <img src="${p.images[0]}" class="max-h-full object-contain">
                </div>
                <h3 class="font-bold text-sm text-white truncate my-1">${p.name}</h3>
                <span class="font-black text-base gold-text">${p.price.toLocaleString()} دج</span>
            </div>
            <div class="space-y-2 pt-2">
                <button onclick="openBottomSheet('${p.id}')" class="w-full py-3 gold-gradient text-black font-extrabold text-xs rounded-xl">شراء سريع الآن ⚡</button>
            </div>
        </div>
    `;
}

function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(f => f !== id);
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
    grid.innerHTML = favProducts.length === 0 ? 
        '<p class="col-span-full text-center text-gray-400 py-12">لا توجد منتجات بالمفعلة.</p>' :
        favProducts.map(p => renderSingleProductCard(p)).join('');
}

function updateBadges() {
    const cB = document.getElementById('cart-badge');
    const wB = document.getElementById('wishlist-badge');
    if (cB) cB.innerText = cart.length;
    if (wB) wB.innerText = favorites.length;
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
        cartList.innerHTML = '<p class="text-center text-gray-400 py-8">السلة فارغة.</p>';
        calculateCartTotal();
        return;
    }

    cartList.innerHTML = cart.map((item, idx) => `
        <div class="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
                <h4 class="font-bold text-sm text-white">${item.name}</h4>
                <span class="text-xs text-[#D4AF37] font-bold">${item.price.toLocaleString()} دج</span>
            </div>
            <button onclick="removeFromCart(${idx})" class="text-red-500 text-xs font-bold">حذف</button>
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
    if (!isAlgerianPhoneValid(phone)) return showCustomAlert('خطأ', 'يرجى إدخال رقم هاتف جزائري مكون من 10 أرقام (05/06/07).', false);
    if (!wilayaCode) return showCustomAlert('تنبيه', 'يرجى اختيار الولاية!', false);

    const wilaya = WILAYAS.find(w => w.code === wilayaCode);
    orders.push({ customer: name, phone, wilaya: wilaya.name, product: 'سلة المتجر', total: cart.reduce((s,i)=>s+i.price,0) + wilaya.homeCost });

    cart = [];
    localStorage.setItem('lb_cart_v7', JSON.stringify(cart));
    showCustomAlert('تم الطلب 🎉', 'تم إرسال الطلب بنجاح!', true);
    showPage('home');
}

function renderProducts() {
    const grid = document.getElementById('home-products');
    if (grid) grid.innerHTML = products.map(p => renderSingleProductCard(p)).join('');
}

// التدوير الديناميكي للزبائن الذين اشتروا
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
    }, 10000);
}

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateBadges();
    initRealOrdersTicker();
});
