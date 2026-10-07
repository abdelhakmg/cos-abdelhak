function showPage(pageId) {
    document.querySelectorAll('.page-sec').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'admin') renderAdminDashboard();
    if (pageId === 'cart') renderCart();
}

function renderProducts() {
    const grid = document.getElementById('home-products');
    const catGrid = document.getElementById('catalog-products');

    const html = products.map(p => `
        <div class="bg-white rounded-2xl border p-4 text-right flex flex-col justify-between shadow-sm">
            <div class="h-44 bg-gray-50 rounded-xl p-2 mb-3 flex items-center justify-center cursor-pointer" onclick="openLandingPage(${p.id})">
                <img src="${p.image}" class="max-h-full object-contain">
            </div>
            <div>
                <span class="text-[10px] bg-gold-500/10 text-[#B8860B] font-bold px-2 py-0.5 rounded">${p.category}</span>
                <h3 class="font-bold text-sm my-1 truncate">${p.name}</h3>
                <div class="font-black text-[#B8860B] mb-3">${p.price.toLocaleString()} دج</div>
            </div>
            <button onclick="openLandingPage(${p.id})" class="w-full py-2.5 gold-gradient text-black font-extrabold text-xs rounded-xl shadow-md">اطلب الآن 🔥</button>
        </div>
    `).join('');

    if (grid) grid.innerHTML = html;
    if (catGrid) catGrid.innerHTML = html;

    // Render Navigation Categories
    document.getElementById('header-nav').innerHTML = categories.map(c => 
        `<button onclick="showPage('catalog')" class="text-gray-300 hover:text-[#D4AF37] transition">${c}</button>`
    ).join('');
}

function renderCart() {
    const container = document.getElementById('cart-list');
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">السلة فارغة حالياً</p>';
        document.getElementById('subtotal').innerText = '0 دج';
        document.getElementById('total').innerText = '0 دج';
        return;
    }
    let subtotal = 0;
    container.innerHTML = cart.map((item, idx) => {
        subtotal += item.price;
        return `
            <div class="flex items-center justify-between border-b pb-4">
                <div class="flex items-center gap-4">
                    <img src="${item.image}" class="w-16 h-16 object-cover rounded-lg border">
                    <div class="text-right">
                        <h4 class="font-bold text-sm">${item.name}</h4>
                        <span class="text-xs text-[#B8860B] font-bold">${item.price.toLocaleString()} دج</span>
                    </div>
                </div>
                <button onclick="cart.splice(${idx},1); renderCart();" class="text-red-500 text-xs font-bold">حذف</button>
            </div>
        `;
    }).join('');
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + ' دج';
    document.getElementById('total').innerText = Math.max(0, subtotal + 500 - 1000).toLocaleString() + ' دج';
    document.getElementById('cart-badge').innerText = cart.length;
}

// Initial Run
renderProducts();
